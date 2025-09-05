export interface ProjectSettings {
  methodology?: string;
  defaultTaskType?: string;
  enableTimeTracking?: boolean;
  allowSubtasks?: boolean;
  workflowId?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  color?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  workspaceId?: string;
  organizationId?: string;
  slug?: string;
  settings?: ProjectSettings;
  createdAt?: string;
  updatedAt?: string;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    tasks?: number;
    members?: number;
    sprints?: number;
  };
  projectId?: string;
  role?: string;
  userId?: string;
  joinedAt?: string;
  avatar?: string;
}
export interface ProjectData {
  name: string;
  slug: string;
  color: string;
  avatar?: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  settings: ProjectSettings;
  workspaceId: string;
  workflowId?: string;
}
export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalMembers: number;
  completionRate: number;
}