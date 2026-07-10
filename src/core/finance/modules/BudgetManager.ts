export interface Budget {
  id: string;
  costCenterId: string;
  accountId: string; // The expense account being budgeted
  periodId: string; // E.g., Q3 2026 or Year 2026
  allocatedAmount: number;
  actualSpent: number;
}

export class BudgetManager {
  private budgets: Map<string, Budget> = new Map();

  public createBudget(budget: Budget) {
    if (this.budgets.has(budget.id)) {
      throw new Error("Budget already exists.");
    }
    this.budgets.set(budget.id, { ...budget, actualSpent: 0 });
  }

  /**
   * Tracks an expense against a specific budget.
   * Throws an alert/warning if the budget is exceeded.
   */
  public trackExpense(budgetId: string, amount: number) {
    const budget = this.budgets.get(budgetId);
    if (!budget) return;

    budget.actualSpent += amount;
    
    if (budget.actualSpent > budget.allocatedAmount) {
      console.warn(`[BUDGET ALERT] Budget ${budgetId} exceeded! Allocated: ${budget.allocatedAmount}, Spent: ${budget.actualSpent}`);
    } else if (budget.actualSpent > budget.allocatedAmount * 0.9) {
      console.warn(`[BUDGET WARNING] Budget ${budgetId} is at 90% capacity.`);
    }

    this.budgets.set(budgetId, budget);
  }

  public getBudgetStatus(budgetId: string) {
    const budget = this.budgets.get(budgetId);
    if (!budget) return null;
    return {
      allocated: budget.allocatedAmount,
      spent: budget.actualSpent,
      variance: budget.allocatedAmount - budget.actualSpent,
      utilizationPercentage: (budget.actualSpent / budget.allocatedAmount) * 100
    };
  }
}
