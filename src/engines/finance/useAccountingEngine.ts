import { useGlobalStore, JournalEntry, JournalLine } from "@/contexts/GlobalStoreContext";

/**
 * Accounting Engine (محرك المحاسبة)
 * Responsible for generating automated double-entry journal records.
 * Acts as an abstraction layer over raw ledger operations.
 */
export function useAccountingEngine() {
  const globalStore = useGlobalStore();

  /**
   * Post an automated journal entry
   * @param description Brief description of the transaction
   * @param referenceId ID of the source document (Invoice, Payment, Expense, etc.)
   * @param referenceType Type of the source document
   * @param debitAccountId Account receiving the debit (الأصول/المصروفات تزيد)
   * @param creditAccountId Account receiving the credit (الخصوم/الإيرادات تزيد)
   * @param amount The transaction amount
   * @param academicYearId The current academic year
   */
  const postAutomaticEntry = (
    description: string,
    referenceId: string,
    referenceType: "invoice" | "payment" | "expense" | "payroll" | "manual",
    debitAccountId: string,
    creditAccountId: string,
    amount: number,
    academicYearId: string
  ) => {
    if (amount <= 0) return;

    // Create lines
    const lines: Omit<JournalLine, "id" | "journalEntryId">[] = [
      {
        accountId: debitAccountId,
        debit: amount,
        credit: 0,
        description: `${description} - Debit`,
        referenceId,
        referenceType
      },
      {
        accountId: creditAccountId,
        debit: 0,
        credit: amount,
        description: `${description} - Credit`,
        referenceId,
        referenceType
      }
    ];

    // Build entry
    const entry: Omit<JournalEntry, "id"> = {
      academicYearId,
      date: new Date().toISOString(),
      referenceId,
      referenceType,
      description,
      status: "posted"
    };

    // Forward to global store to persist
    globalStore.addJournalEntry(entry, lines);
  };

  /**
   * Post an advanced multi-line entry (e.g. Payroll with multiple deductions)
   */
  const postMultiLineEntry = (
    description: string,
    referenceId: string,
    referenceType: "invoice" | "payment" | "expense" | "payroll" | "manual",
    lines: Omit<JournalLine, "id" | "journalEntryId">[],
    academicYearId: string
  ) => {
    // Validate debits = credits
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      console.error("Accounting Engine: Debit and Credit do not match!", { totalDebit, totalCredit });
      throw new Error("قيد غير متزن: إجمالي المدين لا يساوي إجمالي الدائن.");
    }

    const entry: Omit<JournalEntry, "id"> = {
      academicYearId,
      date: new Date().toISOString(),
      referenceId,
      referenceType,
      description,
      status: "posted"
    };

    globalStore.addJournalEntry(entry, lines);
  };

  return {
    postAutomaticEntry,
    postMultiLineEntry
  };
}
