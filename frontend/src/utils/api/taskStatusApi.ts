import api from "@/lib/api";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description?: string;
  key: string;
  priority: TaskPriority;
  statusId: string;
  assigneeId?: string;
  reporterId: string;
  projectId?: string;
  sprintId?: string;
  workspaceId?: string;
  parentTaskId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
    attachments: number;
    subTasks: number;
  };
  status?: TaskStatus;
  assignee?: User;
  reporter?: User;
  project?: Project;
  sprint?: Sprint;
  workspace?: Workspace;
  parentTask?: Task;
  subTasks?: Task[];
  comments?: TaskComment[];
}

export interface TaskStatus {
  id: string;
  name: string;
  color?: string;
  category: "TODO" | "IN_PROGRESS" | "DONE";
  position: number;
  isDefault: boolean;
  workflowId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
}

export interface Sprint {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  statusId?: string;
  assigneeId?: string;
  projectId?: string;
  sprintId?: string;
  workspaceId?: string;
  parentTaskId?: string;
  dueDate?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  statusId?: string;
  assigneeId?: string;
  projectId?: string;
  sprintId?: string;
  workspaceId?: string;
  parentTaskId?: string;
  dueDate?: string;
}

export interface CreateTaskStatusDto {
  name: string;
  color: string;
  category: "TODO" | "IN_PROGRESS" | "DONE";
  position?: number;
  workflowId: string;
}

export interface UpdateTaskStatusDto {
  name?: string;
  color?: string;
  category?: "TODO" | "IN_PROGRESS" | "DONE";
  position?: number;
  isDefault?: boolean;
  workflowId?: string;
}

export interface TaskFilters {
  projectId?: string;
  sprintId?: string;
  workspaceId?: string;
  parentTaskId?: string;
  priority?: TaskPriority;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskPaginatedResponse {
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface TodaysTasksParams {
  organizationId: string;
  page?: number;
  limit?: number;
}

export interface OrganizationTasksParams {
  organizationId: string;
  priority?: TaskPriority;
  search?: string;
  page?: number;
  limit?: number;
}

// Task Status API - aligned with your NestJS controller
export const taskStatusApi = {
  // Create task status
  createTaskStatus: async (
    taskStatusData: CreateTaskStatusDto
  ): Promise<TaskStatus> => {
    try {
      const response = await api.post<TaskStatus>(
        "/task-statuses",
        taskStatusData
      );
      return response.data;
    } catch (error) {
      console.error("Create task status error:", error);
      throw error;
    }
  },

  // Get all task statuses with optional workflow filter
  getTaskStatuses: async (workflowId?: string): Promise<TaskStatus[]> => {
    try {
      const params = workflowId ? `?workflowId=${workflowId}` : "";
      const response = await api.get<TaskStatus[]>(`/task-statuses${params}`);
      return response.data;
    } catch (error) {
      console.error("Get task statuses error:", error);
      throw error;
    }
  },

  // Get task status by ID
  getTaskStatusById: async (statusId: string): Promise<TaskStatus> => {
    try {
      const response = await api.get<TaskStatus>(`/task-statuses/${statusId}`);
      return response.data;
    } catch (error) {
      console.error("Get task status by ID error:", error);
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (
    statusId: string,
    taskStatusData: UpdateTaskStatusDto
  ): Promise<TaskStatus> => {
    try {
      const response = await api.patch<TaskStatus>(
        `/task-statuses/${statusId}`,
        taskStatusData
      );
      return response.data;
    } catch (error) {
      console.error("Update task status error:", error);
      throw error;
    }
  },
  updateTaskStatusPositions: async (
    statusUpdates: { id: string; position: number; }[]
  ): Promise<TaskStatus[]> => {
    try {
      const response = await api.patch<TaskStatus[]>(
        "/task-statuses/positions",
        {statusUpdates}
      );
      return response.data;
    } catch (error) {
      console.error("Update task status positions error:", error);
      throw error;
    }
  },

  // Delete task status
  deleteTaskStatus: async (
    statusId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/task-statuses/${statusId}`);

      const status = response.status;
      if (status === 204 || status === 200) {
        return { success: true, message: "Task status deleted successfully" };
      }

      return (
        response.data || {
          success: true,
          message: "Task status deleted successfully",
        }
      );
    } catch (error) {
      console.error("Delete task status error:", error);
      throw error;
    }
  },

  // Utility functions for task statuses
  getStatusColor: (category: "TODO" | "IN_PROGRESS" | "DONE"): string => {
    switch (category) {
      case "TODO":
        return "#6b7280"; // gray
      case "IN_PROGRESS":
        return "#3b82f6"; // blue
      case "DONE":
        return "#22c55e"; // green
      default:
        return "#6b7280"; // gray
    }
  },

  getCategoryLabel: (category: "TODO" | "IN_PROGRESS" | "DONE"): string => {
    switch (category) {
      case "TODO":
        return "To Do";
      case "IN_PROGRESS":
        return "In Progress";
      case "DONE":
        return "Done";
      default:
        return "Unknown";
    }
  },
};
