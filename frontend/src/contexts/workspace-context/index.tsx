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
  workspaceApi,
  Workspace,
  WorkspaceData,
  WorkspaceMember,
  AddMemberToWorkspaceData,
  InviteMemberToWorkspaceData,
  UpdateMemberRoleData,
  WorkspaceStats,
  WorkspaceRole,
  CreateWorkspaceData,
  GetWorkspaceActivityParams,
  WorkspaceActivityResponse,
} from "@/utils/api/workspaceApi";

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  workspaceMembers: WorkspaceMember[];
  workspaceStats: WorkspaceStats | null;
  isLoading: boolean;
  error: string | null;
}

interface WorkspaceContextType extends WorkspaceState {
  // Workspace methods
  createWorkspace: (workspaceData: WorkspaceData) => Promise<Workspace>;
  getWorkspaces: () => Promise<Workspace[]>;
  getWorkspacesByOrganization: (
    organizationId?: string
  ) => Promise<Workspace[]>;
  getWorkspaceById: (workspaceId: string) => Promise<Workspace>;
  getWorkspaceBySlug: (
    slug: string,
    organizationId?: string
  ) => Promise<Workspace>;
  updateWorkspace: (
    workspaceId: string,
    workspaceData: Partial<WorkspaceData>
  ) => Promise<Workspace>;
  deleteWorkspace: (
    workspaceId: string
  ) => Promise<{ success: boolean; message: string }>;

  // Workspace member methods
  getWorkspaceMembers: (workspaceId: string) => Promise<WorkspaceMember[]>;
  addMemberToWorkspace: (
    memberData: AddMemberToWorkspaceData
  ) => Promise<WorkspaceMember>;
  inviteMemberToWorkspace: (
    inviteData: InviteMemberToWorkspaceData
  ) => Promise<any>;
  updateMemberRole: (
    memberId: string,
    updateData: UpdateMemberRoleData,
    requestUserId: string
  ) => Promise<WorkspaceMember>;
  removeMemberFromWorkspace: (
    memberId: string,
    requestUserId: string
  ) => Promise<{ success: boolean; message: string }>;

  // Stats and utility methods
  getWorkspaceStats: (workspaceId: string) => Promise<WorkspaceStats>;

  // State management
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: (organizationId?: string) => Promise<void>;
  refreshWorkspaceMembers: (workspaceId: string) => Promise<void>;
  clearError: () => void;

  // Helper methods
  isUserWorkspaceMember: (workspaceId: string, userId: string) => boolean;
  getUserWorkspaceRole: (
    workspaceId: string,
    userId: string
  ) => WorkspaceRole | null;
  getCurrentOrganizationId: () => string | null;
  getWorkspaceRecentActivity: (
    workspaceId: string,
    params?: GetWorkspaceActivityParams
  ) => Promise<WorkspaceActivityResponse>;

