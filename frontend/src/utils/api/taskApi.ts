import api from "@/lib/api";

// Task interfaces
export interface Task {
  id: string;
  title: string;
  description: string | null;
  type: "TASK" | "BUG" | "EPIC" | "STORY" | "SUBTASK";
  priority: "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  taskNumber: number;
  slug: string;
  startDate: string ;
  dueDate: string ;
  completedAt: string;
  storyPoints: number ;
  originalEstimate: number ;
  remainingEstimate: number;
  customFields: any;
  projectId: string;
  assigneeId: string ;
  reporterId: string;
  statusId: string;
  sprintId: string;
  parentTaskId: string;
  createdBy: string;
  updatedBy: string ;
  createdAt: string;
  updatedAt: string;
  
  // Related objects
  project: {
    id: string;
    name: string;
    slug: string;
  };
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    email: string;
  } | null;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  status: {
    id: string;
    name: string;
    color: string;
    category: "TODO" | "IN_PROGRESS" | "DONE";
  };
  sprint: {
    id: string;
    name: string;
    status: string;
  } | null;
  parentTask: {
    id: string;
    title: string;
    slug: string;
    type: string;
  } | null;
  _count: {
    childTasks: number;
    comments: number;
  };
}


export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  startDate: string;
  dueDate: string;
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

export interface TaskStatus {
  
  id: string;
  name: string;
  color?: string;
  order?: number;
}

// Task Comment interfaces
export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  parentCommentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskCommentRequest {
  content: string;
  taskId: string;
  authorId: string;
  parentCommentId?: string;
}

export interface UpdateTaskCommentRequest {
  content: string;
}

// Task Attachment interfaces
export interface TaskAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  taskId: string;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttachmentRequest {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  taskId: string;
}

export interface AttachmentStats {
  totalAttachments: number;
  totalSize: number;
  fileTypes: Record<string, number>;
}

// Task Label interfaces
export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLabelRequest {
  name: string;
  color: string;
  description?: string;
  projectId: string;
}

export interface UpdateLabelRequest {
  name?: string;
  color?: string;
  description?: string;
}

export interface AssignLabelRequest {
  taskId: string;
  labelId: string;
}

export interface AssignMultipleLabelsRequest {
  taskId: string;
  labelIds: string[];
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
export const taskApi = {
  // Task CRUD operations
  createTask: async (taskData: CreateTaskRequest): Promise<Task> => {
    try {
      console.log("Creating task with data:", taskData);
      const response = await api.post<Task>("/tasks", taskData);
      console.log("Task created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create task error:", error);
      throw error;
    }
  },

  createSubtask: async (subtaskData: CreateSubtaskRequest): Promise<Task> => {
    try {
      console.log("Creating subtask with data:", subtaskData);
      const response = await api.post<Task>("/tasks", subtaskData);
      console.log("Subtask created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create subtask error:", error);
      throw error;
    }
  },

  getAllTasks: async (): Promise<Task[]> => {
    try {
      console.log("Fetching all tasks");
      const response = await api.get<Task[]>("/tasks");
      return response.data;
    } catch (error) {
      console.error("Get all tasks error:", error);
      throw error;
    }
  },

  getTasksByProject: async (projectId: string): Promise<Task[]> => {
    try {
      console.log("Fetching tasks for project:", projectId);
      const response = await api.get<Task[]>(`/tasks?projectId=${projectId}`);
      return response.data;
    } catch (error) {
      console.error("Get tasks by project error:", error);
      throw error;
    }
  },
  getTasksByOrganization: async (
    organizationId: string,
    params: GetTasksParams = {}
  ): Promise<TasksResponse> => {
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.assigneeId)
        queryParams.append("assigneeId", params.assigneeId);
      if (params.priority) queryParams.append("priority", params.priority); // ✅ Add priority
      if (params.search) queryParams.append("search", params.search); // ✅ Add search

      const queryString = queryParams.toString();
      const url = `/tasks/organization/${organizationId}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await api.get<TasksResponse>(url);
      return response.data;
    } catch (error) {
      console.error("Get tasks by organization error:", error);
      throw error;
    }
  },

  getSubtasksByParent: async (parentTaskId: string): Promise<Task[]> => {
    try {
      const response = await api.get<Task[]>(
        `/tasks?parentTaskId=${parentTaskId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get subtasks by parent error:", error);
      throw error;
    }
  },

  getTasksOnly: async (projectId?: string): Promise<Task[]> => {
    try {
      const query = projectId
        ? `?projectId=${projectId}&parentTaskId=null`
        : "?parentTaskId=null";
      const response = await api.get<Task[]>(`/tasks${query}`);
      return response.data;
    } catch (error) {
      console.error("Get tasks only error:", error);
      throw error;
    }
  },

