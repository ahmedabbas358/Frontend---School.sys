import { CostCenter, JournalEntryLine } from '../types';

export class CostCenterEngine {
  private costCenters: Map<string, CostCenter> = new Map();
  private allocations: Map<string, number> = new Map(); // costCenterId -> Balance

  public registerCostCenter(center: CostCenter) {
    this.costCenters.set(center.id, center);
    this.allocations.set(center.id, 0);
  }

  public getCostCenter(id: string): CostCenter | undefined {
    return this.costCenters.get(id);
  }

  public getBalance(id: string): number {
    return this.allocations.get(id) || 0;
  }

  /**
   * Scans a journal entry line to allocate revenue or expenses to a cost center.
   * Debits (Expenses) increase cost center balance (how much it cost us).
   * Credits (Revenues) decrease the cost center balance (how much it made us).
   * Note: This is a simplified approach. Some systems separate cost and revenue tracking.
   */
  public allocateFromLine(line: JournalEntryLine) {
    if (line.costCenterId) {
      const current = this.allocations.get(line.costCenterId) || 0;
      // Debit = Expense (adds to cost), Credit = Revenue (subtracts from cost)
      const newBalance = current + line.debit - line.credit;
      this.allocations.set(line.costCenterId, newBalance);
    }
  }

  /**
   * Generates a profitability report by Cost Center
   */
  public getProfitabilityReport(): { centerName: string; netCost: number }[] {
    const report: { centerName: string; netCost: number }[] = [];
    this.allocations.forEach((balance, id) => {
      const center = this.costCenters.get(id);
      if (center) {
        report.push({ centerName: center.name, netCost: balance });
      }
    });
    return report;
  }
}
