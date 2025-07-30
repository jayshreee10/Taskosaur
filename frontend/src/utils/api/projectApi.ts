
import api from '@/lib/api';
import { authApi } from './authApi';

export interface ProjectSettings {
  methodology: string;
  defaultTaskType: string;
  enableTimeTracking: boolean;
  allowSubtasks: boolean;
  workflowId: string;
}

export interface ProjectData {
  name: string;
  key: string;
  description: string;
  color: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  workspaceId: string;
  settings: ProjectSettings;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  color: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  workspaceId: string;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface InviteMemberData {
  email: string;
  projectId: string;
  role: string;
}

export interface AddMemberData {
  userId: string;
  projectId: string;
  role: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  joinedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface OrganizationMember {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalMembers: number;
  completionRate: number;
}

export const projectApi = {
  // Project CRUD operations
  listProjects: async (): Promise<Project[]> => {
    try {
      console.log('Fetching all projects');
      const response = await api.get<Project[]>('/projects');
      return response.data;
    } catch (error) {
      console.error('List projects error:', error);
      throw error;
    }
  },

  createProject: async (projectData: ProjectData): Promise<Project> => {
    try {
      console.log('Creating project with data:', projectData);
      const response = await api.post<Project>('/projects', projectData);
      console.log('Project created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    try {
      console.log('Fetching project by ID:', projectId);
      const response = await api.get<Project>(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Get project by ID error:', error);
      throw error;
    }
  },

  getProjectsByWorkspace: async (workspaceId: string): Promise<Project[]> => {
    try {
      console.log('Fetching projects for workspace:', workspaceId);
      const response = await api.get<Project[]>(`/projects?workspaceId=${workspaceId}`);
      return response.data;
    } catch (error) {
      console.error('Get projects by workspace error:', error);
      throw error;
    }
  },

  updateProject: async (projectId: string, projectData: Partial<ProjectData>): Promise<Project> => {
    try {
      console.log('Updating project:', projectId, 'with data:', projectData);
      const response = await api.patch<Project>(`/projects/${projectId}`, projectData);
      console.log('Project updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  },

  deleteProject: async (projectId: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Deleting project:', projectId);
      const response = await api.delete(`/projects/${projectId}`);
      
      // Handle different response types
      const contentType = response.headers?.['content-type'] || '';
      const status = response.status;
      
      if (status === 204 || status === 200) {
        return { success: true, message: 'Project deleted successfully' };
      }
      
      if (contentType.includes('application/json') && response.data) {
        return response.data;
      }
      
      return { success: true, message: 'Project deleted successfully' };
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  },

  getProjectsByUserId: async (userId: string): Promise<Project[]> => {
    try {
      console.log('Fetching projects for user ID:', userId);
      const response = await api.get<Project[]>(`/project-members/user/${userId}/projects`);
      return response.data;
    } catch (error) {
      console.error('Get projects by user ID error:', error);
      throw error;
    }
  },

  // Project member operations
  inviteMemberToProject: async (inviteData: InviteMemberData): Promise<ProjectMember> => {
    try {
      console.log('Inviting member to project:', inviteData);
      const response = await api.post<ProjectMember>('/project-members/invite', inviteData);
      console.log('Member invited successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Invite member to project error:', error);
      throw error;
    }
  },

  addMemberToProject: async (memberData: AddMemberData): Promise<ProjectMember> => {
    try {
      console.log('Adding member to project:', memberData);
      const response = await api.post<ProjectMember>('/project-members', memberData);
      console.log('Member added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Add member to project error:', error);
      throw error;
    }
  },

  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    try {
      console.log('Fetching members for project:', projectId);
      const response = await api.get<ProjectMember[]>(`/project-members?projectId=${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Get project members error:', error);
      throw error;
    }
  },

  getOrganizationMembers: async (organizationId: string): Promise<OrganizationMember[]> => {
    try {
      console.log('Fetching organization members:', organizationId);
      const response = await api.get<OrganizationMember[]>(`/organization-members?organizationId=${organizationId}`);
      return response.data;
    } catch (error) {
      console.error('Get organization members error:', error);
      throw error;
    }
  },

  getProjectMembersByWorkspace: async (workspaceId: string): Promise<ProjectMember[]> => {
    try {
      console.log('Fetching project members for workspace:', workspaceId);
      const response = await api.get<ProjectMember[]>(`/project-members/workspace/${workspaceId}`);
      return response.data;
    } catch (error) {
      console.error('Get project members by workspace error:', error);
      throw error;
    }
  },

  updateProjectMemberRole: async (
    memberId: string,
    requestUserId: string,
    role: string
  ): Promise<ProjectMember> => {
    try {
      console.log('Updating project member role:', { memberId, requestUserId, role });
      const response = await api.patch<ProjectMember>(
        `/project-members/${memberId}?requestUserId=${requestUserId}`,
        { role }
      );
      console.log('Member role updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update project member role error:', error);
      throw error;
    }
  },

  removeProjectMember: async (
    memberId: string,
    requestUserId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Removing project member:', { memberId, requestUserId });
      const response = await api.delete(`/project-members/${memberId}?requestUserId=${requestUserId}`);
      
      // Handle different response types
      const contentType = response.headers?.['content-type'] || '';
      const status = response.status;
      
      if (status === 204 || status === 200) {
        return { success: true, message: 'Project member removed successfully' };
      }
      
      if (contentType.includes('application/json') && response.data) {
        return response.data;
      }
      
      return { success: true, message: 'Project member removed successfully' };
    } catch (error) {
      console.error('Remove project member error:', error);
      throw error;
    }
  },

  getProjectStats: async (projectId: string): Promise<ProjectStats> => {
    try {
      console.log('Fetching project stats:', projectId);
      const response = await api.get<ProjectStats>(`/project-members/project/${projectId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Get project stats error:', error);
      throw error;
    }
  }
};
