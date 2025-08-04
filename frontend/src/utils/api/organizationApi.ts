import api from "@/lib/api";
import { authApi } from "./authApi";

export interface OrganizationSettings {
  allowInvites: boolean;
  requireEmailVerification: boolean;
  defaultRole: string;
  features: {
    timeTracking: boolean;
    customFields: boolean;
    automation: boolean;
    integrations: boolean;
  };
}

export interface CreateOrganizationData {
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  settings?: OrganizationSettings;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  ownerId: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
  avatar: string;
  _count: {
    members: number;
    workspaces: number;
  };
  userRole: OrganizationRole;
  joinedAt?: string;
  isOwner?: boolean;
}
export enum OrganizationRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
  OWNER = "OWNER",
}
export interface OrganizationResponse {
  organizations?: Organization[];
  data?: Organization[];
  organization?: Organization | Organization[];
}
export interface OrganizationStats {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  statistics: {
    totalTasks: number;
    openTasks: number;
    completedTasks: number;
    activeProjects: number;
    totalActiveWorkspaces: number;
  };
  recentActivities: RecentActivity[];
}
export interface RecentActivity {
  id: string;
  type:
    | "TASK_CREATED"
    | "TASK_COMPLETED"
    | "TASK_UPDATED"
    | "PROJECT_CREATED"
    | "MEMBER_ADDED"
    | "WORKSPACE_CREATED";
  description: string;
  entityType: "Task" | "Project" | "Workspace" | "Member";
  entityId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface ActivityFilters {
  limit?: number;
  page?: number;
  entityType?: "Task" | "Project" | "Workspace" | "Organization" | "User";
  userId?: string;
}

export interface ActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityResponse {
  activities: ActivityItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
export interface OrganizationMember {
  id: string;
  role: OrganizationRole;
  joinedAt: Date;
  userId: string;
  organizationId: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  // other fields ...
}
export interface WorkflowStatus {
  id: string;
  name: string;
  color?: string ;
  position?: number | null;
  category?: string;
  isDefault?: boolean;
  workflowId?: string;
  createdAt?:string,
  updatedAt?:string
}

export interface WorkflowTransition {
  id: string;
  name: string;
  fromStatusId: string;
  toStatusId: string;
}

export interface Workflow {
  id: string;
  name: string;
  organizationId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;

  organization?: Organization;

  statuses?: WorkflowStatus[];

  transitions?: WorkflowTransition[];
  createdBy?: User;
  updatedBy?: User;
  description?: string; // <-- add this line

  _count?: {
    statuses: number;
    transitions: number;
  };
}
export const organizationApi = {
  getOrganizationsByUser: async (userId: string): Promise<Organization[]> => {
    try {
      const response = await api.get<OrganizationResponse>(
        `/organization-members/user/${userId}/organizations`
      );

      // Handle different response structures
      let organizationsArray: Organization[] = [];

      if (Array.isArray(response.data)) {
        organizationsArray = response.data;
      } else if (response.data && Array.isArray(response.data.organizations)) {
        organizationsArray = response.data.organizations;
      } else if (response.data && Array.isArray(response.data.data)) {
        organizationsArray = response.data.data;
      } else if (response.data && response.data.organization) {
        organizationsArray = Array.isArray(response.data.organization)
          ? response.data.organization
          : [response.data.organization];
      } else {
        organizationsArray = [];
      }

      return organizationsArray;
    } catch (error) {
      console.error("Get organizations by user error:", error);
      throw error;
    }
  },

  createOrganization: async (
    organizationData: CreateOrganizationData
  ): Promise<Organization> => {
    try {
      const currentUser = authApi.getCurrentUser();

      if (!currentUser?.id) {
        throw new Error("User not authenticated or user ID not found");
      }

      console.log("Creating organization with data:", organizationData);

      // Generate slug from name if not provided
      const slug =
        organizationData.slug ||
        organizationData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "-") // Replace spaces with hyphens
          .replace(/-+/g, "-") // Replace multiple hyphens with single
          .trim();

      // Default settings if not provided
      const defaultSettings: OrganizationSettings = {
        allowInvites: true,
        requireEmailVerification: false,
        defaultRole: "MEMBER",
        features: {
          timeTracking: true,
          customFields: true,
          automation: true,
          integrations: true,
        },
      };

      const finalOrganizationData = {
        name: organizationData.name.trim(),
        slug: slug,
        description: organizationData.description?.trim() || "",
        website: organizationData.website?.trim() || "",
        ownerId: currentUser.id,
        settings: organizationData.settings || defaultSettings,
      };

      console.log("Final organization data:", finalOrganizationData);

      const response = await api.post<Organization>(
        "/organizations",
        finalOrganizationData
      );

      console.log("Organization created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create organization error:", error);
      throw error;
    }
  },

