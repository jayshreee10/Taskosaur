"use client";

import { authApi, LoginData, User, UserData } from "@/utils/api/authApi";
import { userApi, UpdateEmailData, UpdateUserData } from "@/utils/api/userApi";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

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
  checkOrganizationAndRedirect: () => boolean | string; // Returns true if organization exists, otherwise redirect path
  clearError: () => void;
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

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const user = authApi.getCurrentUser();
        const isAuth = authApi.isAuthenticated();

        if (user && isAuth) {
          setAuthState((prev) => ({ ...prev, user }));
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
  }, []);

  // Helper to handle API operations with error handling
  const handleApiOperation = useCallback(async function <T>(
    operation: () => Promise<T>,
    updateUserState: boolean = false
  ): Promise<T> {
    try {
      setAuthState((prev) => ({ ...prev, error: null }));

      const result = await operation();

      // Update user state if needed (for auth operations)
      if (
        updateUserState &&
        typeof result === "object" &&
        result &&
        "user" in result
      ) {
        const authResponse = result as any;
        if (authResponse.user) {
          setAuthState((prev) => ({ ...prev, user: authResponse.user }));
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
  []);

  // Memoized context value
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
      checkOrganizationAndRedirect: () => {
        if (typeof window === "undefined") return false;

        const currentOrganizationId = localStorage.getItem(
          "currentOrganizationId"
        );

        console.log("Organization check:", {
          hasOrganizationId: !!currentOrganizationId,
          organizationId: currentOrganizationId,
        });

        if (currentOrganizationId) {
          return true; // or '/main' - your main app route
        } else {
          return false; // your organization selection page
        }
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
          setAuthState((prev) => ({ ...prev, user: null }));
        });
      },

      // User methods - direct API calls
      getAllUsers: () => handleApiOperation(() => userApi.getAllUsers()),
      getUserById: (userId: string) =>
        handleApiOperation(() => userApi.getUserById(userId)),

      updateUser: async (userId: string, userData: UpdateUserData) => {
        const result = await handleApiOperation(() =>
          userApi.updateUser(userId, userData)
        );

        // Update context state if it's the current user
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

        // Update context state if it's the current user
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

      clearError: () => {
        setAuthState((prev) => ({ ...prev, error: null }));
      },
    }),
    [authState, handleApiOperation]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export default AuthProvider;
