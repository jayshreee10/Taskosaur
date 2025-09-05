import api from "@/lib/api";
import {
  AddMemberToWorkspaceData,
  CreateWorkspaceData,
  GetWorkspaceActivityParams,
  InviteMemberToWorkspaceData,
  UpdateMemberRoleData,
  Workspace,
  WorkspaceActivityResponse,
  WorkspaceData,
  WorkspaceMember,
  WorkspaceStats,
} from "@/types";

export const workspaceApi = {
  // Workspace CRUD operations
  createWorkspace: async (
    workspaceData: CreateWorkspaceData
  ): Promise<Workspace> => {
    try {
      // Generate slug if not provided
      const finalWorkspaceData = {
        ...workspaceData,
        slug:
          workspaceData.slug ||
          workspaceData.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-") // Replace multiple hyphens with single
            .trim(),
      };

      const response = await api.post<Workspace>(
        "/workspaces",
        finalWorkspaceData
      );
      return response.data;
    } catch (error) {
      console.error("Create workspace error:", error);
      throw error;
    }
  },

  getWorkspaces: async (): Promise<Workspace[]> => {
    try {
      const response = await api.get<Workspace[]>("/workspaces");
      return response.data;
    } catch (error) {
      console.error("Get workspaces error:", error);
      throw error;
    }
  },

  getWorkspacesByOrganization: async (
    organizationId: string
  ): Promise<Workspace[]> => {
    try {
      // Validate organizationId format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      const response = await api.get<Workspace[]>(
        `/workspaces?organizationId=${organizationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get workspaces by organization error:", error);
      throw error;
    }
  },

  getWorkspaceById: async (workspaceId: string): Promise<Workspace> => {
    try {
      const response = await api.get<Workspace>(`/workspaces/${workspaceId}`);
      return response.data;
    } catch (error) {
      console.error("Get workspace by ID error:", error);
      throw error;
    }
  },

  getWorkspaceBySlug: async (
    slug: string,
    organizationId: string
  ): Promise<Workspace> => {
    try {
      const response = await api.get<Workspace>(
        `/workspaces/organization/${organizationId}/slug/${slug}`
      );
      return response.data;
    } catch (error) {
      console.error("Get workspace by slug error:", error);
      throw error;
    }
  },

  updateWorkspace: async (
    workspaceId: string,
    workspaceData: Partial<WorkspaceData>
  ): Promise<Workspace> => {
    try {
      const response = await api.patch<Workspace>(
        `/workspaces/${workspaceId}`,
        workspaceData
      );
      return response.data;
    } catch (error) {
      console.error("Update workspace error:", error);
      throw error;
    }
  },

  deleteWorkspace: async (
    workspaceId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/workspaces/${workspaceId}`);

      // Handle different response types
      const contentType = response.headers?.["content-type"] || "";
      const status = response.status;

      if (status === 204 || status === 200) {
        return { success: true, message: "Workspace deleted successfully" };
      }

      if (contentType.includes("application/json") && response.data) {
        return response.data;
      }

      return { success: true, message: "Workspace deleted successfully" };
    } catch (error) {
      console.error("Delete workspace error:", error);
      throw error;
    }
  },

  // Workspace member operations
  getWorkspaceMembers: async (
    workspaceId: string
  ): Promise<WorkspaceMember[]> => {
    try {
      const response = await api.get<WorkspaceMember[]>(
        `/workspace-members?workspaceId=${workspaceId}`
      );
      return response.data || [];
    } catch (error) {
      console.error("Get workspace members error:", error);
      throw error;
    }
  },

  addMemberToWorkspace: async (
    memberData: AddMemberToWorkspaceData
  ): Promise<WorkspaceMember> => {
    try {
      const response = await api.post<WorkspaceMember>(
        "/workspace-members",
        memberData
      );
      return response.data;
    } catch (error) {
      console.error("Add member to workspace error:", error);
      throw error;
    }
  },

  inviteMemberToWorkspace: async (
    inviteData: InviteMemberToWorkspaceData
  ): Promise<any> => {
    try {
      const response = await api.post("/workspace-members/invite", inviteData);
      return response.data;
    } catch (error) {
      console.error("Invite member to workspace error:", error);
      throw error;
    }
  },

  updateMemberRole: async (
    memberId: string,
    updateData: UpdateMemberRoleData,
    requestUserId: string
  ): Promise<WorkspaceMember> => {
    try {
      const response = await api.patch<WorkspaceMember>(
        `/workspace-members/${memberId}?requestUserId=${requestUserId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error("Update member role error:", error);
      throw error;
    }
  },

  removeMemberFromWorkspace: async (
    memberId: string,
    requestUserId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(
        `/workspace-members/${memberId}?requestUserId=${requestUserId}`
      );

      // Handle different response types
      const contentType = response.headers?.["content-type"] || "";
      const status = response.status;

      if (status === 204 || status === 200) {
        return {
          success: true,
          message: "Member removed from workspace successfully",
        };
      }

      if (contentType.includes("application/json") && response.data) {
        return response.data;
      }

      return {
        success: true,
        message: "Member removed from workspace successfully",
      };
    } catch (error) {
      console.error("Remove member from workspace error:", error);
      throw error;
    }
  },

  getWorkspaceStats: async (workspaceId: string): Promise<WorkspaceStats> => {
    try {
      const response = await api.get<WorkspaceStats>(
        `/workspace-members/workspace/${workspaceId}/stats`
      );
      return response.data;
    } catch (error) {
      console.error("Get workspace stats error:", error);
      throw error;
    }
  },

  // Helper function to get current organization from localStorage
  getCurrentOrganization: (): string | null => {
    try {
      if (typeof window === "undefined") return null;

      const orgId = localStorage.getItem("currentOrganizationId");
      return orgId;
    } catch (error) {
      console.error("Error getting current organization:", error);
      return null;
    }
  },

  getWorkspaceRecentActivity: async (
    workspaceId: string,
    params: GetWorkspaceActivityParams = {}
  ): Promise<WorkspaceActivityResponse> => {
    try {
      const response = await api.get<WorkspaceActivityResponse>(
        `/workspaces/recent/${workspaceId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Get workspace recent activity error:", error);
      throw error;
    }
  },

  searchWorkspacesByOrganization: async (
    organizationId: string,
    search: string
  ): Promise<Workspace[]> => {
    try {
      // Validate organizationId format (following your existing pattern)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      // URL encode the search parameter to handle spaces and special characters
      const encodedSearch = encodeURIComponent(search.trim());
      const response = await api.get<Workspace[]>(
        `/workspaces/search?organizationId=${organizationId}&search=${encodedSearch}`
      );

      return response.data;
    } catch (error) {
      console.error("Search workspaces error:", error);
      throw error;
    }
  },

  getProjectStatusDistribution: async (
    organizationId: string,
    workspaceSlug: string
  ): Promise<any> => {
    try {
      const response = await api.get(
        `/workspaces/organization/${organizationId}/workspace/${workspaceSlug}/charts/project-status`
      );
      return response.data;
    } catch (error) {
      console.error("Get project status distribution error:", error);
      throw error;
    }
  },

  getTaskPriorityBreakdown: async (
    organizationId: string,
    workspaceSlug: string
  ): Promise<any> => {
    try {
      const response = await api.get(
        `/workspaces/organization/${organizationId}/workspace/${workspaceSlug}/charts/task-priority`
      );
      return response.data;
    } catch (error) {
      console.error("Get task priority breakdown error:", error);
      throw error;
    }
  },

  getKPIMetrics: async (
    organizationId: string,
    workspaceSlug: string
  ): Promise<any> => {
    try {
      const response = await api.get(
        `/workspaces/organization/${organizationId}/workspace/${workspaceSlug}/charts/kpi-metrics`
      );
      return response.data;
    } catch (error) {
      console.error("Get workspace KPI metrics error:", error);
      throw error;
    }
  },

  getTaskTypeDistribution: async (
    organizationId: string,
    workspaceSlug: string
  ): Promise<any> => {
    try {
      const response = await api.get(
        `/workspaces/organization/${organizationId}/workspace/${workspaceSlug}/charts/task-type`
      );
      return response.data;
    } catch (error) {
      console.error("Get task type distribution error:", error);
      throw error;
    }
  },

  getSprintStatusOverview: async (
    organizationId: string,
    workspaceSlug: string
  ): Promise<any> => {
    try {
      const response = await api.get(
        `/workspaces/organization/${organizationId}/workspace/${workspaceSlug}/charts/sprint-status`
      );
      return response.data;
    } catch (error) {
      console.error("Get sprint status overview error:", error);
      throw error;
    }
  },

  getMonthlyTaskCompletion: async (
    organizationId: string,
    workspaceSlug: string
  ): Promise<any> => {
    try {
      const response = await api.get(
        `/workspaces/organization/${organizationId}/workspace/${workspaceSlug}/charts/monthly-completion`
      );
      return response.data;
    } catch (error) {
      console.error("Get monthly task completion error:", error);
      throw error;
    }
  },

  archiveWorkspace: async (
    workspaceId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.patch(`/workspaces/archive/${workspaceId}`);

      // Handle different response types
      const contentType = response.headers?.["content-type"] || "";
      const status = response.status;

      if (status === 204 || status === 200) {
        return { success: true, message: "Workspace archived successfully" };
      }

      if (contentType.includes("application/json") && response.data) {
        return response.data;
      }

      return { success: true, message: "Workspace archived successfully" };
    } catch (error) {
      console.error("Archive workspace error:", error);
      throw error;
    }
  },
};