  getOrganizationById: async (
    organizationId: string
  ): Promise<Organization> => {
    try {
      const response = await api.get<Organization>(
        `/organizations/${organizationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get organization by ID error:", error);
      throw error;
    }
  },
  getOrganizationBySlug: async (slug: string): Promise<Organization> => {
    try {
      const response = await api.get<Organization>(
        `/organizations/slug/${slug}`
      );
      return response.data;
    } catch (error) {
      console.error("Get organization by slug error:", error);
      throw error;
    }
  },
  getOrganizationMembers: async (
    slug: string
  ): Promise<OrganizationMember[]> => {
    try {
      const response = await api.get<OrganizationMember[]>(
        `/organization-members/slug?slug=${encodeURIComponent(slug)}`
      );
      return response.data;
    } catch (error) {
      console.error("Get organization members by slug error:", error);
      throw error;
    }
  },
   getOrganizationWorkFlows: async (
    slug: string
  ): Promise<Workflow[]> => {
    try {
      const response = await api.get<Workflow[]>(
        `/workflows/slug?slug=${encodeURIComponent(slug)}`
      );
      return response.data;
    } catch (error) {
      console.error("Get organization members by slug error:", error);
      throw error;
    }
  },

  updateOrganization: async (
    organizationId: string,
    updateData: Partial<CreateOrganizationData>
  ): Promise<Organization> => {
    try {
      const response = await api.patch<Organization>(
        `/organizations/${organizationId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error("Update organization error:", error);
      throw error;
    }
  },

  deleteOrganization: async (organizationId: string): Promise<void> => {
    try {
      await api.delete(`/organizations/${organizationId}`);
    } catch (error) {
      console.error("Delete organization error:", error);
      throw error;
    }
  },

  // Helper function to get current organization from localStorage
  getCurrentOrganization: (): Organization | null => {
    try {
      if (typeof window === "undefined") return null;

      const currentOrgId = localStorage.getItem("currentOrganizationId");
      if (!currentOrgId) return null;

      // You might want to cache organizations or fetch from API
      // For now, return null and let the component handle the fetch
      return null;
    } catch (error) {
      console.error("Error getting current organization:", error);
      return null;
    }
  },
  getOrganizationStats: async (
    organizationId: string
  ): Promise<OrganizationStats> => {
    try {
      console.log("Fetching organization stats for:", organizationId);

      // Validate organizationId format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      const response = await api.get<OrganizationStats>(
        `/organizations/${organizationId}/stats`
      );
      return response.data;
    } catch (error) {
      console.error("Get organization stats error:", error);
      throw error;
    }
  },

  getOrganizationRecentActivity: async (
    organizationId: string,
    filters: ActivityFilters = {}
  ): Promise<ActivityResponse> => {
    try {
      const params = new URLSearchParams();

      // Add filters as query parameters
      if (filters.limit !== undefined) {
        params.append(
          "limit",
          Math.min(Math.max(1, filters.limit), 50).toString()
        );
      }

      if (filters.page !== undefined) {
        params.append("page", Math.max(1, filters.page).toString());
      }

      if (filters.entityType) {
        params.append("entityType", filters.entityType);
      }

      if (filters.userId) {
        params.append("userId", filters.userId);
      }
      const response = await api.get(
        `/activity-logs/organization/${organizationId}/recent?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error("Failed to fetch organization activity:", error);
      throw error;
    }
  },
};
