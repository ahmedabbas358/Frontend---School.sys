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
    const expense = (globalStore.allExpenses || []).find((e: any) => e.id === expenseId);
    if (!expense) throw new Error("طلب الصرف غير موجود");

    globalStore.updateExpense(expenseId, { status: newStatus as any });

    const academicYearId = expense.academicYearId || (globalStore.allAcademicYears || []).find((y: any) => y.isCurrent)?.id || "AY-1";

    if (newStatus === "approved") {
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
    console.log("Transition payroll", payrollId, "to", newStatus);
  };

  return {
    transitionExpenseStatus,
    transitionPayrollStatus
  };
}
