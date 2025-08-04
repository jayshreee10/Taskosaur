// types/workflow.ts
export type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";
export type WorkflowStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  category: StatusCategory;
  position: number; // Standardized from 'order'
  isDefault: boolean;
  workflowId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface StatusTransition {
  id: string;
  name: string;
  description: string | null;
  workflowId: string;
  fromStatusId: string;
  toStatusId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  isDefault: boolean;
  status: WorkflowStatus;
  statuses?: TaskStatus[];
  transitions?: StatusTransition[];
  _count?: {
    statuses: number;
    transitions: number;
    tasks?: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  organizationId: string;
  isDefault?: boolean;
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  isDefault?: boolean;
  status?: WorkflowStatus;
}