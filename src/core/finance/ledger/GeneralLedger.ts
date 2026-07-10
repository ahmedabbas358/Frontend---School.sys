import { Account, JournalEntry, JournalEntryLine, AccountType } from '../types';
import { AccountingEngine } from '../engine/AccountingEngine';

export class GeneralLedger {
  private accounts: Map<string, Account> = new Map();
  private accountBalances: Map<string, number> = new Map(); // AccountCode -> Balance
  private journalEntries: JournalEntry[] = [];

  constructor(initialAccounts: Account[] = []) {
    initialAccounts.forEach(acc => {
      this.accounts.set(acc.code, acc);
      this.accountBalances.set(acc.code, 0);
    });
  }

  public registerAccount(account: Account) {
    if (this.accounts.has(account.code)) {
      throw new Error(`Account with code ${account.code} already exists.`);
    }
    this.accounts.set(account.code, account);
    this.accountBalances.set(account.code, 0);
  }

  public getAccount(code: string): Account | undefined {
    return this.accounts.get(code);
  }

  public getBalance(code: string): number {
    return this.accountBalances.get(code) || 0;
  }

  /**
   * Posts a journal entry to the General Ledger and updates account balances.
   */
  public postJournalEntry(entry: JournalEntry) {
    // 1. Validate double entry
    const postedEntry = AccountingEngine.postEntry(entry);
    
    // 2. Validate all accounts exist
    for (const line of entry.lines) {
      if (!this.accounts.has(line.accountId)) {
        throw new Error(`Cannot post entry: Account ${line.accountId} does not exist in the General Ledger.`);
      }
    }

    // 3. Update balances
    for (const line of entry.lines) {
      this.updateAccountBalance(line);
    }

    // 4. Save to ledger history
    this.journalEntries.push(postedEntry);
  }

  private updateAccountBalance(line: JournalEntryLine) {
    const account = this.accounts.get(line.accountId);
    if (!account) return;

    const currentBalance = this.accountBalances.get(line.accountId) || 0;
    
    // In Accounting:
    // Assets & Expenses increase with Debits, decrease with Credits
    // Liabilities, Equity & Revenue increase with Credits, decrease with Debits
    let newBalance = currentBalance;

    if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
      newBalance = currentBalance + line.debit - line.credit;
    } else {
      newBalance = currentBalance + line.credit - line.debit;
    }

    this.accountBalances.set(line.accountId, newBalance);
  }

  public getLedgerHistory(): JournalEntry[] {
    return [...this.journalEntries];
  }
}
