import api from "@/lib/api";
import { Workflow } from "./organizationApi";

export type WorkflowStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface WorkflowData {
  name: string;
  description?: string;
  isDefault?: boolean;
}



export interface CreateWorkflowData extends WorkflowData {
  organizationId: string;
}

export interface UpdateWorkflowData extends Partial<WorkflowData> {}

export interface WorkflowStats {
  totalStages: number;
  totalProjects: number;
  totalTasks: number;
  activeProjects: number;
  completedTasks: number;
  utilizationRate: number;
}

export interface WorkflowStage {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  workflowId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowActivityResponse {
  activities: ActivityLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GetWorkflowActivityParams {
  limit?: number;
  page?: number;
  entityType?: string;
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
  type: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export const workflowsApi = {
  // Workflow CRUD operations
  createWorkflow: async (workflowData: CreateWorkflowData): Promise<Workflow> => {
    try {
      console.log("Creating workflow with data:", workflowData);
      const response = await api.post<Workflow>("/workflows", workflowData);
      console.log("Workflow created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create workflow error:", error);
      throw error;
    }
  },

  getWorkflows: async (): Promise<Workflow[]> => {
    try {
      console.log("Fetching all workflows");
      const response = await api.get<Workflow[]>("/workflows");
      return response.data;
    } catch (error) {
      console.error("Get workflows error:", error);
      throw error;
    }
  },

  getWorkflowsByOrganization: async (
    organizationId: string
  ): Promise<Workflow[]> => {
    try {
      // Validate organizationId format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      console.log("Fetching workflows for organization:", organizationId);
      const response = await api.get<Workflow[]>(
        `/workflows?organizationId=${organizationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get workflows by organization error:", error);
      throw error;
    }
  },

  getWorkflowsByOrganizationSlug: async (slug: string): Promise<Workflow[]> => {
    try {
      console.log("Fetching workflows by organization slug:", slug);
      const response = await api.get<Workflow[]>(`/workflows/slug?slug=${slug}`);
      return response.data;
    } catch (error) {
      console.error("Get workflows by organization slug error:", error);
      throw error;
    }
  },

  getWorkflowById: async (workflowId: string): Promise<Workflow> => {
    try {
      console.log("Fetching workflow by ID:", workflowId);
      const response = await api.get<Workflow>(`/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error("Get workflow by ID error:", error);
      throw error;
    }
  },

  getDefaultWorkflow: async (organizationId: string): Promise<Workflow> => {
    try {
      // Validate organizationId format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      console.log("Fetching default workflow for organization:", organizationId);
      const response = await api.get<Workflow>(
        `/workflows/organization/${organizationId}/default`
      );
      return response.data;
    } catch (error) {
      console.error("Get default workflow error:", error);
      throw error;
    }
  },

  updateWorkflow: async (
    workflowId: string,
    workflowData: UpdateWorkflowData
  ): Promise<Workflow> => {
    try {
      console.log("Updating workflow:", workflowId, "with data:", workflowData);
      const response = await api.patch<Workflow>(
        `/workflows/${workflowId}`,
        workflowData
      );
      console.log("Workflow updated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Update workflow error:", error);
      throw error;
    }
  },

  deleteWorkflow: async (
    workflowId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Deleting workflow:", workflowId);
      const response = await api.delete(`/workflows/${workflowId}`);

      // Handle different response types
      const contentType = response.headers?.["content-type"] || "";
      const status = response.status;

      if (status === 204 || status === 200) {
        return { success: true, message: "Workflow deleted successfully" };
      }

      if (contentType.includes("application/json") && response.data) {
        return response.data;
      }

      return { success: true, message: "Workflow deleted successfully" };
    } catch (error) {
      console.error("Delete workflow error:", error);
      throw error;
    }
  },

  // Workflow stages operations
  getWorkflowStages: async (workflowId: string): Promise<WorkflowStage[]> => {
    try {
      console.log("Fetching stages for workflow:", workflowId);
      const response = await api.get<WorkflowStage[]>(
        `/workflows/${workflowId}/stages`
      );
      return response.data || [];
    } catch (error) {
      console.error("Get workflow stages error:", error);
      throw error;
    }
  },

  // Workflow stats
  getWorkflowStats: async (workflowId: string): Promise<WorkflowStats> => {
    try {
      console.log("Fetching workflow stats:", workflowId);
      const response = await api.get<WorkflowStats>(
        `/workflows/${workflowId}/stats`
      );
      console.log("Workflow stats fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get workflow stats error:", error);
      throw error;
    }
  },

  // Workflow activity
  getWorkflowActivity: async (
    workflowId: string,
    params: GetWorkflowActivityParams = {}
  ): Promise<WorkflowActivityResponse> => {
    try {
      console.log("Fetching workflow activity:", workflowId);
      const response = await api.get<WorkflowActivityResponse>(
        `/workflows/${workflowId}/activity`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Get workflow activity error:", error);
      throw error;
    }
  },

  // Search workflows
  searchWorkflowsByOrganization: async (
    organizationId: string,
    search: string
  ): Promise<Workflow[]> => {
    try {
      // Validate organizationId format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      console.log("Searching workflows:", { organizationId, search });

      // URL encode the search parameter to handle spaces and special characters
      const encodedSearch = encodeURIComponent(search.trim());
      const response = await api.get<Workflow[]>(
        `/workflows/search?organizationId=${organizationId}&search=${encodedSearch}`
      );

      console.log("Search results:", response.data);
      return response.data;
    } catch (error) {
      console.error("Search workflows error:", error);
      throw error;
    }
  },

  // Helper functions
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

  // Workflow status operations
  activateWorkflow: async (workflowId: string): Promise<Workflow> => {
    try {
      console.log("Activating workflow:", workflowId);
      const response = await api.patch<Workflow>(
        `/workflows/${workflowId}/activate`
      );
      console.log("Workflow activated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Activate workflow error:", error);
      throw error;
    }
  },

  deactivateWorkflow: async (workflowId: string): Promise<Workflow> => {
    try {
      console.log("Deactivating workflow:", workflowId);
      const response = await api.patch<Workflow>(
        `/workflows/${workflowId}/deactivate`
      );
      console.log("Workflow deactivated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Deactivate workflow error:", error);
      throw error;
    }
  },

  archiveWorkflow: async (workflowId: string): Promise<Workflow> => {
    try {
      console.log("Archiving workflow:", workflowId);
      const response = await api.patch<Workflow>(
        `/workflows/${workflowId}/archive`
      );
      console.log("Workflow archived successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Archive workflow error:", error);
      throw error;
    }
  },

  // Set as default workflow
  setAsDefaultWorkflow: async (workflowId: string): Promise<Workflow> => {
    try {
      console.log("Setting workflow as default:", workflowId);
      const response = await api.patch<Workflow>(
        `/workflows/${workflowId}/set-default`
      );
      console.log("Workflow set as default successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Set default workflow error:", error);
      throw error;
    }
  },
};
