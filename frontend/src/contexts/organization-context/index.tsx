import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { organizationApi } from "@/utils/api/organizationApi";
import { workflowsApi } from "@/utils/api/workflowsApi";
import { taskStatusApi } from "@/utils/api/taskStatusApi";
import { orgChartsApi } from "@/utils/api"; // Add this import
import {
  Organization,
  CreateOrganizationData,
  OrganizationStats,
  ActivityFilters,
  ActivityResponse,
  OrganizationMember,
  Workflow,
  TaskStatus,
  CreateWorkflowData,
  UpdateWorkflowData,
} from "@/types";

// Add the AnalyticsData interface
interface AnalyticsData {
  kpiMetrics: any;
  projectPortfolio: any[];
  teamUtilization: any[];
  taskDistribution: any[];
  taskType: any[];
  sprintMetrics: any[];
  qualityMetrics: any;
  workspaceProjectCount: any[];
  memberWorkload: any[];
  resourceAllocation: any[];
}

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  // Add analytics state
  analyticsData: AnalyticsData | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  refreshingAnalytics: boolean;
}

interface OrganizationContextType extends OrganizationState {
  // Organization methods
  getUserOrganizations: (userId: string) => Promise<Organization[]>;
  createOrganization: (
    organizationData: CreateOrganizationData
  ) => Promise<Organization>;
  getOrganizationById: (organizationId: string) => Promise<Organization>;
  updateOrganization: (
    organizationId: string,
    updateData: Partial<CreateOrganizationData>
  ) => Promise<Organization>;
  deleteOrganization: (organizationId: string) => Promise<void>;

  // State management
  setCurrentOrganization: (organization: Organization | null) => void;
  refreshOrganizations: (userId: string) => Promise<void>;
  clearError: () => void;

  // Helper methods
  checkOrganizationAndRedirect: () => string;
  isUserInOrganization: (organizationId: string) => boolean;
  getOrganizationStats: (organizationId: string) => Promise<OrganizationStats>;
  getOrganizationRecentActivity: (
    organizationId: string,
    filters: ActivityFilters
  ) => Promise<ActivityResponse>;
  getOrganizationBySlug: (slug: string) => Promise<Organization>;
  getOrganizationMembers: (slug: string) => Promise<OrganizationMember[]>;
  getOrganizationWorkFlows: (slug: string) => Promise<Workflow[]>;
  updateWorkflow: (
    workflowId: string,
    workflowData: UpdateWorkflowData
  ) => Promise<Workflow>;
  createWorkflow: (workflowData: CreateWorkflowData) => Promise<Workflow>;
  updateTaskStatusPositions: (
    statusUpdates: { id: string; position: number }[]
  ) => Promise<TaskStatus[]>;
  
