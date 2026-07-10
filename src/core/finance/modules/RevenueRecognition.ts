import { JournalEntryLine, JournalEntry, DocumentType } from '../types';
import { AccountingEngine } from '../engine/AccountingEngine';

export interface DeferredRevenueSchedule {
  id: string;
  sourceDocumentId: string; // The invoice where the full amount was billed
  deferredAccountId: string; // The liability account (e.g., Unearned Revenue)
  revenueAccountId: string; // The actual revenue account (e.g., Tuition Revenue)
  totalAmount: number;
  recognizedAmount: number;
  monthsDuration: number;
  startDate: Date;
}

export class RevenueRecognition {
  private schedules: Map<string, DeferredRevenueSchedule> = new Map();

  public createSchedule(
    sourceDocumentId: string,
    amount: number,
    monthsDuration: number,
    startDate: Date = new Date()
  ) {
    const id = crypto.randomUUID();
    this.schedules.set(id, {
      id,
      sourceDocumentId,
      deferredAccountId: '2100', // Unearned Revenue Liability Code
      revenueAccountId: '4000', // Tuition Revenue Code
      totalAmount: amount,
      recognizedAmount: 0,
      monthsDuration,
      startDate
    });
  }

  /**
   * Run this monthly via a cron job or scheduler to recognize deferred revenue.
   * Moves a portion of Unearned Revenue to Actual Revenue.
   */
  public runMonthlyRecognition(): JournalEntry[] {
    const generatedJournals: JournalEntry[] = [];

    this.schedules.forEach(schedule => {
      if (schedule.recognizedAmount >= schedule.totalAmount) return; // Fully recognized

      const monthlyAmount = schedule.totalAmount / schedule.monthsDuration;
      // Precision handling
      const amountToRecognize = Math.min(
        Math.round(monthlyAmount * 100) / 100, 
        schedule.totalAmount - schedule.recognizedAmount
      );

      // Debit Deferred Revenue (Liability goes down)
      // Credit Actual Revenue (Revenue goes up)
      const debitLine: JournalEntryLine = {
        id: crypto.randomUUID(),
        accountId: schedule.deferredAccountId,
        debit: amountToRecognize,
        credit: 0,
        description: `Revenue Recognition for ${schedule.sourceDocumentId}`
      };

      const creditLine: JournalEntryLine = {
        id: crypto.randomUUID(),
        accountId: schedule.revenueAccountId,
        debit: 0,
        credit: amountToRecognize,
        description: `Revenue Recognition for ${schedule.sourceDocumentId}`
      };

      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        date: new Date(),
        documentType: DocumentType.MANUAL_JOURNAL,
        documentReferenceId: schedule.id,
        lines: [debitLine, creditLine],
        currency: 'USD',
        exchangeRate: 1.0,
        posted: false
      };

      AccountingEngine.validateDoubleEntry(entry);
      
      schedule.recognizedAmount += amountToRecognize;
      this.schedules.set(schedule.id, schedule);
      
      generatedJournals.push(entry);
    });

    return generatedJournals;
  }
}
