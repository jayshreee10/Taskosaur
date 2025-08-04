"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  organizationApi,
  Organization,
  CreateOrganizationData,
  OrganizationStats,
  ActivityFilters,
  ActivityResponse,
  OrganizationMember,
  Workflow,
} from "@/utils/api/organizationApi";
import {
  CreateWorkflowData,
  UpdateWorkflowData,
  workflowsApi,
} from "@/utils/api/workflowsApi";
import { TaskStatus, taskStatusApi } from "@/utils/api/taskStatusApi";

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
}

interface OrganizationContextType extends OrganizationState {
  // Organization methods
  getOrganizationsByUser: (userId: string) => Promise<Organization[]>;
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
    statusUpdates: { id: string; position: number; }[]
  ) => Promise<TaskStatus[]>;
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
    }
  );

  // Initialize current organization from localStorage
  useEffect(() => {
    const initializeCurrentOrganization = () => {
      try {
        if (typeof window === "undefined") return;

        const currentOrgId = localStorage.getItem("currentOrganizationId");
        if (currentOrgId) {
          // Find organization in state or fetch it
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
  }, [organizationState.organizations]);

  // Fixed: Helper to handle API operations with error handling
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
  },
  []);

  // Helper function for organization redirect logic
  const checkOrganizationAndRedirect = useCallback((): string => {
    try {
      if (typeof window === "undefined") return "/login";

      const currentOrganizationId = localStorage.getItem(
        "currentOrganizationId"
      );

      console.log("Organization redirect check:", {
        hasOrganizationId: !!currentOrganizationId,
        organizationId: currentOrganizationId,
      });

      if (currentOrganizationId) {
        return "/dashboard"; // User has organization, go to main app
      } else {
        return "/organizations"; // User needs to select/create organization
      }
    } catch (error) {
      console.error("Error determining redirect path:", error);
      return "/organizations";
    }
  }, []);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      ...organizationState,
      getOrganizationsByUser: async (
        userId: string
      ): Promise<Organization[]> => {
        const result = await handleApiOperation(() =>
          organizationApi.getOrganizationsByUser(userId)
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

        // Remove organization from state
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

        // Clear from localStorage if it was the current organization
        if (typeof window !== "undefined") {
          const currentOrgId = localStorage.getItem("currentOrganizationId");
          if (currentOrgId === organizationId) {
            localStorage.removeItem("currentOrganizationId");
            window.dispatchEvent(new CustomEvent("organizationChanged"));
          }
        }
      },

      // State management methods
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

      refreshOrganizations: async (userId: string): Promise<void> => {
        const result = await handleApiOperation(() =>
          organizationApi.getOrganizationsByUser(userId)
        );
        setOrganizationState((prev) => ({
          ...prev,
          organizations: result,
        }));
      },

      clearError: (): void => {
        setOrganizationState((prev) => ({ ...prev, error: null }));
      },
      checkOrganizationAndRedirect,

      isUserInOrganization: (organizationId: string): boolean => {
        return organizationState.organizations.some(
          (org) => org.id === organizationId
        );
      },
      getOrganizationStats: async (
        organizationId: string
      ): Promise<OrganizationStats> => {
        const result = await handleApiOperation(
          () => organizationApi.getOrganizationStats(organizationId),
          false
        );

        // Update organization stats in state
        setOrganizationState((prev) => ({
          ...prev,
          organizationStats: result,
        }));

        return result;
      },
      getOrganizationRecentActivity: async (
        organizationId: string,
        filters: ActivityFilters
      ): Promise<ActivityResponse> => {
        const result = await handleApiOperation(
          () =>
            organizationApi.getOrganizationRecentActivity(
              organizationId,
              filters
            ),
          false
        );
        return result;
      },
      getOrganizationBySlug: async (slug: string): Promise<Organization> => {
        const result = await handleApiOperation(
          () => organizationApi.getOrganizationBySlug(slug),
          false
        );
        return result;
      },
      getOrganizationMembers: async (
        slug: string
      ): Promise<OrganizationMember[]> => {
        const result = await handleApiOperation(
          () => organizationApi.getOrganizationMembers(slug),
          false
        );
        return result;
      },
      getOrganizationWorkFlows: async (slug: string): Promise<Workflow[]> => {
        const result = await handleApiOperation(
          () => organizationApi.getOrganizationWorkFlows(slug),
          false
        );
        return result;
      },
      createWorkflow: async (
        workflowData: CreateWorkflowData
      ): Promise<Workflow> => {
        const result = await workflowsApi.createWorkflow(workflowData);
        return result;
      },
      updateWorkflow: async (
        workflowId: string,
        workflowData: UpdateWorkflowData
      ): Promise<Workflow> => {
        const result = await workflowsApi.updateWorkflow(
          workflowId,
          workflowData
        );
        return result;
      },
      updateTaskStatusPositions: async (
        statusUpdates: { id: string; position: number; }[]
      ): Promise<TaskStatus[]> => {
        const result = await taskStatusApi.updateTaskStatusPositions(
          statusUpdates
        );
        return result;
      },
    }),
    [organizationState, handleApiOperation, checkOrganizationAndRedirect]
  );

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

export default OrganizationProvider;
