import { Currency, DocumentType, JournalEntry, JournalEntryLine } from '../types';
import { EventType, DefaultPostingRules } from './PostingRules';
import { AccountingEngine } from './AccountingEngine';

export class JournalEngine {
  /**
   * Generates a Journal Entry automatically based on a predefined event and posting rule.
   */
  public static generateEntryFromEvent(
    eventType: EventType,
    amount: number,
    currency: Currency,
    documentType: DocumentType,
    documentReferenceId: string,
    entityId: string,
    costCenterId?: string
  ): JournalEntry {
    const rule = DefaultPostingRules[eventType];
    if (!rule) {
      throw new Error(`No posting rule defined for event type: ${eventType}`);
    }

    const description = rule.descriptionTemplate.replace('{entityId}', entityId);

    const debitLine: JournalEntryLine = {
      id: crypto.randomUUID(),
      accountId: rule.debitAccountCode,
      costCenterId,
      entityId,
      debit: amount,
      credit: 0,
      description
    };

    const creditLine: JournalEntryLine = {
      id: crypto.randomUUID(),
      accountId: rule.creditAccountCode,
      costCenterId,
      entityId,
      debit: 0,
      credit: amount,
      description
    };

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date(),
      documentType,
      documentReferenceId,
      lines: [debitLine, creditLine],
      currency,
      exchangeRate: 1.0, // Should be fetched from CurrencyEngine in a real scenario
      posted: false
    };

    // Validate the generated entry before returning
    AccountingEngine.validateDoubleEntry(entry);

    return entry;
  }
}
