import { Task } from "./tasks";

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  startDate?: string;
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
  reporterId?: string;
  statusId: string;
  parentTaskId?: string;
}

export interface CreateSubtaskRequest extends CreateTaskRequest {
  parentTaskId: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  startDate?: string;
  dueDate?: string;
  remainingEstimate?: number;
  assigneeId?: string;
  reporterId?: string;
  statusId?: string;
  projectId?: string;
}
export interface TasksResponse {
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GetTasksParams {
  page?: number;
  limit?: number;
  assigneeId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  search?: string;
}