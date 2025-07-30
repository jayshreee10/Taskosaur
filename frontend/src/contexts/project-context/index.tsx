"use client";
import React, { createContext, useContext } from "react";
import { authFetch } from '../../utils/authFetch';

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000');

interface ProjectSettings {
  methodology: string;
  defaultTaskType: string;
  enableTimeTracking: boolean;
  allowSubtasks: boolean;
  workflowId: string;
}

interface ProjectData {
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

interface InviteMemberData {
  email: string;
  projectId: string;
  role: string;
}

interface AddMemberData {
  userId: string;
  projectId: string;
  role: string;
}

interface OrganizationMember {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

interface ProjectContextType {
  listProjects: (token: string) => Promise<any>;
  createProject: (projectData: ProjectData) => Promise<any>;
  getProjectById: (projectId: string, token: string) => Promise<any>;
  getProjectsByWorkspace: (workspaceId: string) => Promise<any>;
  updateProject: (
    projectId: string,
    projectData: ProjectData,
    token: string
  ) => Promise<any>;
  deleteProject: (projectId: string, token: string) => Promise<any>;
  inviteMemberToProject: (
    inviteData: InviteMemberData
  ) => Promise<any>;
  addMemberToProject: (
    memberData: AddMemberData
  ) => Promise<any>;
  getProjectMembers: (
    projectId: string
  ) => Promise<any>;
  getOrganizationMembers: (
    organizationId: string
  ) => Promise<any>;
  getProjectMembersByWorkspace: (
    workspaceId: string,
    token: string
  ) => Promise<any>;
  getProjectsByUserId: (
    userId: string,
    token: string
  ) => Promise<any>;
  updateProjectMemberRole: (
    memberId: string,
    requestUserId: string,
    role: string
  ) => Promise<any>;
  removeProjectMember: (
    memberId: string,
    requestUserId: string
  ) => Promise<any>;
  getProjectStats: (
    projectId: string,
    token: string
  ) => Promise<any>;
}

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);

function ProjectProvider({ children }: { children: React.ReactNode }) {
  const listProjects = async (token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/projects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get projects");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get projects error:", error);
      throw error;
    }
  };

  const createProject = async (projectData: ProjectData) => {
    try {
      const response = await authFetch(`${BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Create project error:", error);
      throw error;
    }
  };

  const getProjectById = async (projectId: string, token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/projects/${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get project by ID");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get project by ID error:", error);
      throw error;
    }
  };

  const getProjectsByWorkspace = async (workspaceId: string) => {
    try {
      const response = await authFetch(
        `${BASE_URL}/projects?workspaceId=${workspaceId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get projects by workspace");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get projects by workspace error:", error);
      throw error;
    }
  };

  const updateProject = async (
    projectId: string,
    projectData: ProjectData,
    token: string
  ) => {
    try {
      const response = await fetch(`${BASE_URL}/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Update project error:", error);
      throw error;
    }
  };

 const deleteProject = async (projectId: string, token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete project");
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    if (contentLength === '0' || response.status === 204) {
      return { success: true, message: 'Project deleted successfully' };
    }

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    } else {
      return { success: true, message: 'Project deleted successfully' };
    }
  } catch (error) {
    console.error("Delete project error:", error);
    throw error;
  }
};

  const inviteMemberToProject = async (
    inviteData: InviteMemberData
  ) => {
    try {
      const response = await authFetch(`${BASE_URL}/project-members/invite`, {
        method: "POST",
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        throw new Error("Failed to invite member to project");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Invite member to project error:", error);
      throw error;
    }
  };

  const addMemberToProject = async (
    memberData: AddMemberData
  ) => {
    try {
      const response = await authFetch(`${BASE_URL}/project-members`, {
        method: "POST",
        body: JSON.stringify(memberData),
      });

      if (!response.ok) {
        throw new Error("Failed to add member to project");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Add member to project error:", error);
      throw error;
    }
  };

  const getProjectMembers = async (
    projectId: string
  ) => {
    try {
      const response = await authFetch(
        `${BASE_URL}/project-members?projectId=${projectId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get project members");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get project members error:", error);
      throw error;
    }
  };

  const getOrganizationMembers = async (
    organizationId: string
  ) => {
    try {
      const response = await authFetch(
        `${BASE_URL}/organization-members?organizationId=${organizationId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get organization members");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get organization members error:", error);
      throw error;
    }
  };

  const getProjectMembersByWorkspace = async (
    workspaceId: string,
    token: string
  ) => {
    try {
      const response = await fetch(
        `${BASE_URL}/project-members/workspace/${workspaceId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get project members by workspace");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get project members by workspace error:", error);
      throw error;
    }
  };

  const getProjectsByUserId = async (
    userId: string,
    token: string
  ) => {
    try {
      const response = await fetch(
        `${BASE_URL}/project-members/user/${userId}/projects`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get projects by user ID");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get projects by user ID error:", error);
      throw error;
    }
  };

  const updateProjectMemberRole = async (
    memberId: string,
    requestUserId: string,
    role: string
  ) => {
    try {
      const response = await authFetch(
        `${BASE_URL}/project-members/${memberId}?requestUserId=${requestUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update project member role");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Update project member role error:", error);
      throw error;
    }
  };

  const removeProjectMember = async (
    memberId: string,
    requestUserId: string
  ) => {
    try {
      const response = await authFetch(
        `${BASE_URL}/project-members/${memberId}?requestUserId=${requestUserId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove project member");
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      if (contentLength === '0' || response.status === 204) {
        return { success: true, message: 'Project member removed successfully' };
      }

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        return { success: true, message: 'Project member removed successfully' };
      }
    } catch (error) {
      console.error("Remove project member error:", error);
      throw error;
    }
  };

  const getProjectStats = async (
    projectId: string,
    token: string
  ) => {
    try {
      const response = await fetch(
        `${BASE_URL}/project-members/project/${projectId}/stats`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get project stats");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get project stats error:", error);
      throw error;
    }
  };

  const value: ProjectContextType = {
    listProjects,
    createProject,
    getProjectById,
    getProjectsByWorkspace,
    updateProject,
    deleteProject,
    inviteMemberToProject,
    addMemberToProject,
    getProjectMembers,
    getOrganizationMembers,
    getProjectMembersByWorkspace,
    getProjectsByUserId,
    updateProjectMemberRole,
    removeProjectMember,
    getProjectStats,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export default ProjectProvider;