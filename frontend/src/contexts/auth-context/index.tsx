"use client";

import {
  authApi,
  LoginData,
  UploadFileResponse,
  User,
  UserData,
} from "@/utils/api/authApi";
import { userApi, UpdateEmailData, UpdateUserData } from "@/utils/api/userApi";
import { organizationApi } from "@/utils/api/organizationApi";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Notification,
  notificationApi,
  NotificationPriority,
  NotificationType,
} from "@/utils/api/notificationApi";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // Auth methods
  register: (userData: UserData) => Promise<any>;
  login: (loginData: LoginData) => Promise<any>;
  logout: () => Promise<void>;

  // User methods
  getAllUsers: () => Promise<any>;
  getUserById: (userId: string) => Promise<any>;
  updateUser: (userId: string, userData: UpdateUserData) => Promise<any>;
  updateUserEmail: (userId: string, emailData: UpdateEmailData) => Promise<any>;
  deleteUser: (userId: string) => Promise<void>;

  // Utility methods
  getCurrentUser: () => User | null;
  isAuthenticated: () => boolean;
  checkOrganizationAndRedirect: () => Promise<string>; // Returns redirect path
  clearError: () => void;

  // Organization helper
  setupUserOrganization: (userId: string) => Promise<void>;
  getNotificationsByUserAndOrganization: (
    userId: string,
    organizationId: string,
    filters: {
      isRead?: boolean;
      type?: NotificationType;
      priority?: NotificationPriority;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) => Promise<{
    notifications: Notification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    summary: {
      total: number;
      unread: number;
      byType: Record<string, number>;
      byPriority: Record<string, number>;
    };
  }>;
  uploadFileToS3: (file: File, key: string) => Promise<UploadFileResponse>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  const setupUserOrganization = useCallback(async (userId: string) => {
    try {
      const currentOrgId = localStorage.getItem("currentOrganizationId");
      if (currentOrgId) {
        return;
      }
      const organizations = await organizationApi.getOrganizationsByUser(
        userId
      );

      if (organizations && organizations.length > 0) {
        const firstOrganization = organizations[0];

        // Store the first organization as current
        localStorage.setItem("currentOrganizationId", firstOrganization.id);
        window.dispatchEvent(new CustomEvent("organizationChanged"));
      } else {
        localStorage.removeItem("currentOrganizationId");
      }
    } catch (error) {
      console.error("Error setting up user organization:", error);
    }
  }, []);

  // Initialize auth state once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = authApi.getCurrentUser();
        const isAuth = authApi.isAuthenticated();

        if (user && isAuth) {
          setAuthState((prev) => ({ ...prev, user }));

          // Setup organization for the user
          await setupUserOrganization(user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setAuthState((prev) => ({
          ...prev,
          error: "Failed to initialize authentication",
        }));
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [setupUserOrganization]);

  /**
   * Helper to handle API calls with error handling and optional user state update.
   * Does NOT trigger checkOrganizationAndRedirect automatically.
   */
  const handleApiOperation = useCallback(
    async function <T>(
      operation: () => Promise<T>,
      updateUserState: boolean = false
    ): Promise<T> {
      try {
        setAuthState((prev) => ({ ...prev, error: null }));

        const result = await operation();

        // Optionally update logged-in user state if result contains user
        if (
          updateUserState &&
          typeof result === "object" &&
          result &&
          "user" in result
        ) {
          const authResponse = result as any;
          if (authResponse.user) {
            setAuthState((prev) => ({ ...prev, user: authResponse.user }));

            // Setup organization for newly logged in user - runs only here, not after updateUser
            await setupUserOrganization(authResponse.user.id);
          }
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [setupUserOrganization]
  );

  // This method is NOT called automatically after updateUser, so no retriggering of organization check
  const checkOrganizationAndRedirect =
    useCallback(async (): Promise<string> => {
      if (typeof window === "undefined") return "/login";
      try {
        const user = authApi.getCurrentUser();
        if (!user) return "/login";

        const organizations = await organizationApi.getOrganizationsByUser(
          user.id
        );
        if (organizations && organizations.length > 0) {
          localStorage.setItem("currentOrganizationId", organizations[0].id);
          return "/dashboard";
        } else {
          localStorage.removeItem("currentOrganizationId");
          return "/organization";
        }
      } catch (err) {
        return "/login";
      }
    }, []);

  // Memoized context value with all methods
  const contextValue = useMemo(
    () => ({
      ...authState,

      // Auth methods
      register: async (userData: UserData) => {
        const result = await handleApiOperation(
          () => authApi.register(userData),
          true
        );
        return result;
      },

      login: async (loginData: LoginData) => {
        const result = await handleApiOperation(
          () => authApi.login(loginData),
          true
        );
        return result;
      },

      logout: async () => {
        await handleApiOperation(async () => {
          await authApi.logout();

          if (typeof window !== "undefined") {
            localStorage.removeItem("currentOrganizationId");
            window.dispatchEvent(new CustomEvent("organizationChanged"));
          }

          setAuthState((prev) => ({ ...prev, user: null }));
        });
      },

      // User methods
      getAllUsers: () => handleApiOperation(() => userApi.getAllUsers()),
      getUserById: (userId: string) =>
        handleApiOperation(() => userApi.getUserById(userId)),

      updateUser: async (userId: string, userData: UpdateUserData) => {
        const result = await handleApiOperation(() =>
          userApi.updateUser(userId, userData)
        );

        // Update context state if current user updated
        if (authState.user && authState.user.id === userId) {
          setAuthState((prev) => ({
            ...prev,
            user: { ...prev.user!, ...result },
          }));
        }
        return result;
      },

      updateUserEmail: async (userId: string, emailData: UpdateEmailData) => {
        const result = await handleApiOperation(() =>
          userApi.updateUserEmail(userId, emailData)
        );

        if (authState.user && authState.user.id === userId) {
          setAuthState((prev) => ({
            ...prev,
            user: { ...prev.user!, ...result },
          }));
        }

        return result;
      },

      deleteUser: (userId: string) =>
        handleApiOperation(() => userApi.deleteUser(userId)),

      // Utility methods
      getCurrentUser: authApi.getCurrentUser,
      isAuthenticated: authApi.isAuthenticated,
      checkOrganizationAndRedirect, // Exposed but must be called manually by UI components
      clearError: () => {
        setAuthState((prev) => ({ ...prev, error: null }));
      },

      // Organization helper
      setupUserOrganization,

      getNotificationsByUserAndOrganization: (
        userId: string,
        organizationId: string,
        filters: {
          isRead?: boolean;
          type?: NotificationType;
          priority?: NotificationPriority;
          startDate?: string;
          endDate?: string;
          page?: number;
          limit?: number;
        }
      ) => {
        return notificationApi.getNotificationsByUserAndOrganization(
          userId,
          organizationId,
          filters
        );
      },

      uploadFileToS3: async (file: File, key: string) =>
        authApi.uploadFileToS3(file, key),
    }),
    [
      authState,
      handleApiOperation,
      setupUserOrganization,
      checkOrganizationAndRedirect,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export default AuthProvider;
