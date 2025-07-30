"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import { getAccessToken, authFetch } from '../../utils/authFetch';

// Import getCookie for token access
const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};


const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
  startDate: string;
  dueDate: string;
  projectId: string;
  assigneeId?: string;
  reporterId?: string;
  statusId: string;
  remainingEstimate?: number;
  parentTaskId?: string; // For subtasks
  createdAt?: string;
  updatedAt?: string;
}

interface CreateTaskRequest {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
  startDate: string;
  dueDate: string;
  projectId: string;
  assigneeId?: string;
  reporterId?: string;
  statusId: string;
  parentTaskId?: string; // For creating subtasks
}

interface CreateSubtaskRequest extends CreateTaskRequest {
  parentTaskId: string; // Required for subtasks
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
  startDate?: string;
  dueDate?: string;
  remainingEstimate?: number;
  assigneeId?: string;
  reporterId?: string;
  statusId?: string;
  projectId?: string;
}

interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  parentCommentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateTaskCommentRequest {
  content: string;
  taskId: string;
  authorId: string;
  parentCommentId?: string;
}

interface UpdateTaskCommentRequest {
  content: string;
}

// Task Attachment interfaces
interface TaskAttachment {
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

interface CreateAttachmentRequest {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  taskId: string;
}

interface AttachmentStats {
  totalAttachments: number;
  totalSize: number;
  fileTypes: Record<string, number>;
}

// Task Label interfaces
interface TaskLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateLabelRequest {
  name: string;
  color: string;
  description?: string;
  projectId: string;
}

interface UpdateLabelRequest {
  name?: string;
  color?: string;
  description?: string;
}

interface AssignLabelRequest {
  taskId: string;
  labelId: string;
}

interface AssignMultipleLabelsRequest {
  taskId: string;
  labelIds: string[];
}

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Task operations
  createTask: (taskData: CreateTaskRequest) => Promise<Task>;
  createSubtask: (subtaskData: CreateSubtaskRequest) => Promise<Task>;
  getAllTasks: () => Promise<Task[]>;
  getTasksByProject: (projectId: string) => Promise<Task[]>;
  getSubtasksByParent: (parentTaskId: string) => Promise<Task[]>;
  getTasksOnly: (projectId?: string) => Promise<Task[]>;
  getSubtasksOnly: (projectId?: string) => Promise<Task[]>;
  getTaskById: (taskId: string) => Promise<Task>;
  updateTask: (taskId: string, taskData: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  getAllTaskStatuses: () => Promise<TaskStatus[]>;
  getTasksByWorkspace: (workspaceId: string) => Promise<Task[]>;
  
  // Task comment operations
  createTaskComment: (commentData: CreateTaskCommentRequest) => Promise<TaskComment>;
  getTaskComments: (taskId: string) => Promise<TaskComment[]>;
  updateTaskComment: (commentId: string, userId: string, commentData: UpdateTaskCommentRequest) => Promise<TaskComment>;
  deleteTaskComment: (commentId: string, userId: string) => Promise<void>;
  
  // Task attachment operations
  uploadAttachment: (taskId: string, file: File) => Promise<TaskAttachment>;
  createAttachment: (attachmentData: CreateAttachmentRequest) => Promise<TaskAttachment>;
  getTaskAttachments: (taskId: string) => Promise<TaskAttachment[]>;
  getAttachmentById: (attachmentId: string) => Promise<TaskAttachment>;
  downloadAttachment: (attachmentId: string) => Promise<Blob>;
  previewFile: (attachmentId: string) => Promise<Blob>;
  getAttachmentStats: (taskId?: string) => Promise<AttachmentStats>;
  deleteAttachment: (attachmentId: string, requestUserId: string) => Promise<void>;
  
  // Task label operations
  createLabel: (labelData: CreateLabelRequest) => Promise<TaskLabel>;
  getProjectLabels: (projectId: string) => Promise<TaskLabel[]>;
  getLabelById: (labelId: string) => Promise<TaskLabel>;
  updateLabel: (labelId: string, labelData: UpdateLabelRequest) => Promise<TaskLabel>;
  deleteLabel: (labelId: string) => Promise<void>;
  assignLabelToTask: (assignData: AssignLabelRequest) => Promise<void>;
  assignMultipleLabelsToTask: (assignData: AssignMultipleLabelsRequest) => Promise<void>;
  removeLabelFromTask: (taskId: string, labelId: string) => Promise<void>;
  getTaskLabels: (taskId: string) => Promise<TaskLabel[]>;
  searchLabels: (projectId: string, query: string) => Promise<TaskLabel[]>;
  
  // Utility
  clearError: () => void;
}

interface TaskStatus {
  id: string;
  name: string;
  color?: string;
  order?: number;
}

// Context
export const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Custom hook
export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

class TaskService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = getAccessToken();
    
