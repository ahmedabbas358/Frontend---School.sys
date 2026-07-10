import { EntityLedgerRecord, JournalEntry } from '../types';
import { EventType } from '../engine/PostingRules';

export class EntityLedger {
  private records: Map<string, EntityLedgerRecord> = new Map(); // entityId -> Record

  public registerEntity(entityId: string, entityType: EntityLedgerRecord['entityType']) {
    if (!this.records.has(entityId)) {
      this.records.set(entityId, {
        entityId,
        entityType,
        balance: 0
      });
    }
  }

  public getEntityBalance(entityId: string): number {
    return this.records.get(entityId)?.balance || 0;
  }

  /**
   * Scans a journal entry to update specific entity balances.
   * If a student is billed (Debit Accounts Receivable), their balance (amount they owe) increases.
   * If a student pays (Credit Accounts Receivable), their balance decreases.
   */
  public updateFromJournalEntry(entry: JournalEntry) {
    for (const line of entry.lines) {
      if (line.entityId) {
        const record = this.records.get(line.entityId);
        if (record) {
          // For Receivables (Students/Parents): Debit increases debt, Credit decreases debt
          // For Payables (Vendors/Employees): Credit increases our debt to them, Debit decreases it.
          
          if (record.entityType === 'STUDENT' || record.entityType === 'PARENT') {
            record.balance += line.debit;
            record.balance -= line.credit;
          } else if (record.entityType === 'VENDOR' || record.entityType === 'EMPLOYEE') {
            record.balance += line.credit;
            record.balance -= line.debit;
          }
          
          this.records.set(line.entityId, record);
        }
      }
    }
  }
}
