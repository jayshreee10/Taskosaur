import api from "@/lib/api";
import {
  AddMemberData,
  InviteMemberData,
  OrganizationMember,
  Project,
  ProjectData,
  ProjectMember,
  ProjectStats,
} from "@/types";

export const projectApi = {
  // Project CRUD operations
  listProjects: async (): Promise<Project[]> => {
    try {
      const response = await api.get<Project[]>("/projects");
      return response.data;
    } catch (error) {
      console.error("List projects error:", error);
      throw error;
    }
  },

  createProject: async (projectData: ProjectData): Promise<Project> => {
    try {
      const response = await api.post<Project>("/projects", projectData);
      return response.data;
    } catch (error) {
      console.error("Create project error:", error);
      throw error;
    }
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    try {
      const response = await api.get<Project>(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error("Get project by ID error:", error);
      throw error;
    }
  },

  getProjectBySlug: async (slug: string): Promise<Project> => {
    try {
      const response = await api.get<Project>(`/projects/by-slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error("Get project by slug error:", error);
      throw error;
    }
  },

  getProjectsByWorkspace: async (workspaceId: string): Promise<Project[]> => {
    try {
      const response = await api.get<Project[]>(
        `/projects?workspaceId=${workspaceId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get projects by workspace error:", error);
      throw error;
    }
  },

  getProjectsByOrganization: async (
    organizationId: string,
    filters?: {
      workspaceId?: string;
      status?: string;
      priority?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<Project[]> => {
    try {
      const params = new URLSearchParams({
        organizationId,
      });
      if (filters?.workspaceId)
        params.append("workspaceId", filters.workspaceId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.pageSize)
        params.append("pageSize", filters.pageSize.toString());

      const response = await api.get<Project[]>(
        `/projects/by-organization?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Get projects by organization error:", error);
      throw error;
    }
  },

  updateProject: async (
    projectId: string,
    projectData: Partial<ProjectData>
  ): Promise<Project> => {
    try {
      const response = await api.patch<Project>(
        `/projects/${projectId}`,
        projectData
      );
      return response.data;
    } catch (error) {
      console.error("Update project error:", error);
      throw error;
    }
  },

  deleteProject: async (
    projectId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/projects/${projectId}`);

      // Handle different response types
      const contentType = response.headers?.["content-type"] || "";
      const status = response.status;

      if (status === 204 || status === 200) {
        return { success: true, message: "Project deleted successfully" };
      }

      if (contentType.includes("application/json") && response.data) {
        return response.data;
      }

      return { success: true, message: "Project deleted successfully" };
    } catch (error) {
      console.error("Delete project error:", error);
      throw error;
    }
  },

  getProjectsByUserId: async (userId: string): Promise<Project[]> => {
    try {
      const response = await api.get<Project[]>(
        `/project-members/user/${userId}/projects`
      );
      return response.data;
    } catch (error) {
      console.error("Get projects by user ID error:", error);
      throw error;
    }
  },

  // Project member operations
  inviteMemberToProject: async (
    inviteData: InviteMemberData
  ): Promise<ProjectMember> => {
    try {
      const response = await api.post<ProjectMember>(
        "/project-members/invite",
        inviteData
      );
      return response.data;
    } catch (error) {
      console.error("Invite member to project error:", error);
      throw error;
    }
  },

  addMemberToProject: async (
    memberData: AddMemberData
  ): Promise<ProjectMember> => {
    try {
      const response = await api.post<ProjectMember>(
        "/project-members",
        memberData
      );
      return response.data;
    } catch (error) {
      console.error("Add member to project error:", error);
      throw error;
    }
  },

  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    try {
      const response = await api.get<ProjectMember[]>(
        `/project-members?projectId=${projectId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get project members error:", error);
      throw error;
    }
  },

  getOrganizationMembers: async (
    organizationId: string
  ): Promise<OrganizationMember[]> => {
    try {
      const response = await api.get<OrganizationMember[]>(
        `/organization-members?organizationId=${organizationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get organization members error:", error);
      throw error;
    }
  },

  getProjectMembersByWorkspace: async (
    workspaceId: string
  ): Promise<ProjectMember[]> => {
    try {
      const response = await api.get<ProjectMember[]>(
        `/project-members/workspace/${workspaceId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get project members by workspace error:", error);
      throw error;
    }
  },

  updateProjectMemberRole: async (
    memberId: string,
    requestUserId: string,
    role: string
  ): Promise<ProjectMember> => {
    try {
      const response = await api.patch<ProjectMember>(
        `/project-members/${memberId}?requestUserId=${requestUserId}`,
        { role }
      );
      return response.data;
    } catch (error) {
      console.error("Update project member role error:", error);
      throw error;
    }
  },

  removeProjectMember: async (
    memberId: string,
    requestUserId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(
        `/project-members/${memberId}?requestUserId=${requestUserId}`
      );

      // Handle different response types
      const contentType = response.headers?.["content-type"] || "";
      const status = response.status;

      if (status === 204 || status === 200) {
        return {
          success: true,
          message: "Project member removed successfully",
        };
      }

      if (contentType.includes("application/json") && response.data) {
        return response.data;
      }

      return { success: true, message: "Project member removed successfully" };
    } catch (error) {
      console.error("Remove project member error:", error);
      throw error;
    }
  },

  getProjectStats: async (projectId: string): Promise<ProjectStats> => {
    try {
      const response = await api.get<ProjectStats>(
        `/project-members/project/${projectId}/stats`
      );
      return response.data;
    } catch (error) {
      console.error("Get project stats error:", error);
      throw error;
    }
  },
  
  getTaskStatusFlow: async (projectSlug: string): Promise<any> => {
    try {
      const response = await api.get(
        `/projects/${projectSlug}/charts/task-status`
      );
      return response.data;
    } catch (error) {
      console.error("Get task status flow error:", error);
      throw error;
    }
  },

  getTaskTypeDistribution: async (projectSlug: string): Promise<any> => {
    try {
      const response = await api.get(
        `/projects/${projectSlug}/charts/task-type`
      );
      return response.data;
    } catch (error) {
      console.error("Get task type distribution error:", error);
      throw error;
    }
  },

  getKPIMetrics: async (projectSlug: string): Promise<any> => {
    try {
      const response = await api.get(
        `/projects/${projectSlug}/charts/kpi-metrics`
      );
      return response.data;
    } catch (error) {
      console.error("Get project KPI metrics error:", error);
      throw error;
    }
  },

  getTaskPriorityDistribution: async (projectSlug: string): Promise<any> => {
    try {
      const response = await api.get(
        `/projects/${projectSlug}/charts/task-priority`
      );
      return response.data;
    } catch (error) {
      console.error("Get task priority distribution error:", error);
      throw error;
    }
  },

  getSprintVelocityTrend: async (projectSlug: string): Promise<any> => {
    try {
      const response = await api.get(
        `/projects/${projectSlug}/charts/sprint-velocity`
      );
      return response.data;
    } catch (error) {
      console.error("Get sprint velocity trend error:", error);
      throw error;
    }
  },

  getSprintBurndown: async (projectSlug: string, sprintId: string): Promise<any> => {
    try {
      const response = await api.get(
        `/projects/${projectSlug}/charts/sprint-burndown/${sprintId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get sprint burndown error:", error);
      throw error;
    }
  },

  archiveProject: async (projectId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.patch(`/projects/archive/${projectId}`);
      
      // Handle different response types
      const contentType = response.headers?.["content-type"] || "";
      const status = response.status;

      if (status === 204 || status === 200) {
        return { success: true, message: "Project archived successfully" };
      }

      if (contentType.includes("application/json") && response.data) {
        return response.data;
      }

      return { success: true, message: "Project archived successfully" };
    } catch (error) {
      console.error("Archive project error:", error);
      throw error;
    }
  },
};