  // Search methods
  searchWorkspacesByOrganization: (
    organizationId: string,
    search: string
  ) => Promise<Workspace[]>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

// For backward compatibility
export const useWorkspaceContext = useWorkspace;

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    workspaces: [],
    currentWorkspace: null,
    workspaceMembers: [],
    workspaceStats: null,
    isLoading: false,
    error: null,
  });

  // Cache for workspaces by organization
  const [workspaceCache, setWorkspaceCache] = useState<{
    [key: string]: { data: Workspace[]; timestamp: number };
  }>({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Helper to handle API operations with error handling
  const handleApiOperation = useCallback(async function <T>(
    operation: () => Promise<T>,
    loadingState: boolean = true
  ): Promise<T> {
    try {
      if (loadingState) {
        setWorkspaceState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));
      }

      const result = await operation();

      if (loadingState) {
        setWorkspaceState((prev) => ({ ...prev, isLoading: false }));
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setWorkspaceState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  },
  []);

  const getCurrentOrganizationId = useCallback((): string | null => {
    return workspaceApi.getCurrentOrganization();
  }, []);

  // Cache management for workspaces by organization
  const getCachedWorkspaces = useCallback(
    (organizationId: string): Workspace[] | null => {
      const cached = workspaceCache[organizationId];
      if (!cached) return null;

      const now = Date.now();
      if (now - cached.timestamp > CACHE_DURATION) {
        // Cache expired
        setWorkspaceCache((prev) => {
          const newCache = { ...prev };
          delete newCache[organizationId];
          return newCache;
        });
        return null;
      }

      return cached.data;
    },
    [workspaceCache, CACHE_DURATION]
  );

  const setCachedWorkspaces = useCallback(
    (organizationId: string, data: Workspace[]) => {
      setWorkspaceCache((prev) => ({
        ...prev,
        [organizationId]: {
          data,
          timestamp: Date.now(),
        },
      }));
    },
    []
  );

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      ...workspaceState,

      // Workspace methods with state management
      createWorkspace: async (
        workspaceData: WorkspaceData
      ): Promise<Workspace> => {
        const organizationId = getCurrentOrganizationId();
        if (!organizationId) {
          throw new Error(
            "No organization selected. Please select an organization first."
          );
        }

        const createData: CreateWorkspaceData = {
          ...workspaceData,
          organizationId,
        };

        const result = await handleApiOperation(() =>
          workspaceApi.createWorkspace(createData)
        );

        // Add new workspace to state and clear cache
        setWorkspaceState((prev) => ({
          ...prev,
          workspaces: [...prev.workspaces, result],
        }));

        // Clear cache for the organization
        setWorkspaceCache((prev) => {
          const newCache = { ...prev };
          delete newCache[organizationId];
          return newCache;
        });

        return result;
      },

      getWorkspaces: async (): Promise<Workspace[]> => {
        const result = await handleApiOperation(() =>
          workspaceApi.getWorkspaces()
        );

        setWorkspaceState((prev) => ({
          ...prev,
          workspaces: result,
        }));

        return result;
      },

      getWorkspacesByOrganization: async (
        organizationId?: string
      ): Promise<Workspace[]> => {
        const orgId = organizationId || getCurrentOrganizationId();
        if (!orgId) {
          throw new Error(
            "No organization selected. Please select an organization first."
          );
        }

        // Check cache first
        const cachedData = getCachedWorkspaces(orgId);
        if (cachedData) {
          console.log("Using cached workspaces for organization:", orgId);
          setWorkspaceState((prev) => ({
            ...prev,
            workspaces: cachedData,
          }));
          return cachedData;
        }

        const result = await handleApiOperation(() =>
          workspaceApi.getWorkspacesByOrganization(orgId)
        );

        setWorkspaceState((prev) => ({
          ...prev,
          workspaces: result,
        }));

        // Update cache
        setCachedWorkspaces(orgId, result);

        return result;
      },

      getWorkspaceById: async (workspaceId: string): Promise<Workspace> => {
        const result = await handleApiOperation(
          () => workspaceApi.getWorkspaceById(workspaceId),
          false
        );

        // Update current workspace if it's the same ID
        setWorkspaceState((prev) => ({
          ...prev,
          currentWorkspace:
            prev.currentWorkspace?.id === workspaceId
              ? result
              : prev.currentWorkspace,
        }));

        return result;
      },

      getWorkspaceBySlug: async (
        slug: string,
        organizationId?: string
      ): Promise<Workspace> => {
        const orgId = organizationId || getCurrentOrganizationId();
        if (!orgId) {
          throw new Error(
            "No organization selected. Please select an organization first."
          );
        }

        const result = await handleApiOperation(
          () => workspaceApi.getWorkspaceBySlug(slug, orgId),
          false
        );
        return result;
      },

      updateWorkspace: async (
        workspaceId: string,
        workspaceData: Partial<WorkspaceData>
      ): Promise<Workspace> => {
        const result = await handleApiOperation(
          () => workspaceApi.updateWorkspace(workspaceId, workspaceData),
          false
        );

        // Update workspace in state
        setWorkspaceState((prev) => ({
          ...prev,
          workspaces: prev.workspaces.map((workspace) =>
            workspace.id === workspaceId
              ? { ...workspace, ...result }
              : workspace
          ),
          currentWorkspace:
            prev.currentWorkspace?.id === workspaceId
              ? { ...prev.currentWorkspace, ...result }
              : prev.currentWorkspace,
        }));

        // Clear cache since workspace was updated
        const orgId = getCurrentOrganizationId();
        if (orgId) {
          setWorkspaceCache((prev) => {
            const newCache = { ...prev };
            delete newCache[orgId];
            return newCache;
          });
        }

        return result;
      },

      deleteWorkspace: async (
        workspaceId: string
      ): Promise<{ success: boolean; message: string }> => {
        const result = await handleApiOperation(
          () => workspaceApi.deleteWorkspace(workspaceId),
          false
        );

        // Remove workspace from state
        setWorkspaceState((prev) => ({
          ...prev,
          workspaces: prev.workspaces.filter(
            (workspace) => workspace.id !== workspaceId
          ),
          currentWorkspace:
            prev.currentWorkspace?.id === workspaceId
              ? null
              : prev.currentWorkspace,
        }));

        // Clear cache since workspace was deleted
        const orgId = getCurrentOrganizationId();
        if (orgId) {
          setWorkspaceCache((prev) => {
            const newCache = { ...prev };
            delete newCache[orgId];
            return newCache;
          });
        }

        return result;
      },

      // Workspace member methods
      getWorkspaceMembers: async (
        workspaceId: string
      ): Promise<WorkspaceMember[]> => {
        const result = await handleApiOperation(
          () => workspaceApi.getWorkspaceMembers(workspaceId),
          false
        );

        setWorkspaceState((prev) => ({
          ...prev,
          workspaceMembers: result,
        }));

        return result;
      },

      addMemberToWorkspace: async (
        memberData: AddMemberToWorkspaceData
      ): Promise<WorkspaceMember> => {
        const result = await handleApiOperation(
          () => workspaceApi.addMemberToWorkspace(memberData),
          false
        );

        // Add new member to state if it's for the current workspace's members
        if (
          workspaceState.workspaceMembers.length > 0 &&
          workspaceState.workspaceMembers.some(
            (m) => m.workspaceId === memberData.workspaceId
          )
        ) {
          setWorkspaceState((prev) => ({
            ...prev,
            workspaceMembers: [...prev.workspaceMembers, result],
          }));
        }

        return result;
      },

      inviteMemberToWorkspace: (
        inviteData: InviteMemberToWorkspaceData
      ): Promise<any> =>
        handleApiOperation(
          () => workspaceApi.inviteMemberToWorkspace(inviteData),
          false
        ),

      updateMemberRole: async (
        memberId: string,
        updateData: UpdateMemberRoleData,
        requestUserId: string
      ): Promise<WorkspaceMember> => {
        const result = await handleApiOperation(
          () =>
            workspaceApi.updateMemberRole(memberId, updateData, requestUserId),
          false
        );

        // Update member in state
        setWorkspaceState((prev) => ({
          ...prev,
          workspaceMembers: prev.workspaceMembers.map((member) =>
            member.id === memberId ? { ...member, ...result } : member
          ),
        }));

        return result;
      },

      removeMemberFromWorkspace: async (
        memberId: string,
        requestUserId: string
      ): Promise<{ success: boolean; message: string }> => {
        const result = await handleApiOperation(
          () => workspaceApi.removeMemberFromWorkspace(memberId, requestUserId),
          false
        );

        // Remove member from state
        setWorkspaceState((prev) => ({
          ...prev,
          workspaceMembers: prev.workspaceMembers.filter(
            (member) => member.id !== memberId
          ),
        }));

        return result;
      },

      // Stats and utility methods
      getWorkspaceStats: async (
        workspaceId: string
      ): Promise<WorkspaceStats> => {
        const result = await handleApiOperation(
          () => workspaceApi.getWorkspaceStats(workspaceId),
          false
        );

        setWorkspaceState((prev) => ({
          ...prev,
          workspaceStats: result,
        }));

        return result;
      },

      // State management methods
      setCurrentWorkspace: (workspace: Workspace | null): void => {
        setWorkspaceState((prev) => ({ ...prev, currentWorkspace: workspace }));
      },

      refreshWorkspaces: async (organizationId?: string): Promise<void> => {
        if (organizationId) {
          // Clear cache first
          setWorkspaceCache((prev) => {
            const newCache = { ...prev };
            delete newCache[organizationId];
            return newCache;
          });
          await contextValue.getWorkspacesByOrganization(organizationId);
        } else {
          await contextValue.getWorkspaces();
        }
      },

      refreshWorkspaceMembers: async (workspaceId: string): Promise<void> => {
        await contextValue.getWorkspaceMembers(workspaceId);
      },

      clearError: (): void => {
        setWorkspaceState((prev) => ({ ...prev, error: null }));
      },

      // Helper methods
      isUserWorkspaceMember: (workspaceId: string, userId: string): boolean => {
        return workspaceState.workspaceMembers.some(
          (member) =>
            member.workspaceId === workspaceId && member.userId === userId
        );
      },

      getUserWorkspaceRole: (
        workspaceId: string,
        userId: string
      ): WorkspaceRole | null => {
        const member = workspaceState.workspaceMembers.find(
          (member) =>
            member.workspaceId === workspaceId && member.userId === userId
        );
        return member?.role || null;
      },

      getCurrentOrganizationId,
      getWorkspaceRecentActivity: async (
        workspaceId: string,
        params: GetWorkspaceActivityParams = {}
      ): Promise<WorkspaceActivityResponse> => {
        return await handleApiOperation(
          () => workspaceApi.getWorkspaceRecentActivity(workspaceId, params),
          false
        );
      },

      searchWorkspacesByOrganization: async (
        organizationId: string,
        search: string
      ): Promise<Workspace[]> => {
        // Trim search query and handle empty searches
        const trimmedSearch = search.trim();

        if (!trimmedSearch || trimmedSearch.length < 2) {
          console.log("Search query too short, returning empty results");
          return [];
        }

        const result = await handleApiOperation(
          () =>
            workspaceApi.searchWorkspacesByOrganization(
              organizationId,
              trimmedSearch
            ),
          false // Don't show global loading state for search
        );

        return result;
      },
    }),
    [
      workspaceState,
      handleApiOperation,
      getCurrentOrganizationId,
      getCachedWorkspaces,
      setCachedWorkspaces,
    ]
  );

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceProvider;
