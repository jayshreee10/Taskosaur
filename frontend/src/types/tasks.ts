
export enum TaskType {
  TASK = 'TASK',
  BUG = 'BUG',
  EPIC = 'EPIC',
  STORY = 'STORY',
  SUBTASK = 'SUBTASK'
}

export enum TaskPriority {
  LOWEST = 'LOWEST',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  HIGHEST = 'HIGHEST'
}

export enum StatusCategory {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export enum DependencyType {
  BLOCKS = 'BLOCKS',
  FINISH_START = 'FINISH_START',
  START_START = 'START_START',
  FINISH_FINISH = 'FINISH_FINISH',
  START_FINISH = 'START_FINISH'
}

export interface TaskStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
  category: StatusCategory;
  order: number;
  isDefault: boolean;
  workflowId: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  projectId: string;
}

export interface TaskDependency {
  id: string;
  type: DependencyType;
  dependentTaskId: string;
  blockingTaskId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  taskId: string;
  uploadedById: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  description?: string;
  timeSpent: number; // in minutes
  date: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  
  // Identifiers
  taskNumber: number;
  key: string; // Generated key like "PROJ-123"
  
  // Dates
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  
  // Story Points & Estimation
  storyPoints?: number;
  originalEstimate?: number; // in minutes
  remainingEstimate?: number; // in minutes
  
  // Custom Fields
  customFields?: Record<string, any>;
  
  // Relations
  projectId: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  reporterId: string;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  statusId: string;
  status: TaskStatus;
  sprintId?: string;
  
  // Hierarchy
  parentTaskId?: string;
  parentTask?: Task;
  childTasks?: Task[];
  
  // Many-to-many relations
  labels?: TaskLabel[];
  watchers?: Array<{ id: string; firstName: string; lastName: string; avatar?: string }>;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  timeEntries?: TimeEntry[];
  
  // Task Dependencies
  dependsOn?: TaskDependency[];
  blocks?: TaskDependency[];
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  statusId: string;
  sprintId?: string;
  parentTaskId?: string;
  startDate?: string;
  dueDate?: string;
  storyPoints?: number;
  originalEstimate?: number;
  customFields?: Record<string, any>;
  labels?: string[];
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}

export interface TaskFilter {
  search?: string;
  assigneeIds?: string[];
  reporterIds?: string[];
  statusIds?: string[];
  labelIds?: string[];
  priorities?: TaskPriority[];
  types?: TaskType[];
  sprintIds?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  hasAttachments?: boolean;
  hasComments?: boolean;
}

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  description?: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  status: SprintStatus;
  projectId: string;
  capacity?: number; // in hours
  velocity?: number; // story points per day
  createdAt: string;
  updatedAt: string;
}