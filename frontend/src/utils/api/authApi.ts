import api, { AuthTokenResponse, TokenManager } from "@/lib/api";

export interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}
api;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

export interface AuthResponse extends AuthTokenResponse {
  user?: User;
  message?: string;
}

export const authApi = {
  register: async (userData: UserData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", userData);

    const { access_token, refresh_token, user } = response.data;

    if (access_token) TokenManager.setAccessToken(access_token);
    if (refresh_token) TokenManager.setRefreshToken(refresh_token);
    if (user) localStorage.setItem("user", JSON.stringify(user));

    return response.data;
  },

  login: async (loginData: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", loginData);

    const { access_token, refresh_token, user } = response.data;
    if (access_token) TokenManager.setAccessToken(access_token);
    if (refresh_token) TokenManager.setRefreshToken(refresh_token);
    if (user) localStorage.setItem("user", JSON.stringify(user));

    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      TokenManager.clearTokens();
      localStorage.removeItem("user");
      localStorage.removeItem("currentOrganizationId");

      // Dispatch event to notify other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("organizationChanged"));
      }
    }
  },

  getCurrentUser: (): User | null => {
    try {
      if (typeof window === "undefined") return null;

      const userString = localStorage.getItem("user");
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  },

  refreshUserData: async (): Promise<User | null> => {
    try {
      const response = await api.get<User>("/auth/me");
      const user = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;

    const user = authApi.getCurrentUser();
    const hasTokens = TokenManager.getAccessToken();
    return !!(hasTokens && user);
  },
};
