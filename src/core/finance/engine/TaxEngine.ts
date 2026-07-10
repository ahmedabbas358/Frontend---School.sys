export enum TaxType {
  VAT = 'VAT',
  GST = 'GST',
  WITHHOLDING = 'WITHHOLDING',
  EXEMPT = 'EXEMPT'
}

export interface TaxRule {
  id: string;
  type: TaxType;
  ratePercentage: number;
  countryCode: string;
}

export class TaxEngine {
  private rules: Map<string, TaxRule> = new Map();

  public registerRule(rule: TaxRule) {
    this.rules.set(rule.id, rule);
  }

  /**
   * Calculates the tax amount for a given base amount and tax rule.
   */
  public calculateTax(baseAmount: number, ruleId: string): number {
    const rule = this.rules.get(ruleId);
    if (!rule || rule.type === TaxType.EXEMPT) {
      return 0;
    }
    
    // Tax = (Base * Rate) / 100
    const taxAmount = (baseAmount * rule.ratePercentage) / 100;
    return Math.round(taxAmount * 100) / 100; // Round to 2 decimals
  }

  /**
   * Returns the total amount including tax.
   */
  public getGrossAmount(baseAmount: number, ruleId: string): number {
    const taxAmount = this.calculateTax(baseAmount, ruleId);
    return baseAmount + taxAmount;
  }
}