    // Debug: Log the URL being called and token status
    // console.log('Task API Request:', {
    //   baseUrl: this.baseUrl,
    //   endpoint,
    //   fullUrl: url,
    //   hasAccessToken: !!accessToken,
    //   accessTokenLength: accessToken?.length || 0,
    //   tokenPreview: accessToken ? `${accessToken.substring(0, 10)}...` : 'none'
    // });
    
    // Ensure we have the correct headers for CORS and authentication
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Don't override authFetch's default behavior - let it handle auth automatically
    const response = await authFetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Task API Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        console.warn('Task API: Authentication failed - user might need to log in again');
      } else if (response.status === 403) {
        console.warn('Task API: Access forbidden - insufficient permissions');
      } else if (response.status === 404) {
        console.warn('Task API: Resource not found');
      }
      
      throw new Error(errorData.message || `Task API HTTP error! status: ${response.status}`);
    }

    // Check if response has content
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    // If no content or content-length is 0, return empty object for void responses
    if (contentLength === '0' || response.status === 204) {
      // console.log('Task API: Empty response received');
      return {} as T;
    }

    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      // console.log('Task API Response data:', responseData);
      return responseData;
    } else {
      const responseText = await response.text();
      // console.log('Task API Response text:', responseText);
      
      if (!responseText.trim()) {
        return {} as T;
      }
      
      try {
        return JSON.parse(responseText);
      } catch {
        // console.log('Task API: Non-JSON response, returning empty object');
        return {} as T;
      }
    }
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
   
    return this.makeRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async createSubtask(subtaskData: CreateSubtaskRequest): Promise<Task> {
    
    return this.makeRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(subtaskData),
    });
  }

  async getAllTasks(): Promise<Task[]> {
    return this.makeRequest<Task[]>('/tasks');
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return this.makeRequest<Task[]>(`/tasks?projectId=${projectId}`);
  }

  async getSubtasksByParent(parentTaskId: string): Promise<Task[]> {

    return this.makeRequest<Task[]>(`/tasks?parentTaskId=${parentTaskId}`);
  }

  async getTasksOnly(projectId?: string): Promise<Task[]> {

    const query = projectId ? `?projectId=${projectId}&parentTaskId=null` : '?parentTaskId=null';
    return this.makeRequest<Task[]>(`/tasks${query}`);
  }

  async getSubtasksOnly(projectId?: string): Promise<Task[]> {
   
    const baseQuery = projectId ? `?projectId=${projectId}` : '';
   
    const allTasks = await this.makeRequest<Task[]>(`/tasks${baseQuery}`);
    return allTasks.filter(task => task.parentTaskId);
  }

  async getTaskById(taskId: string): Promise<Task> {
    return this.makeRequest<Task>(`/tasks/${taskId}`);
  }

  async updateTask(taskId: string, taskData: UpdateTaskRequest): Promise<Task> {

    return this.makeRequest<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(taskId: string): Promise<void> {

    return this.makeRequest<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async getAllTaskStatuses(): Promise<TaskStatus[]> {
    return this.makeRequest<TaskStatus[]>('/task-statuses');
  }

  async getTasksByWorkspace(workspaceId: string): Promise<Task[]> {
    return this.makeRequest<Task[]>(`/tasks?workspaceId=${workspaceId}`);
  }

  async createTaskComment(commentData: CreateTaskCommentRequest): Promise<TaskComment> {

    return this.makeRequest<TaskComment>('/task-comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {

    return this.makeRequest<TaskComment[]>(`/task-comments?taskId=${taskId}`);
  }

  async updateTaskComment(commentId: string, userId: string, commentData: UpdateTaskCommentRequest): Promise<TaskComment> {

    return this.makeRequest<TaskComment>(`/task-comments/${commentId}?userId=${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(commentData),
    });
  }

  async deleteTaskComment(commentId: string, userId: string): Promise<void> {

    return this.makeRequest<void>(`/task-comments/${commentId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  // Task Attachment methods
  async uploadAttachment(taskId: string, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/task-attachments/upload/${taskId}`;
    
    // console.log('Task API Upload:', { url, taskId, fileName: file.name, fileSize: file.size });
    
    // Get tokens for authentication - try multiple approaches
    const accessToken = getAccessToken();
    const taskosourToken = getCookie('taskosourtoken');
    
    const headers: Record<string, string> = {};
    
    // Try Authorization header first
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Also try the taskosour token directly if available
    if (taskosourToken && !accessToken) {
      headers['Authorization'] = `Bearer ${taskosourToken}`;
    }
    
    // console.log('Upload authentication:', { 
    //   hasAccessToken: !!accessToken,
    //   hasTaskosourToken: !!taskosourToken,
    //   usingAuth: !!headers['Authorization']
    // });
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers
    });

    // console.log('Upload response:', { 
    //   status: response.status, 
    //   statusText: response.statusText
    // });

    // If we get 401 and have taskosour token, try it as Bearer token
    if (response.status === 401 && taskosourToken && !accessToken) {
      // console.log('Retrying upload with taskosour token as Bearer');
      
      const retryHeaders = {
        'Authorization': `Bearer ${taskosourToken}`
      };
      
      const retryResponse = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: retryHeaders
      });
      
      if (retryResponse.ok) {
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Task API Upload error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(errorData.message || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  async createAttachment(attachmentData: CreateAttachmentRequest): Promise<TaskAttachment> {
    return this.makeRequest<TaskAttachment>('/task-attachments', {
      method: 'POST',
      body: JSON.stringify(attachmentData),
    });
  }

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    return this.makeRequest<TaskAttachment[]>(`/task-attachments/task/${taskId}`);
  }

  async getAttachmentById(attachmentId: string): Promise<TaskAttachment> {
    return this.makeRequest<TaskAttachment>(`/task-attachments/${attachmentId}`);
  }

  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const url = `${this.baseUrl}/task-attachments/${attachmentId}/download`;
    
    // console.log('Task API Download:', { url, attachmentId });
    
    // Get tokens for authentication - try multiple approaches
    const accessToken = getAccessToken();
    const taskosourToken = getCookie('taskosourtoken');
    
    const headers: Record<string, string> = {};
    
    // Try Authorization header first
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (taskosourToken) {
      headers['Authorization'] = `Bearer ${taskosourToken}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    // console.log('Download response:', { 
    //   status: response.status, 
    //   statusText: response.statusText 
    // });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Task API Download error response:', errorText);
      throw new Error(`Download failed: ${response.status} - ${errorText}`);
    }

    return response.blob();
  }

  async previewFile(attachmentId: string): Promise<Blob> {
    const url = `${this.baseUrl}/task-attachments/${attachmentId}/preview`;
    
    // console.log('Task API Preview:', { url, attachmentId });
    
    // Get tokens for authentication - try multiple approaches
    const accessToken = getAccessToken();
    const taskosourToken = getCookie('taskosourtoken');
    
    const headers: Record<string, string> = {};
    
    // Try Authorization header first
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (taskosourToken) {
      headers['Authorization'] = `Bearer ${taskosourToken}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    // console.log('Preview response:', { 
    //   status: response.status, 
    //   statusText: response.statusText 
    // });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Task API Preview error response:', errorText);
      throw new Error(`Preview failed: ${response.status} - ${errorText}`);
    }

    return response.blob();
  }

  async getAttachmentStats(taskId?: string): Promise<AttachmentStats> {
    const query = taskId ? `?taskId=${taskId}` : '';
    return this.makeRequest<AttachmentStats>(`/task-attachments/stats${query}`);
  }

  async deleteAttachment(attachmentId: string, requestUserId: string): Promise<void> {
    return this.makeRequest<void>(`/task-attachments/${attachmentId}?requestUserId=${requestUserId}`, {
      method: 'DELETE',
    });
  }

  // Task Label methods
  async createLabel(labelData: CreateLabelRequest): Promise<TaskLabel> {
    return this.makeRequest<TaskLabel>('/labels', {
      method: 'POST',
      body: JSON.stringify(labelData),
    });
  }

  async getProjectLabels(projectId: string): Promise<TaskLabel[]> {
    return this.makeRequest<TaskLabel[]>(`/labels?projectId=${projectId}`);
  }

  async getLabelById(labelId: string): Promise<TaskLabel> {
    return this.makeRequest<TaskLabel>(`/labels/${labelId}`);
  }

  async updateLabel(labelId: string, labelData: UpdateLabelRequest): Promise<TaskLabel> {
    return this.makeRequest<TaskLabel>(`/labels/${labelId}`, {
      method: 'PATCH',
      body: JSON.stringify(labelData),
    });
  }

  async deleteLabel(labelId: string): Promise<void> {
    return this.makeRequest<void>(`/labels/${labelId}`, {
      method: 'DELETE',
    });
  }

  async assignLabelToTask(assignData: AssignLabelRequest): Promise<void> {
    return this.makeRequest<void>('/task-labels/assign', {
      method: 'POST',
      body: JSON.stringify(assignData),
    });
  }

  async assignMultipleLabelsToTask(assignData: AssignMultipleLabelsRequest): Promise<void> {
    return this.makeRequest<void>('/task-labels/assign-multiple', {
      method: 'POST',
      body: JSON.stringify(assignData),
    });
  }

  async removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
    return this.makeRequest<void>(`/task-labels/remove?taskId=${taskId}&labelId=${labelId}`, {
      method: 'DELETE',
    });
  }

  async getTaskLabels(taskId: string): Promise<TaskLabel[]> {
    return this.makeRequest<TaskLabel[]>(`/task-labels?taskId=${taskId}`);
  }

  async searchLabels(projectId: string, query: string): Promise<TaskLabel[]> {
    return this.makeRequest<TaskLabel[]>(`/labels/search?projectId=${projectId}&q=${encodeURIComponent(query)}`);
  }
}


function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taskService = new TaskService(BASE_URL);

  const handleError = (err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(errorMessage);
    console.error('Task API Error:', err);
  };

  const clearError = () => {
    setError(null);
  };

  const createTask = async (taskData: CreateTaskRequest): Promise<Task> => {
 
    setLoading(true);
    setError(null);
    try {
      const newTask = await taskService.createTask(taskData);
     
      if (!newTask.parentTaskId) {
        setTasks(prev => [...prev, newTask]);
      }
      // console.log('Task created successfully:', newTask);
      return newTask;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSubtask = async (subtaskData: CreateSubtaskRequest): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const newSubtask = await taskService.createSubtask(subtaskData);
      // console.log('Subtask created successfully:', newSubtask);
      return newSubtask;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllTasks = async (): Promise<Task[]> => {
    setLoading(true);
    setError(null);
    try {
      const allTasks = await taskService.getAllTasks();
      setTasks(allTasks);
      return allTasks;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTasksByProject = async (projectId: string): Promise<Task[]> => {
    // console.log('Task Context: getTasksByProject called with projectId:', projectId);
    
    // Check authentication status
    const accessToken = getAccessToken();
    // console.log('Task Context: Authentication check', {
    //   hasAccessToken: !!accessToken,
    //   tokenLength: accessToken?.length || 0
    // });
    
    setLoading(true);
    setError(null);
    try {
      const projectTasks = await taskService.getTasksByProject(projectId);
      // console.log('Task Context: Successfully fetched tasks:', projectTasks);
      return projectTasks;
    } catch (err) {
      console.error('Task Context: Error in getTasksByProject:', err);
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSubtasksByParent = async (parentTaskId: string): Promise<Task[]> => {
  
    setLoading(true);
    setError(null);
    try {
      const subtasks = await taskService.getSubtasksByParent(parentTaskId);
      // console.log('Subtasks fetched successfully:', subtasks);
      return subtasks;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTasksOnly = async (projectId?: string): Promise<Task[]> => {
 
    setLoading(true);
    setError(null);
    try {
      const tasks = await taskService.getTasksOnly(projectId);
      // console.log('Tasks only fetched successfully:', tasks);
      return tasks;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSubtasksOnly = async (projectId?: string): Promise<Task[]> => {
    setLoading(true);
    setError(null);
    try {
      const subtasks = await taskService.getSubtasksOnly(projectId);
      // console.log('Subtasks only fetched successfully:', subtasks);
      return subtasks;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTaskById = async (taskId: string): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const task = await taskService.getTaskById(taskId);
      return task;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, taskData: UpdateTaskRequest): Promise<Task> => {
   
    setLoading(true);
    setError(null);
    try {
      const updatedTask = await taskService.updateTask(taskId, taskData);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      // console.log('Task updated successfully:', updatedTask);
      return updatedTask;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {

    setLoading(true);
    setError(null);
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      // console.log('Task deleted successfully');
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllTaskStatuses = async (): Promise<TaskStatus[]> => {
    setLoading(true);
    setError(null);
    try {
      const taskStatuses = await taskService.getAllTaskStatuses();
      return taskStatuses.length > 0 ? taskStatuses : [];
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTasksByWorkspace = async (workspaceId: string): Promise<Task[]> => {
    setLoading(true);
    setError(null);
    try {
      const workspaceTasks = await taskService.getTasksByWorkspace(workspaceId);
      return workspaceTasks;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createTaskComment = async (commentData: CreateTaskCommentRequest): Promise<TaskComment> => {
   
    setLoading(true);
    setError(null);
    try {
      const newComment = await taskService.createTaskComment(commentData);
      // console.log('Task comment created successfully:', newComment);
      return newComment;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {

    setLoading(true);
    setError(null);
    try {
      const comments = await taskService.getTaskComments(taskId);
      // console.log('Task comments fetched successfully:', comments);
      return comments;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTaskComment = async (commentId: string, userId: string, commentData: UpdateTaskCommentRequest): Promise<TaskComment> => {
    setLoading(true);
    setError(null);
    try {
      const updatedComment = await taskService.updateTaskComment(commentId, userId, commentData);
      // console.log('Task comment updated successfully:', updatedComment);
      return updatedComment;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTaskComment = async (commentId: string, userId: string): Promise<void> => {
 
    setLoading(true);
    setError(null);
    try {
      await taskService.deleteTaskComment(commentId, userId);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Task Attachment provider methods
  const uploadAttachment = async (taskId: string, file: File): Promise<TaskAttachment> => {
    setLoading(true);
    setError(null);
    try {
      const attachment = await taskService.uploadAttachment(taskId, file);
      return attachment;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createAttachment = async (attachmentData: CreateAttachmentRequest): Promise<TaskAttachment> => {
    setLoading(true);
    setError(null);
    try {
      const attachment = await taskService.createAttachment(attachmentData);
      return attachment;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTaskAttachments = async (taskId: string): Promise<TaskAttachment[]> => {
    setLoading(true);
    setError(null);
    try {
      const attachments = await taskService.getTaskAttachments(taskId);
      return attachments;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAttachmentById = async (attachmentId: string): Promise<TaskAttachment> => {
    setLoading(true);
    setError(null);
    try {
      const attachment = await taskService.getAttachmentById(attachmentId);
      return attachment;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const downloadAttachment = async (attachmentId: string): Promise<Blob> => {
    setLoading(true);
    setError(null);
    try {
      const blob = await taskService.downloadAttachment(attachmentId);
      return blob;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const previewFile = async (attachmentId: string): Promise<Blob> => {
    setLoading(true);
    setError(null);
    try {
      const blob = await taskService.previewFile(attachmentId);
      return blob;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAttachmentStats = async (taskId?: string): Promise<AttachmentStats> => {
    setLoading(true);
    setError(null);
    try {
      const stats = await taskService.getAttachmentStats(taskId);
      return stats;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAttachment = async (attachmentId: string, requestUserId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await taskService.deleteAttachment(attachmentId, requestUserId);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Task Label provider methods
  const createLabel = async (labelData: CreateLabelRequest): Promise<TaskLabel> => {
    setLoading(true);
    setError(null);
    try {
      const label = await taskService.createLabel(labelData);
      return label;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProjectLabels = async (projectId: string): Promise<TaskLabel[]> => {
    setLoading(true);
    setError(null);
    try {
      const labels = await taskService.getProjectLabels(projectId);
      return labels;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getLabelById = async (labelId: string): Promise<TaskLabel> => {
    setLoading(true);
    setError(null);
    try {
      const label = await taskService.getLabelById(labelId);
      return label;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLabel = async (labelId: string, labelData: UpdateLabelRequest): Promise<TaskLabel> => {
    setLoading(true);
    setError(null);
    try {
      const label = await taskService.updateLabel(labelId, labelData);
      return label;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteLabel = async (labelId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await taskService.deleteLabel(labelId);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignLabelToTask = async (assignData: AssignLabelRequest): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await taskService.assignLabelToTask(assignData);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignMultipleLabelsToTask = async (assignData: AssignMultipleLabelsRequest): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await taskService.assignMultipleLabelsToTask(assignData);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeLabelFromTask = async (taskId: string, labelId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await taskService.removeLabelFromTask(taskId, labelId);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTaskLabels = async (taskId: string): Promise<TaskLabel[]> => {
    setLoading(true);
    setError(null);
    try {
      const labels = await taskService.getTaskLabels(taskId);
      return labels;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchLabels = async (projectId: string, query: string): Promise<TaskLabel[]> => {
    setLoading(true);
    setError(null);
    try {
      const labels = await taskService.searchLabels(projectId, query);
      return labels;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const contextValue: TaskContextType = {
    tasks,
    loading,
    error,
    createTask,
    createSubtask,
    getAllTasks,
    getTasksByProject,
    getSubtasksByParent,
    getTasksOnly,
    getSubtasksOnly,
    getTaskById,
    updateTask,
    deleteTask,
    getAllTaskStatuses,
    getTasksByWorkspace,
    createTaskComment,
    getTaskComments,
    updateTaskComment,
    deleteTaskComment,
    clearError,
    uploadAttachment,
    createAttachment,
    getTaskAttachments,
    getAttachmentById,
    downloadAttachment,
    previewFile,
    getAttachmentStats,
    deleteAttachment,
    createLabel,
    getProjectLabels,
    getLabelById,
    updateLabel,
    deleteLabel,
    assignLabelToTask,
    assignMultipleLabelsToTask,
    removeLabelFromTask,
    getTaskLabels,
    searchLabels,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}

export default TaskProvider;

// Export types for components to use
export type {
  Task,
  CreateTaskRequest,
  CreateSubtaskRequest,
  UpdateTaskRequest,
  TaskComment,
  CreateTaskCommentRequest,
  UpdateTaskCommentRequest,
  TaskStatus,
  TaskAttachment,
  CreateAttachmentRequest,
  AttachmentStats,
  TaskLabel,
  CreateLabelRequest,
  UpdateLabelRequest,
  AssignLabelRequest,
  AssignMultipleLabelsRequest
};