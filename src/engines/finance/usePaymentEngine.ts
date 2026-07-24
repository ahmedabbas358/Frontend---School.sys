import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useAccountingEngine } from "./useAccountingEngine";

/**
 * Payment Engine (محرك التحصيلات والدفعات)
 * Handles receiving payments, applying them to invoices,
 * and calling the accounting engine for double-entry records.
 */
export function usePaymentEngine() {
  const globalStore = useGlobalStore();
  const { postAutomaticEntry } = useAccountingEngine();

  /**
   * Receive a payment and allocate it to a specific invoice.
   */
  const receiveInvoicePayment = (
    invoiceId: string,
    amount: number,
    method: "cash" | "bank_transfer" | "card" | "cheque",
    destinationAccountId: string, // Treasury or Bank GL Account
    referenceNo?: string,
    notes?: string
  ) => {
    const invoice = (globalStore.allInvoices || []).find((i: any) => i.id === invoiceId);
    if (!invoice) throw new Error("الفاتورة غير موجودة");

    const academicYearId = invoice.academicYearId || (globalStore.allAcademicYears || []).find((y: any) => y.isCurrent)?.id;
    if (!academicYearId) throw new Error("لا توجد سنة دراسية محددة");

    // 1. Record the Payment Entity
    const paymentRecord = {
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      amount,
      date: new Date().toISOString().split("T")[0],
      method,
      referenceNo,
      notes,
    };
    
    globalStore.addPayment(paymentRecord);
    
    // 2. Generate Automated Accounting Entry
    const accountsReceivableGlId = "gl-ar-students";
    
    postAutomaticEntry(
      `سداد دفعة من رسوم الطالب ${invoice.studentName}`,
      invoice.id,
      "payment",
      destinationAccountId, // Debit
      accountsReceivableGlId, // Credit
      amount,
      academicYearId
    );
  };

  /**
   * Advance: Distribute a lump sum payment across the oldest unpaid invoices for a student
   */
  const receiveLumpSumPayment = (
    studentId: string,
    totalAmount: number,
    method: "cash" | "bank_transfer" | "card" | "cheque",
    destinationAccountId: string
  ) => {
    let remaining = totalAmount;
    
    const unpaidInvoices = (globalStore.allInvoices || [])
      .filter((i: any) => i.studentId === studentId && i.status !== "paid" && i.status !== "cancelled")
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Oldest first
    
    for (const inv of unpaidInvoices) {
      if (remaining <= 0) break;
      
      const balance = (inv.netAmount ?? inv.amount) - (inv.paid || 0);
      const applyAmount = Math.min(balance, remaining);
      
      receiveInvoicePayment(inv.id, applyAmount, method, destinationAccountId, "تسديد إجمالي موزع");
      remaining -= applyAmount;
    }

    if (remaining > 0) {
      console.warn("Lump sum payment exceeded total unpaid balance. Remaining credit:", remaining);
    }
  };

  return {
    receiveInvoicePayment,
    receiveLumpSumPayment
  };
}
