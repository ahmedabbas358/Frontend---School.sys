import { Currency, DocumentType } from '../types';
import { EventType } from '../engine/PostingRules';
import { JournalEngine } from '../engine/JournalEngine';
import { ApprovalEngine, DocumentStatus } from '../engine/ApprovalEngine';

export interface FinancialDocument {
  id: string;
  type: DocumentType;
  entityId: string;
  amount: number;
  currency: Currency;
  date: Date;
  status: DocumentStatus;
}

export class DocumentFactory {
  private approvalEngine: ApprovalEngine;

  constructor(approvalEngine: ApprovalEngine) {
    this.approvalEngine = approvalEngine;
  }

  /**
   * Creates an Invoice (e.g., for Tuition Fees)
   */
  public createInvoice(
    entityId: string,
    amount: number,
    currency: Currency,
    submitterId: string
  ): FinancialDocument {
    const docId = crypto.randomUUID();
    
    // Initiate approval workflow
    const workflow = this.approvalEngine.initiateWorkflow(docId, DocumentType.INVOICE, submitterId);

    return {
      id: docId,
      type: DocumentType.INVOICE,
      entityId,
      amount,
      currency,
      date: new Date(),
      status: workflow.status
    };
  }

  /**
   * Once an Invoice is fully approved, this converts it to a Journal Entry
   */
  public postInvoiceToJournal(invoice: FinancialDocument) {
    if (invoice.status !== DocumentStatus.APPROVED && invoice.status !== DocumentStatus.POSTED) {
      throw new Error(`Cannot post invoice with status: ${invoice.status}`);
    }

    // Generate entry based on the Student Registration/Fee event
    const entry = JournalEngine.generateEntryFromEvent(
      EventType.STUDENT_REGISTRATION, // Assuming this is a student invoice for now
      invoice.amount,
      invoice.currency,
      invoice.type,
      invoice.id,
      invoice.entityId
    );

    invoice.status = DocumentStatus.POSTED;
    return entry;
  }

  /**
   * Creates a Receipt when a payment is received.
   * Note: Receipts usually post immediately or have a fast-track approval.
   */
  public createReceipt(
    entityId: string,
    amount: number,
    currency: Currency
  ): FinancialDocument {
    const docId = crypto.randomUUID();

    // Generate entry for Fee Payment
    const entry = JournalEngine.generateEntryFromEvent(
      EventType.FEE_PAYMENT,
      amount,
      currency,
      DocumentType.RECEIPT,
      docId,
      entityId
    );

    // Return the document (in a real system we'd return the doc and pass the entry to the GL)
    return {
      id: docId,
      type: DocumentType.RECEIPT,
      entityId,
      amount,
      currency,
      date: new Date(),
      status: DocumentStatus.POSTED // Receipts are typically auto-posted
    };
  }
}