  getSubtasksOnly: async (projectId?: string): Promise<Task[]> => {
    try {
      const baseQuery = projectId ? `?projectId=${projectId}` : "";
      const response = await api.get<Task[]>(`/tasks${baseQuery}`);
      return response.data.filter((task: any) => task.parentTaskId);
    } catch (error) {
      console.error("Get subtasks only error:", error);
      throw error;
    }
  },

  getTaskById: async (taskId: string): Promise<Task> => {
    try {
      const response = await api.get<Task>(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("Get task by ID error:", error);
      throw error;
    }
  },

  updateTask: async (
    taskId: string,
    taskData: UpdateTaskRequest
  ): Promise<Task> => {
    try {
      const response = await api.patch<Task>(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error("Update task error:", error);
      throw error;
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error("Delete task error:", error);
      throw error;
    }
  },

  getAllTaskStatuses: async (): Promise<TaskStatus[]> => {
    try {
      const response = await api.get<TaskStatus[]>("/task-statuses");
      return response.data;
    } catch (error) {
      console.error("Get task statuses error:", error);
      throw error;
    }
  },

  getTasksByWorkspace: async (workspaceId: string): Promise<Task[]> => {
    try {
      const response = await api.get<Task[]>(
        `/tasks?workspaceId=${workspaceId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get tasks by workspace error:", error);
      throw error;
    }
  },

  // Task Comment operations
  createTaskComment: async (
    commentData: CreateTaskCommentRequest
  ): Promise<TaskComment> => {
    try {
      const response = await api.post<TaskComment>(
        "/task-comments",
        commentData
      );
      return response.data;
    } catch (error) {
      console.error("Create task comment error:", error);
      throw error;
    }
  },

  getTaskComments: async (taskId: string): Promise<TaskComment[]> => {
    try {
      const response = await api.get<TaskComment[]>(
        `/task-comments?taskId=${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get task comments error:", error);
      throw error;
    }
  },

  updateTaskComment: async (
    commentId: string,
    userId: string,
    commentData: UpdateTaskCommentRequest
  ): Promise<TaskComment> => {
    try {
      const response = await api.patch<TaskComment>(
        `/task-comments/${commentId}?userId=${userId}`,
        commentData
      );
      return response.data;
    } catch (error) {
      console.error("Update task comment error:", error);
      throw error;
    }
  },

  deleteTaskComment: async (
    commentId: string,
    userId: string
  ): Promise<void> => {
    try {
      await api.delete(`/task-comments/${commentId}?userId=${userId}`);
    } catch (error) {
      console.error("Delete task comment error:", error);
      throw error;
    }
  },

  // Task Attachment operations
  uploadAttachment: async (
    taskId: string,
    file: File
  ): Promise<TaskAttachment> => {
    try {
      console.log("Uploading attachment for task:", taskId, "file:", file.name);

      const formData = new FormData();
      formData.append("file", file);

      // Use the specialized upload endpoint with form data
      const response = await api.post<TaskAttachment>(
        `/task-attachments/upload/${taskId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Attachment uploaded successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Upload attachment error:", error);
      throw error;
    }
  },

  createAttachment: async (
    attachmentData: CreateAttachmentRequest
  ): Promise<TaskAttachment> => {
    try {
      console.log("Creating attachment:", attachmentData);
      const response = await api.post<TaskAttachment>(
        "/task-attachments",
        attachmentData
      );
      return response.data;
    } catch (error) {
      console.error("Create attachment error:", error);
      throw error;
    }
  },

  getTaskAttachments: async (taskId: string): Promise<TaskAttachment[]> => {
    try {
      console.log("Fetching attachments for task:", taskId);
      const response = await api.get<TaskAttachment[]>(
        `/task-attachments/task/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get task attachments error:", error);
      throw error;
    }
  },

  getAttachmentById: async (attachmentId: string): Promise<TaskAttachment> => {
    try {
      console.log("Fetching attachment by ID:", attachmentId);
      const response = await api.get<TaskAttachment>(
        `/task-attachments/${attachmentId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get attachment by ID error:", error);
      throw error;
    }
  },

  downloadAttachment: async (attachmentId: string): Promise<Blob> => {
    try {
      console.log("Downloading attachment:", attachmentId);
      const response = await api.get(
        `/task-attachments/${attachmentId}/download`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Download attachment error:", error);
      throw error;
    }
  },

  previewFile: async (attachmentId: string): Promise<Blob> => {
    try {
      console.log("Previewing file:", attachmentId);
      const response = await api.get(
        `/task-attachments/${attachmentId}/preview`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Preview file error:", error);
      throw error;
    }
  },

  getAttachmentStats: async (taskId?: string): Promise<AttachmentStats> => {
    try {
      const query = taskId ? `?taskId=${taskId}` : "";
      console.log("Fetching attachment stats with query:", query);
      const response = await api.get<AttachmentStats>(
        `/task-attachments/stats${query}`
      );
      return response.data;
    } catch (error) {
      console.error("Get attachment stats error:", error);
      throw error;
    }
  },

  deleteAttachment: async (
    attachmentId: string,
    requestUserId: string
  ): Promise<void> => {
    try {
      console.log(
        "Deleting attachment:",
        attachmentId,
        "by user:",
        requestUserId
      );
      await api.delete(
        `/task-attachments/${attachmentId}?requestUserId=${requestUserId}`
      );
      console.log("Attachment deleted successfully");
    } catch (error) {
      console.error("Delete attachment error:", error);
      throw error;
    }
  },

  // Task Label operations
  createLabel: async (labelData: CreateLabelRequest): Promise<TaskLabel> => {
    try {
      console.log("Creating label:", labelData);
      const response = await api.post<TaskLabel>("/labels", labelData);
      console.log("Label created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create label error:", error);
      throw error;
    }
  },

  getProjectLabels: async (projectId: string): Promise<TaskLabel[]> => {
    try {
      console.log("Fetching labels for project:", projectId);
      const response = await api.get<TaskLabel[]>(
        `/labels?projectId=${projectId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get project labels error:", error);
      throw error;
    }
  },

  getLabelById: async (labelId: string): Promise<TaskLabel> => {
    try {
      console.log("Fetching label by ID:", labelId);
      const response = await api.get<TaskLabel>(`/labels/${labelId}`);
      return response.data;
    } catch (error) {
      console.error("Get label by ID error:", error);
      throw error;
    }
  },

  updateLabel: async (
    labelId: string,
    labelData: UpdateLabelRequest
  ): Promise<TaskLabel> => {
    try {
      console.log("Updating label:", labelId, "with data:", labelData);
      const response = await api.patch<TaskLabel>(
        `/labels/${labelId}`,
        labelData
      );
      console.log("Label updated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Update label error:", error);
      throw error;
    }
  },

  deleteLabel: async (labelId: string): Promise<void> => {
    try {
      console.log("Deleting label:", labelId);
      await api.delete(`/labels/${labelId}`);
      console.log("Label deleted successfully");
    } catch (error) {
      console.error("Delete label error:", error);
      throw error;
    }
  },

  assignLabelToTask: async (assignData: AssignLabelRequest): Promise<void> => {
    try {
      console.log("Assigning label to task:", assignData);
      await api.post("/task-labels/assign", assignData);
      console.log("Label assigned successfully");
    } catch (error) {
      console.error("Assign label to task error:", error);
      throw error;
    }
  },

  assignMultipleLabelsToTask: async (
    assignData: AssignMultipleLabelsRequest
  ): Promise<void> => {
    try {
      console.log("Assigning multiple labels to task:", assignData);
      await api.post("/task-labels/assign-multiple", assignData);
      console.log("Multiple labels assigned successfully");
    } catch (error) {
      console.error("Assign multiple labels to task error:", error);
      throw error;
    }
  },

  removeLabelFromTask: async (
    taskId: string,
    labelId: string
  ): Promise<void> => {
    try {
      console.log("Removing label from task:", { taskId, labelId });
      await api.delete(
        `/task-labels/remove?taskId=${taskId}&labelId=${labelId}`
      );
      console.log("Label removed successfully");
    } catch (error) {
      console.error("Remove label from task error:", error);
      throw error;
    }
  },

  getTaskLabels: async (taskId: string): Promise<TaskLabel[]> => {
    try {
      console.log("Fetching labels for task:", taskId);
      const response = await api.get<TaskLabel[]>(
        `/task-labels?taskId=${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get task labels error:", error);
      throw error;
    }
  },

  searchLabels: async (
    projectId: string,
    query: string
  ): Promise<TaskLabel[]> => {
    try {
      console.log(
        "Searching labels for project:",
        projectId,
        "with query:",
        query
      );
      const response = await api.get<TaskLabel[]>(
        `/labels/search?projectId=${projectId}&q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error("Search labels error:", error);
      throw error;
    }
  },
  getCurrentOrganization: (): string | null => {
    try {
      if (typeof window === "undefined") return null;

      const orgId = localStorage.getItem("currentOrganizationId");
      console.log("Getting current organization ID:", orgId);
      return orgId;
    } catch (error) {
      console.error("Error getting current organization:", error);
      return null;
    }
  },
  getTodayAgenda: async (
    organizationId: string,
    params: GetTasksParams = {}
  ): Promise<TasksResponse> => {
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());

      // Add organization ID as required parameter
      queryParams.append("organizationId", organizationId);

      const queryString = queryParams.toString();
      const url = `/tasks/today?${queryString}`;

      const response = await api.get<TasksResponse>(url);
      return response.data;
    } catch (error) {
      console.error("Get today agenda error:", error);
      throw error;
    }
  },
};
