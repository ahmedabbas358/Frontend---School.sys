import { JournalEntry, JournalEntryLine } from '../types';

export class AccountingEngine {
  
  /**
   * Validates if a journal entry follows the double-entry accounting principle (Debits = Credits).
   */
  public static validateDoubleEntry(entry: JournalEntry): boolean {
    if (!entry.lines || entry.lines.length < 2) {
      throw new Error('A journal entry must have at least two lines (one debit, one credit).');
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of entry.lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new Error('Debits and Credits must be positive values.');
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new Error('A single line cannot have both a debit and a credit.');
      }

      totalDebits += line.debit;
      totalCredits += line.credit;
    }

    // Ensure precision up to 2 decimal places to avoid floating point issues
    totalDebits = Math.round(totalDebits * 100) / 100;
    totalCredits = Math.round(totalCredits * 100) / 100;

    if (totalDebits !== totalCredits) {
      throw new Error(`Double-entry validation failed: Total Debits (${totalDebits}) do not equal Total Credits (${totalCredits}).`);
    }

    return true;
  }

  /**
   * Simulates posting a journal entry to the General Ledger.
   * In a real application, this would persist the entry and update account balances.
   */
  public static postEntry(entry: JournalEntry): JournalEntry {
    try {
      this.validateDoubleEntry(entry);
      
      // Update entry status
      const postedEntry = {
        ...entry,
        posted: true,
        postedAt: new Date(),
        // In a real system, you would grab the currently logged-in user here
        postedBy: 'system'
      };

      console.log(`Successfully posted Journal Entry: ${postedEntry.id}`);
      return postedEntry;

    } catch (error) {
      console.error(`Failed to post Journal Entry: ${entry.id}`, error);
      throw error;
    }
  }
}