  // Add analytics methods
  fetchAnalyticsData: (organizationId: string) => Promise<void>;
  clearAnalyticsError: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
};

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [organizationState, setOrganizationState] = useState<OrganizationState>(
    {
      organizations: [],
      currentOrganization: null,
      isLoading: false,
      error: null,
      // Initialize analytics state
      analyticsData: null,
      analyticsLoading: false,
      analyticsError: null,
      refreshingAnalytics: false,
    }
  );

  // Initialize current organization from localStorage
  useEffect(() => {
    const initializeCurrentOrganization = () => {
      try {
        if (typeof window === "undefined") return;

        const currentOrgId = localStorage.getItem("currentOrganizationId");
        if (currentOrgId) {
          const existingOrg = organizationState.organizations.find(
            (org) => org.id === currentOrgId
          );
          if (existingOrg) {
            setOrganizationState((prev) => ({
              ...prev,
              currentOrganization: existingOrg,
            }));
          }
        }
      } catch (error) {
        console.error("Error initializing current organization:", error);
      }
    };

    initializeCurrentOrganization();
  }, []);

  // Helper to handle API operations with error handling
  const handleApiOperation = useCallback(async function <T>(
    operation: () => Promise<T>,
    loadingState: boolean = true
  ): Promise<T> {
    try {
      if (loadingState) {
        setOrganizationState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));
      }

      const result = await operation();

      if (loadingState) {
        setOrganizationState((prev) => ({ ...prev, isLoading: false }));
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setOrganizationState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // Add fetchAnalyticsData function
  const fetchAnalyticsData = useCallback(async (organizationId: string): Promise<void> => {
    try {
      setOrganizationState(prev => ({
        ...prev,
        analyticsLoading: true,
        analyticsError: null,
        refreshingAnalytics: true,
      }));

      const requests = [
        orgChartsApi.getKPIMetrics(organizationId),
        orgChartsApi.getProjectPortfolio(organizationId),
        orgChartsApi.getTeamUtilization(organizationId),
        orgChartsApi.getTaskDistribution(organizationId),
        orgChartsApi.getTaskTypeDistribution(organizationId),
        orgChartsApi.getSprintMetrics(organizationId),
        orgChartsApi.getQualityMetrics(organizationId),
        orgChartsApi.getWorkspaceProjectCount(organizationId),
        orgChartsApi.getMemberWorkload(organizationId),
        orgChartsApi.getResourceAllocation(organizationId),
      ];

      const results = await Promise.allSettled(requests);

      // Check if any requests failed
      const failedRequests = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedRequests.length > 0) {
        console.error("Some requests failed:", failedRequests);
      }

      const [
        kpiMetrics,
        projectPortfolio,
        teamUtilization,
        taskDistribution,
        taskType,
        sprintMetrics,
        qualityMetrics,
        workspaceProjectCount,
        memberWorkload,
        resourceAllocation,
      ] = results.map((result) =>
        result.status === "fulfilled" ? result.value : null
      );

      setOrganizationState(prev => ({
        ...prev,
        analyticsData: {
          kpiMetrics,
          projectPortfolio,
          teamUtilization,
          taskDistribution,
          taskType,
          sprintMetrics,
          qualityMetrics,
          workspaceProjectCount,
          memberWorkload,
          resourceAllocation,
        },
        analyticsLoading: false,
        refreshingAnalytics: false,
      }));
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      const errorMessage = err instanceof Error
        ? err.message
        : "Failed to load organization analytics data";
      
      setOrganizationState(prev => ({
        ...prev,
        analyticsLoading: false,
        refreshingAnalytics: false,
        analyticsError: errorMessage,
      }));
    }
  }, []);

  // Helper function for organization redirect logic
  const checkOrganizationAndRedirect = useCallback((): string => {
    try {
      if (typeof window === "undefined") return "/login";

      const currentOrganizationId = localStorage.getItem(
        "currentOrganizationId"
      );

      if (currentOrganizationId) {
        return "/dashboard";
      } else {
        return "/organizations";
      }
    } catch (error) {
      console.error("Error determining redirect path:", error);
      return "/organizations";
    }
  }, []);

  // Memoized API methods (stable references)
  const apiMethods = useMemo(
    () => ({
      getUserOrganizations: async (userId: string): Promise<Organization[]> => {
        const result = await handleApiOperation(() =>
          organizationApi.getUserOrganizations(userId)
        );
        setOrganizationState((prev) => ({
          ...prev,
          organizations: result,
        }));
        return result;
      },

      createOrganization: async (
        organizationData: CreateOrganizationData
      ): Promise<Organization> => {
        const result = await handleApiOperation(() =>
          organizationApi.createOrganization(organizationData)
        );
        setOrganizationState((prev) => ({
          ...prev,
          organizations: [...prev.organizations, result],
        }));
        return result;
      },

      getOrganizationById: (organizationId: string): Promise<Organization> =>
        handleApiOperation(
          () => organizationApi.getOrganizationById(organizationId),
          false
        ),

      updateOrganization: async (
        organizationId: string,
        updateData: Partial<CreateOrganizationData>
      ): Promise<Organization> => {
        const result = await handleApiOperation(
          () => organizationApi.updateOrganization(organizationId, updateData),
          false
        );
        setOrganizationState((prev) => ({
          ...prev,
          organizations: prev.organizations.map((org) =>
            org.id === organizationId ? { ...org, ...result } : org
          ),
          currentOrganization:
            prev.currentOrganization?.id === organizationId
              ? { ...prev.currentOrganization, ...result }
              : prev.currentOrganization,
        }));
        return result;
      },

      deleteOrganization: async (organizationId: string): Promise<void> => {
        await handleApiOperation(
          () => organizationApi.deleteOrganization(organizationId),
          false
        );

        setOrganizationState((prev) => ({
          ...prev,
          organizations: prev.organizations.filter(
            (org) => org.id !== organizationId
          ),
          currentOrganization:
            prev.currentOrganization?.id === organizationId
              ? null
              : prev.currentOrganization,
        }));

        if (typeof window !== "undefined") {
          const currentOrgId = localStorage.getItem("currentOrganizationId");
          if (currentOrgId === organizationId) {
            localStorage.removeItem("currentOrganizationId");
            window.dispatchEvent(new CustomEvent("organizationChanged"));
          }
        }
      },

      refreshOrganizations: async (userId: string): Promise<void> => {
        const result = await handleApiOperation(() =>
          organizationApi.getUserOrganizations(userId)
        );
        setOrganizationState((prev) => ({
          ...prev,
          organizations: result,
        }));
      },

      getOrganizationStats: async (
        organizationId: string
      ): Promise<OrganizationStats> => {
        const result = await handleApiOperation(
          () => organizationApi.getOrganizationStats(organizationId),
          false
        );
        return result;
      },

      getOrganizationRecentActivity: async (
        organizationId: string,
        filters: ActivityFilters
      ): Promise<ActivityResponse> => {
        return handleApiOperation(
          () =>
            organizationApi.getOrganizationRecentActivity(
              organizationId,
              filters
            ),
          false
        );
      },

      getOrganizationBySlug: async (slug: string): Promise<Organization> => {
        return handleApiOperation(
          () => organizationApi.getOrganizationBySlug(slug),
          false
        );
      },

      getOrganizationMembers: async (
        slug: string
      ): Promise<OrganizationMember[]> => {
        return handleApiOperation(
          () => organizationApi.getOrganizationMembers(slug),
          false
        );
      },

      getOrganizationWorkFlows: async (slug: string): Promise<Workflow[]> => {
        return handleApiOperation(
          () => organizationApi.getOrganizationWorkFlows(slug),
          false
        );
      },

      createWorkflow: async (
        workflowData: CreateWorkflowData
      ): Promise<Workflow> => {
        return workflowsApi.createWorkflow(workflowData);
      },

      updateWorkflow: async (
        workflowId: string,
        workflowData: UpdateWorkflowData
      ): Promise<Workflow> => {
        return workflowsApi.updateWorkflow(workflowId, workflowData);
      },

      updateTaskStatusPositions: async (
        statusUpdates: { id: string; position: number }[]
      ): Promise<TaskStatus[]> => {
        return taskStatusApi.updateTaskStatusPositions(statusUpdates);
      },

      // Add analytics methods
      fetchAnalyticsData,
    }),
    [handleApiOperation, fetchAnalyticsData]
  );

  // Memoized state management methods
  const stateMethods = useMemo(
    () => ({
      setCurrentOrganization: (organization: Organization | null): void => {
        setOrganizationState((prev) => ({
          ...prev,
          currentOrganization: organization,
        }));

        if (typeof window !== "undefined") {
          if (organization) {
            localStorage.setItem("currentOrganizationId", organization.id);
          } else {
            localStorage.removeItem("currentOrganizationId");
          }
          window.dispatchEvent(new CustomEvent("organizationChanged"));
        }
      },

      clearError: (): void => {
        setOrganizationState((prev) => ({ ...prev, error: null }));
      },

      clearAnalyticsError: (): void => {
        setOrganizationState((prev) => ({ ...prev, analyticsError: null }));
      },

      checkOrganizationAndRedirect,

      isUserInOrganization: (organizationId: string): boolean => {
        return organizationState.organizations.some(
          (org) => org.id === organizationId
        );
      },
    }),
    [checkOrganizationAndRedirect, organizationState]
  );

  // Combined context value
  const contextValue = useMemo(
    () => ({
      ...organizationState,
      ...apiMethods,
      ...stateMethods,
    }),
    [organizationState, apiMethods, stateMethods]
  );

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

export default OrganizationProvider;
