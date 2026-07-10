export type Currency = 'USD' | 'SAR' | 'EUR' | 'SDG';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export interface Account {
  id: string;
  code: string; // e.g. '1001'
  name: string; // e.g. 'Cash'
  type: AccountType;
  currency?: Currency;
  isActive: boolean;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  costCenterId?: string;
  entityId?: string; // Reference to Student, Vendor, etc.
  debit: number;
  credit: number;
  description: string;
}

export enum DocumentType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  BILL = 'BILL',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  MANUAL_JOURNAL = 'MANUAL_JOURNAL'
}

export interface JournalEntry {
  id: string;
  date: Date;
  documentType: DocumentType;
  documentReferenceId: string; // ID of the Invoice, Receipt, etc.
  lines: JournalEntryLine[];
  currency: Currency;
  exchangeRate: number;
  posted: boolean;
  postedAt?: Date;
  postedBy?: string;
  notes?: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface EntityLedgerRecord {
  entityId: string; // ID of Student, Vendor, etc.
  entityType: 'STUDENT' | 'VENDOR' | 'EMPLOYEE' | 'TEACHER' | 'PARENT' | 'BANK';
  balance: number; // Positive means they owe us (Receivable), Negative means we owe them (Payable)
}
