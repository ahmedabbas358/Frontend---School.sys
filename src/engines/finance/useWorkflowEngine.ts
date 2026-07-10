import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useAccountingEngine } from "./useAccountingEngine";

type WorkflowStatus = "draft" | "submitted" | "reviewed" | "approved" | "paid" | "posted";

/**
 * Workflow Engine (محرك سير العمل)
 * Handles approval flows for expenses, payroll, and purchase orders.
 */
export function useWorkflowEngine() {
  const globalStore = useGlobalStore();
  const { postAutomaticEntry } = useAccountingEngine();

  /**
   * Update the status of an Expense with optional accounting triggers
   */
  const transitionExpenseStatus = (
    expenseId: string, 
    newStatus: WorkflowStatus, 
    approverId?: string
  ) => {
    const expense = globalStore.allExpenses?.find(e => e.id === expenseId);
    if (!expense) throw new Error("طلب الصرف غير موجود");

    // 1. Validate Transition
    // Example: Draft -> Submitted -> Reviewed -> Approved -> Paid
    // For simplicity, we just allow the transition here but we can enforce strict rules

    // 2. Perform Transition
    // Assume globalStore has updateExpense
    globalStore.updateExpense(expenseId, { status: newStatus });

    // 3. Trigger Actions Based on New Status
    const academicYearId = expense.academicYearId || globalStore.academicYears.find(y => y.isCurrent)?.id || "AY-1";

    if (newStatus === "approved") {
      // Create Accrual Accounting Entry
      // Debit: Specific Expense Account (based on CategoryId)
      // Credit: Accounts Payable (ذمم دائنة - موردين)
      postAutomaticEntry(
        `اعتماد طلب صرف: ${expense.title}`,
        expense.id,
        "expense",
        `gl-exp-${expense.categoryId}`, // Debit
        "gl-ap-vendors", // Credit
        expense.amount,
        academicYearId
      );
    }

    if (newStatus === "paid") {
      // Create Payment Accounting Entry
      // Debit: Accounts Payable (تخفيض الذمم)
      // Credit: Treasury/Bank (نقص النقدية)
      postAutomaticEntry(
        `تنفيذ وصرف الدفعة لطلب: ${expense.title}`,
        expense.id,
        "payment",
        "gl-ap-vendors", // Debit
        expense.method === "cash" ? "gl-treasury-main" : "gl-bank-main", // Credit
        expense.amount,
        academicYearId
      );
    }
  };

  /**
   * Advance payroll processing status
   */
  const transitionPayrollStatus = (
    payrollId: string,
    newStatus: WorkflowStatus
  ) => {
    // Similar logic for payroll
    console.log("Transition payroll", payrollId, "to", newStatus);
  };

  return {
    transitionExpenseStatus,
    transitionPayrollStatus
  };
}
