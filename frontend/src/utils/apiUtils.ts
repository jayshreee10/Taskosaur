
import { 
  Task, 
  Workspace, 
  Project, 
  Activity, 
  Member, 
  Stat, 
  Deadline,
  Organization,
  OrganizationMember,
  OrganizationStats,
  OrganizationActivity,
} from '@/types';


async function fetchFromApi<T>(endpoint: string): Promise<T> {
  // Determine if we're running on the server or client
  const isServer = typeof window === 'undefined';
  
  try {
    if (isServer) {
      // Use dynamic imports with webpack magic comments to prevent bundling on client
      const { promises: fs } = await import(/* webpackIgnore: true */ 'fs');
      const path = await import(/* webpackIgnore: true */ 'path');
      const filePath = path.join(process.cwd(), 'public', 'mock', `${endpoint}.json`);
      const fileContents = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContents) as T;
    } else {
      const url = `/mock/${endpoint}.json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching JSON: ${response.status} ${response.statusText}`);
      }
      
      return response.json() as Promise<T>;
    }
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    return [] as unknown as T;
  }
}

/**
 * API functions to fetch data - these can be used in both client and server components
 */

export const getWorkspaces = (organizationId?: string): Promise<Workspace[]> => {
  return fetchFromApi<Workspace[]>('workspaces').then(workspaces => 
    organizationId ? workspaces.filter(w => w.organizationId === organizationId) : workspaces
  );
};

export const getProjects = (): Promise<Project[]> => {
  return fetchFromApi<Project[]>('projects');
};

export const getTasks = (): Promise<Task[]> => {
  return fetchFromApi<Task[]>('tasks');
};

export const getStats = (): Promise<Stat[]> => {
  return fetchFromApi<Stat[]>('stats');
};

export const getActivities = (): Promise<Activity[]> => {
  return fetchFromApi<Activity[]>('activities');
};

export const getWorkspaceActivities = async (workspaceSlug?: string): Promise<Activity[]> => {
  const activities = await fetchFromApi<Activity[]>('workspace-activity');
  
  // If a workspace slug is provided, filter activities for that workspace
  if (workspaceSlug) {
    return activities.filter(activity => activity.workspace === workspaceSlug);
  }
  
  return activities;
};

export const getMembers = (): Promise<Member[]> => {
  return fetchFromApi<Member[]>('members');
};

export const getDeadlines = (): Promise<Deadline[]> => {
  return fetchFromApi<Deadline[]>('deadlines');
};

export const getTasksByProject = async (projectId: string): Promise<Task[]> => {
  const tasks = await getTasks();
  // In a real app, this would filter by project ID
  // For the mock data, we'll just return all tasks
  return tasks;
};

export const getProjectBySlug = async (slug: string): Promise<Project | null> => {
  const projects = await getProjects();
  const project = projects.find(project => project.slug === slug);
  
  if (!project) {
    console.error(`Project with slug "${slug}" not found`);
    return null;
  }
  
  return project;
};

export const getWorkspaceBySlug = async (slug: string): Promise<Workspace | null> => {
  const workspaces = await getWorkspaces();
  const workspace = workspaces.find(workspace => workspace.slug === slug);
  
  if (!workspace) {
    console.error(`Workspace with slug "${slug}" not found`);
    return null;
  }
  
  return workspace;
};

// This is a mock implementation of updating task tags
// In a real application, this would make an API call to the backend
export const updateTaskTags = async (taskId: string, tags: any[]): Promise<boolean> => {

  // Simulate a successful API call
  return true;
};

// Organization API functions
export const getOrganizations = (): Promise<Organization[]> => {
  return fetchFromApi<Organization[]>('organizations');
};

export const getOrganizationById = async (id: string): Promise<Organization | null> => {
  const organizations = await getOrganizations();
  const organization = organizations.find(org => org.id === id);
  
  if (!organization) {
    console.error(`Organization with id "${id}" not found`);
    return null;
  }
  
  return organization;
};

export const getOrganizationBySlug = async (slug: string): Promise<Organization | null> => {
  const organizations = await getOrganizations();
  const organization = organizations.find(org => org.slug === slug);
  
  if (!organization) {
    console.error(`Organization with slug "${slug}" not found`);
    return null;
  }
  
  return organization;
};

export const getOrganizationMembers = async (organizationId: string): Promise<OrganizationMember[]> => {
  const members = await fetchFromApi<OrganizationMember[]>('organization-members');
  return members.filter(member => member.organizationId === organizationId);
};

export const getOrganizationStats = async (organizationId: string): Promise<OrganizationStats> => {
  // In a real app, this would be fetched from the API
  // For now, we'll return mock stats
  return {
    totalMembers: 12,
    totalWorkspaces: 3,
    totalProjects: 8,
    totalTasks: 156,
    completedTasks: 89,
    activeMembers: 9,
    tasksThisWeek: 23,
    projectsThisMonth: 2,
  };
};

export const getOrganizationActivity = async (organizationId: string): Promise<OrganizationActivity[]> => {
  const activities = await fetchFromApi<OrganizationActivity[]>('organization-activity');
  return activities.filter(activity => activity.metadata?.organizationId === organizationId);
};

// Mock implementations for organization CRUD operations
export const createOrganization = async (data: any): Promise<Organization> => {

  // In a real app, this would make an API call
  return {
    id: Date.now().toString(),
    ...data,
    memberCount: 1,
    workspaceCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const updateOrganization = async (id: string, data: any): Promise<Organization> => {

  // In a real app, this would make an API call
  const organization = await getOrganizationById(id);
  if (!organization) {
    throw new Error('Organization not found');
  }
  return {
    ...organization,
    ...data,
    updatedAt: new Date().toISOString(),
  };
};

export const deleteOrganization = async (id: string): Promise<boolean> => {

  // In a real app, this would make an API call
  return true;
};

export const inviteOrganizationMember = async (organizationId: string, data: any): Promise<boolean> => {

  // In a real app, this would make an API call
  return true;
};

export const updateOrganizationMemberRole = async (memberId: string, role: string): Promise<boolean> => {

  // In a real app, this would make an API call
  return true;
};

export const removeOrganizationMember = async (memberId: string): Promise<boolean> => {

  // In a real app, this would make an API call
  return true;
};

// Password Reset API Functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Send forgot password request
 * Backend endpoint: POST /auth/forgot-password
 */
export const sendForgotPasswordRequest = async (data: ForgotPasswordData): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send password reset email');
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

/**
 * Validate reset password token
 * Backend endpoint: GET /auth/verify-reset-token/:token
 */
export const validateResetToken = async (token: string): Promise<ApiResponse<{ valid: boolean }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      message: data.message || (response.ok ? 'Token is valid' : 'Invalid or expired reset token'),
      data: { valid: data.valid || false }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to validate reset token',
      data: { valid: false }
    };
  }
};

/**
 * Reset user password with token
 * Backend endpoint: POST /auth/reset-password
 */
export const resetPassword = async (data: ResetPasswordData): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reset password');
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reset password');
  }
};