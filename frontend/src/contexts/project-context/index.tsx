"use client";

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useMemo, 
  useCallback 
} from 'react';
import { 
  projectApi, 
  Project, 
  ProjectData, 
  ProjectMember,
  InviteMemberData,
  AddMemberData,
  OrganizationMember,
  ProjectStats
} from '@/utils/api/projectApi';
import { 
  getCurrentOrganizationId, 
  getCurrentWorkspaceId 
} from '@/utils/hierarchyContext';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  projectMembers: ProjectMember[];
  organizationMembers: OrganizationMember[];
  projectStats: ProjectStats | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectContextType extends ProjectState {
  // Project methods
  listProjects: () => Promise<Project[]>;
  createProject: (projectData: ProjectData) => Promise<Project>;
  getProjectById: (projectId: string) => Promise<Project>;
  getProjectsByWorkspace: (workspaceId: string) => Promise<Project[]>;
  updateProject: (projectId: string, projectData: Partial<ProjectData>) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<{ success: boolean; message: string }>;
  getProjectsByUserId: (userId: string) => Promise<Project[]>;
  
  // Project member methods
  inviteMemberToProject: (inviteData: InviteMemberData) => Promise<ProjectMember>;
  addMemberToProject: (memberData: AddMemberData) => Promise<ProjectMember>;
  getProjectMembers: (projectId: string) => Promise<ProjectMember[]>;
  getOrganizationMembers: (organizationId: string) => Promise<OrganizationMember[]>;
  getProjectMembersByWorkspace: (workspaceId: string) => Promise<ProjectMember[]>;
  updateProjectMemberRole: (memberId: string, requestUserId: string, role: string) => Promise<ProjectMember>;
  removeProjectMember: (memberId: string, requestUserId: string) => Promise<{ success: boolean; message: string }>;
  
  // Stats and utility methods
  getProjectStats: (projectId: string) => Promise<ProjectStats>;
  
  // State management
  setCurrentProject: (project: Project | null) => void;
  refreshProjects: (workspaceId?: string) => Promise<void>;
  refreshProjectMembers: (projectId: string) => Promise<void>;
  clearError: () => void;
  
  // Helper methods
  isUserProjectMember: (projectId: string, userId: string) => boolean;
  getProjectMemberRole: (projectId: string, userId: string) => string | null;

  // Enhanced methods with automatic hierarchy context
  getCurrentWorkspaceProjects: () => Promise<Project[]>; // Uses current workspace
  getCurrentOrganizationMembers: () => Promise<OrganizationMember[]>; // Uses current organization
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

// For backward compatibility
export const useProjectContext = useProject;

interface ProjectProviderProps {
  children: React.ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projectState, setProjectState] = useState<ProjectState>({
    projects: [],
    currentProject: null,
    projectMembers: [],
    organizationMembers: [],
    projectStats: null,
    isLoading: false,
    error: null
  });

  // Helper to handle API operations with error handling
  const handleApiOperation = useCallback(async function<T>(
    operation: () => Promise<T>,
    loadingState: boolean = true
  ): Promise<T> {
    try {
      if (loadingState) {
        setProjectState(prev => ({ ...prev, isLoading: true, error: null }));
      }
      
      const result = await operation();
      
      if (loadingState) {
        setProjectState(prev => ({ ...prev, isLoading: false }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setProjectState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  // Memoized context value
  const contextValue = useMemo(() => ({
    ...projectState,

    // Project methods with state management
    listProjects: async (): Promise<Project[]> => {
      const result = await handleApiOperation(() => projectApi.listProjects());
      
      setProjectState(prev => ({ 
        ...prev, 
        projects: result 
      }));
      
      return result;
    },

    createProject: async (projectData: ProjectData): Promise<Project> => {
      const result = await handleApiOperation(() => projectApi.createProject(projectData));
      
      // Add new project to state
      setProjectState(prev => ({ 
        ...prev, 
        projects: [...prev.projects, result] 
      }));
      
      return result;
    },

    getProjectById: async (projectId: string): Promise<Project> => {
      const result = await handleApiOperation(() => projectApi.getProjectById(projectId), false);
      
      // Update current project if it's the same ID
      setProjectState(prev => ({
        ...prev,
        currentProject: prev.currentProject?.id === projectId ? result : prev.currentProject
      }));
      
      return result;
    },

    getProjectsByWorkspace: async (workspaceId: string): Promise<Project[]> => {
      const result = await handleApiOperation(() => projectApi.getProjectsByWorkspace(workspaceId));
      
      setProjectState(prev => ({ 
        ...prev, 
        projects: result 
      }));
      
      return result;
    },

    updateProject: async (projectId: string, projectData: Partial<ProjectData>): Promise<Project> => {
      const result = await handleApiOperation(() => projectApi.updateProject(projectId, projectData), false);
      
      // Update project in state
      setProjectState(prev => ({
        ...prev,
        projects: prev.projects.map(project => 
          project.id === projectId ? { ...project, ...result } : project
        ),
        currentProject: prev.currentProject?.id === projectId 
          ? { ...prev.currentProject, ...result }
          : prev.currentProject
      }));
      
      return result;
    },

    deleteProject: async (projectId: string): Promise<{ success: boolean; message: string }> => {
      const result = await handleApiOperation(() => projectApi.deleteProject(projectId), false);
      
      // Remove project from state
      setProjectState(prev => ({
        ...prev,
        projects: prev.projects.filter(project => project.id !== projectId),
        currentProject: prev.currentProject?.id === projectId ? null : prev.currentProject
      }));
      
      return result;
    },

    getProjectsByUserId: (userId: string): Promise<Project[]> => 
      handleApiOperation(() => projectApi.getProjectsByUserId(userId), false),

    // Project member methods
    inviteMemberToProject: async (inviteData: InviteMemberData): Promise<ProjectMember> => {
      const result = await handleApiOperation(() => projectApi.inviteMemberToProject(inviteData), false);
      
      // Add new member to state if it's for the current project's members
      if (projectState.projectMembers.length > 0 && 
          projectState.projectMembers.some(m => m.projectId === inviteData.projectId)) {
        setProjectState(prev => ({
          ...prev,
          projectMembers: [...prev.projectMembers, result]
        }));
      }
      
      return result;
    },

    addMemberToProject: async (memberData: AddMemberData): Promise<ProjectMember> => {
      const result = await handleApiOperation(() => projectApi.addMemberToProject(memberData), false);
      
      // Add new member to state if it's for the current project's members
      if (projectState.projectMembers.length > 0 && 
          projectState.projectMembers.some(m => m.projectId === memberData.projectId)) {
        setProjectState(prev => ({
          ...prev,
          projectMembers: [...prev.projectMembers, result]
        }));
      }
      
      return result;
    },

    getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
      const result = await handleApiOperation(() => projectApi.getProjectMembers(projectId), false);
      
      setProjectState(prev => ({ 
        ...prev, 
        projectMembers: result 
      }));
      
      return result;
    },

    getOrganizationMembers: async (organizationId: string): Promise<OrganizationMember[]> => {
      const result = await handleApiOperation(() => projectApi.getOrganizationMembers(organizationId), false);
      
      setProjectState(prev => ({ 
        ...prev, 
        organizationMembers: result 
      }));
      
      return result;
    },

    getProjectMembersByWorkspace: (workspaceId: string): Promise<ProjectMember[]> => 
      handleApiOperation(() => projectApi.getProjectMembersByWorkspace(workspaceId), false),

    updateProjectMemberRole: async (memberId: string, requestUserId: string, role: string): Promise<ProjectMember> => {
      const result = await handleApiOperation(() => projectApi.updateProjectMemberRole(memberId, requestUserId, role), false);
      
      // Update member in state
      setProjectState(prev => ({
        ...prev,
        projectMembers: prev.projectMembers.map(member => 
          member.id === memberId ? { ...member, ...result } : member
        )
      }));
      
      return result;
    },

    removeProjectMember: async (memberId: string, requestUserId: string): Promise<{ success: boolean; message: string }> => {
      const result = await handleApiOperation(() => projectApi.removeProjectMember(memberId, requestUserId), false);
      
      // Remove member from state
      setProjectState(prev => ({
        ...prev,
        projectMembers: prev.projectMembers.filter(member => member.id !== memberId)
      }));
      
      return result;
    },

    // Stats and utility methods
    getProjectStats: async (projectId: string): Promise<ProjectStats> => {
      const result = await handleApiOperation(() => projectApi.getProjectStats(projectId), false);
      
      setProjectState(prev => ({ 
        ...prev, 
        projectStats: result 
      }));
      
      return result;
    },

    // State management methods
    setCurrentProject: (project: Project | null): void => {
      setProjectState(prev => ({ ...prev, currentProject: project }));
    },

    refreshProjects: async (workspaceId?: string): Promise<void> => {
      if (workspaceId) {
        await contextValue.getProjectsByWorkspace(workspaceId);
      } else {
        await contextValue.listProjects();
      }
    },

    refreshProjectMembers: async (projectId: string): Promise<void> => {
      await contextValue.getProjectMembers(projectId);
    },

    clearError: (): void => {
      setProjectState(prev => ({ ...prev, error: null }));
    },

    // Helper methods
    isUserProjectMember: (projectId: string, userId: string): boolean => {
      return projectState.projectMembers.some(member => 
        member.projectId === projectId && member.userId === userId
      );
    },

    getProjectMemberRole: (projectId: string, userId: string): string | null => {
      const member = projectState.projectMembers.find(member => 
        member.projectId === projectId && member.userId === userId
      );
      return member?.role || null;
    },

    // Enhanced methods with automatic hierarchy context
    getCurrentWorkspaceProjects: async (): Promise<Project[]> => {
      const workspaceId = getCurrentWorkspaceId();
      if (!workspaceId) {
        throw new Error("No workspace selected. Please select a workspace first.");
      }
      return await contextValue.getProjectsByWorkspace(workspaceId);
    },

    getCurrentOrganizationMembers: async (): Promise<OrganizationMember[]> => {
      const organizationId = getCurrentOrganizationId();
      if (!organizationId) {
        throw new Error("No organization selected. Please select an organization first.");
      }
      return await contextValue.getOrganizationMembers(organizationId);
    },

  }), [projectState, handleApiOperation]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export default ProjectProvider;
