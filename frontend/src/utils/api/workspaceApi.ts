import api from "@/lib/api";

export type WorkspaceRole = "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface WorkspaceData {
  name: string;
  description?: string;
  color?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    projects: number;
    tasks: number;
  };
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AddMemberToWorkspaceData {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export interface InviteMemberToWorkspaceData {
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export interface UpdateMemberRoleData {
  role: WorkspaceRole;
}

export interface WorkspaceStats {
  totalMembers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  activeProjects: number;
  completionRate: number;
}

export interface CreateWorkspaceData extends WorkspaceData {
  organizationId: string;
  slug?: string;
}
export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  type:string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface WorkspaceActivityResponse {
  activities: ActivityLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GetWorkspaceActivityParams {
  limit?: number;
  page?: number;
  entityType?:string;
}
export const workspaceApi = {
  // Workspace CRUD operations
  createWorkspace: async (
    workspaceData: CreateWorkspaceData
  ): Promise<Workspace> => {
    try {
      console.log("Creating workspace with data:", workspaceData);

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
      console.log("Workspace created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create workspace error:", error);
      throw error;
    }
  },

  getWorkspaces: async (): Promise<Workspace[]> => {
    try {
      console.log("Fetching all workspaces");
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

      console.log("Fetching workspaces for organization:", organizationId);
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
      console.log("Fetching workspace by ID:", workspaceId);
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
      console.log("Fetching workspace by slug:", { slug, organizationId });
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
      console.log(
        "Updating workspace:",
        workspaceId,
        "with data:",
        workspaceData
      );
      const response = await api.patch<Workspace>(
        `/workspaces/${workspaceId}`,
        workspaceData
      );
      console.log("Workspace updated successfully:", response.data);
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
      console.log("Deleting workspace:", workspaceId);
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
      console.log("Fetching members for workspace:", workspaceId);
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
      console.log("Adding member to workspace:", memberData);
      const response = await api.post<WorkspaceMember>(
        "/workspace-members",
        memberData
      );
      console.log("Member added to workspace successfully:", response.data);
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
      console.log("Inviting member to workspace:", inviteData);
      const response = await api.post("/workspace-members/invite", inviteData);
      console.log("Member invited to workspace successfully:", response.data);
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
      console.log("Updating member role:", {
        memberId,
        updateData,
        requestUserId,
      });
      const response = await api.patch<WorkspaceMember>(
        `/workspace-members/${memberId}?requestUserId=${requestUserId}`,
        updateData
      );
      console.log("Member role updated successfully:", response.data);
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
      console.log("Removing member from workspace:", {
        memberId,
        requestUserId,
      });
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
      console.log("Fetching workspace stats:", workspaceId);
      const response = await api.get<WorkspaceStats>(
        `/workspace-members/workspace/${workspaceId}/stats`
      );
      console.log("Workspace stats fetched successfully:", response.data);
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
      console.log("Fetching workspace recent activity:", workspaceId);
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      throw new Error(`Invalid organizationId format: ${organizationId}. Expected UUID format.`);
    }

    console.log('Searching workspaces:', { organizationId, search });
    
    // URL encode the search parameter to handle spaces and special characters
    const encodedSearch = encodeURIComponent(search.trim());
    const response = await api.get<Workspace[]>(
      `/workspaces/search?organizationId=${organizationId}&search=${encodedSearch}`
    );
    
    console.log('Search results:', response.data);
    return response.data;
  } catch (error) {
    console.error('Search workspaces error:', error);
    throw error;
  }
}

};


