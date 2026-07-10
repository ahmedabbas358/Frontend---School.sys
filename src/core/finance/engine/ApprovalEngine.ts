export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_MANAGER = 'PENDING_MANAGER',
  PENDING_FINANCE = 'PENDING_FINANCE',
  PENDING_PRINCIPAL = 'PENDING_PRINCIPAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  POSTED = 'POSTED'
}

export interface ApprovalWorkflow {
  id: string;
  documentId: string;
  documentType: string;
  status: DocumentStatus;
  history: ApprovalStep[];
}

export interface ApprovalStep {
  status: DocumentStatus;
  actorId: string;
  timestamp: Date;
  comments?: string;
}

export class ApprovalEngine {
  private workflows: Map<string, ApprovalWorkflow> = new Map();

  public initiateWorkflow(documentId: string, documentType: string, submitterId: string): ApprovalWorkflow {
    const workflow: ApprovalWorkflow = {
      id: crypto.randomUUID(),
      documentId,
      documentType,
      status: DocumentStatus.PENDING_MANAGER,
      history: [{
        status: DocumentStatus.DRAFT,
        actorId: submitterId,
        timestamp: new Date(),
        comments: 'Submitted for approval'
      }]
    };
    this.workflows.set(documentId, workflow);
    return workflow;
  }

  public getWorkflowStatus(documentId: string): DocumentStatus {
    return this.workflows.get(documentId)?.status || DocumentStatus.DRAFT;
  }

  public approve(documentId: string, actorId: string, currentRole: string, comments?: string): ApprovalWorkflow {
    const workflow = this.workflows.get(documentId);
    if (!workflow) throw new Error("Workflow not found.");

    let nextStatus = workflow.status;

    // Advanced dynamic routing based on role
    switch (workflow.status) {
      case DocumentStatus.PENDING_MANAGER:
        if (currentRole === 'MANAGER') nextStatus = DocumentStatus.PENDING_FINANCE;
        break;
      case DocumentStatus.PENDING_FINANCE:
        if (currentRole === 'FINANCE_MANAGER') nextStatus = DocumentStatus.PENDING_PRINCIPAL;
        break;
      case DocumentStatus.PENDING_PRINCIPAL:
        if (currentRole === 'PRINCIPAL') nextStatus = DocumentStatus.APPROVED;
        break;
      default:
        throw new Error(`Cannot approve document in status ${workflow.status}`);
    }

    workflow.status = nextStatus;
    workflow.history.push({
      status: nextStatus,
      actorId,
      timestamp: new Date(),
      comments
    });

    this.workflows.set(documentId, workflow);
    return workflow;
  }

  public reject(documentId: string, actorId: string, comments: string): ApprovalWorkflow {
    const workflow = this.workflows.get(documentId);
    if (!workflow) throw new Error("Workflow not found.");

    workflow.status = DocumentStatus.REJECTED;
    workflow.history.push({
      status: DocumentStatus.REJECTED,
      actorId,
      timestamp: new Date(),
      comments
    });

    this.workflows.set(documentId, workflow);
    return workflow;
  }
}
