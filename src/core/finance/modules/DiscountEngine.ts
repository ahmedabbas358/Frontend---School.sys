export enum DiscountType {
  SIBLING = 'SIBLING',
  SCHOLARSHIP = 'SCHOLARSHIP',
  EARLY_PAYMENT = 'EARLY_PAYMENT',
  EMPLOYEE_CHILD = 'EMPLOYEE_CHILD',
  SEASONAL = 'SEASONAL'
}

export interface DiscountRule {
  id: string;
  type: DiscountType;
  percentageOff?: number; // e.g. 10 for 10%
  fixedAmountOff?: number; // e.g. 500 for $500 off
  isActive: boolean;
}

export class DiscountEngine {
  private rules: Map<string, DiscountRule> = new Map();

  public registerRule(rule: DiscountRule) {
    this.rules.set(rule.id, rule);
  }

  /**
   * Applies all eligible discounts to a base amount.
   * Logic handles stacked percentages and fixed amounts.
   */
  public applyDiscounts(baseAmount: number, eligibleRuleIds: string[]): number {
    let currentAmount = baseAmount;

    // Apply fixed amount discounts first
    for (const ruleId of eligibleRuleIds) {
      const rule = this.rules.get(ruleId);
      if (rule && rule.isActive && rule.fixedAmountOff) {
        currentAmount -= rule.fixedAmountOff;
      }
    }

    if (currentAmount < 0) currentAmount = 0;

    // Then apply percentage discounts
    for (const ruleId of eligibleRuleIds) {
      const rule = this.rules.get(ruleId);
      if (rule && rule.isActive && rule.percentageOff) {
        currentAmount -= (currentAmount * rule.percentageOff) / 100;
      }
    }

    return Math.round(currentAmount * 100) / 100;
  }
}
