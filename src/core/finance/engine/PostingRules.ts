import { AccountType, Currency, DocumentType, JournalEntry, JournalEntryLine } from '../types';

export enum EventType {
  STUDENT_REGISTRATION = 'STUDENT_REGISTRATION',
  TRANSPORT_SUBSCRIPTION = 'TRANSPORT_SUBSCRIPTION',
  BOOK_SALE = 'BOOK_SALE',
  FEE_PAYMENT = 'FEE_PAYMENT',
  SALARY_PAYMENT = 'SALARY_PAYMENT'
}

export interface PostingRule {
  eventType: EventType;
  debitAccountCode: string;
  creditAccountCode: string;
  descriptionTemplate: string;
}

/**
 * Pre-defined rules mapped out based on standard ERP accounting.
 */
export const DefaultPostingRules: Record<EventType, PostingRule> = {
  [EventType.STUDENT_REGISTRATION]: {
    eventType: EventType.STUDENT_REGISTRATION,
    debitAccountCode: '1200', // Accounts Receivable - Students
    creditAccountCode: '4000', // Tuition Revenue
    descriptionTemplate: 'Tuition fees for Student {entityId}'
  },
  [EventType.TRANSPORT_SUBSCRIPTION]: {
    eventType: EventType.TRANSPORT_SUBSCRIPTION,
    debitAccountCode: '1200',
    creditAccountCode: '4100', // Transport Revenue
    descriptionTemplate: 'Transport subscription for Student {entityId}'
  },
  [EventType.BOOK_SALE]: {
    eventType: EventType.BOOK_SALE,
    debitAccountCode: '1200', // Student Receivable
    creditAccountCode: '4200', // Inventory Sales Revenue
    descriptionTemplate: 'Book sale to Student {entityId}'
  },
  [EventType.FEE_PAYMENT]: {
    eventType: EventType.FEE_PAYMENT,
    debitAccountCode: '1000', // Cash / Bank
    creditAccountCode: '1200', // Accounts Receivable - Students
    descriptionTemplate: 'Payment received from Student {entityId}'
  },
  [EventType.SALARY_PAYMENT]: {
    eventType: EventType.SALARY_PAYMENT,
    debitAccountCode: '5000', // Salary Expense
    creditAccountCode: '2000', // Payroll Payable
    descriptionTemplate: 'Salary posting for Employee {entityId}'
  }
};
