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
    const invoice = globalStore.allInvoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error("الفاتورة غير موجودة");

    // Find the active cash session for the treasury (if cash/card/etc and linked to a treasury)
    const activeSession = globalStore.allCashSessions.find(s => s.status === "open"); // This might need refinement to match destinationAccount to treasury, but for now take the first open or specific one.


    const academicYearId = invoice.academicYearId || globalStore.academicYears.find(y => y.isCurrent)?.id;
    if (!academicYearId) throw new Error("لا توجد سنة دراسية محددة");

    // 1. Record the Payment Entity
    const paymentRecord = {
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      amount,
      date: new Date().toISOString(),
      method,
      referenceNo,
      notes,
      sessionId: activeSession?.id,
    };
    
    globalStore.addPayment(paymentRecord);
    
    // If it's cash and there's an active session, update the treasury balance (if not handled via GL strictly)
    // Actually, in an ERP, the GL handles everything. But we should also update the treasury balance directly for quick dashboarding.
    if (activeSession) {
       // update treasury balance natively if needed, but usually GL is the source of truth.
    }

    // 2. Generate Automated Accounting Entry
    // Debit: Destination Account (Treasury/Bank)
    // Credit: Accounts Receivable (الذمم المدينة للطلاب)
    // Assuming a fixed Accounts Receivable GL ID for simplicity: 'gl-ar-students'
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
    
    const unpaidInvoices = globalStore.allInvoices
      .filter(i => i.studentId === studentId && i.status !== "paid" && i.status !== "cancelled")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Oldest first
    
    for (const inv of unpaidInvoices) {
      if (remaining <= 0) break;
      
      const balance = (inv.netAmount ?? inv.amount) - (inv.paid || 0);
      const applyAmount = Math.min(balance, remaining);
      
      receiveInvoicePayment(inv.id, applyAmount, method, destinationAccountId, "تسديد إجمالي موزع");
      remaining -= applyAmount;
    }

    if (remaining > 0) {
      // Handle overpayment (e.g., store as unallocated credit balance)
      console.warn("Lump sum payment exceeded total unpaid balance. Remaining credit:", remaining);
    }
  };

  return {
    receiveInvoicePayment,
    receiveLumpSumPayment
  };
}
