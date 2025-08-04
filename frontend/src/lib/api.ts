import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

// Types for API responses
interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Custom error class
class ApiAuthError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiAuthError";
  }
}

// Type guard function
const isApiErrorResponse = (data: any): data is ApiErrorResponse => {
  return data && typeof data === "object";
};

// Token management utilities with cookie support
const TokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },

  setAccessToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return Cookies.get("refresh_token") || null;
  },

  setRefreshToken: (token: string): void => {
    if (typeof window !== "undefined") {
      Cookies.set("refresh_token", token, {
        expires: 30, // 30 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    }
  },

  clearTokens: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      Cookies.remove("refresh_token", { path: "/" });
    }
  },
};

// Enhanced error handling function
const handleApiError = (error: AxiosError): ApiError => {
  let message = "An unexpected error occurred";
  let code: string | undefined;

  if (error.response?.data) {
    const data = error.response.data;

    if (isApiErrorResponse(data)) {
      message = data.message || data.error || message;
      code = data.code;
    } else if (typeof data === "string") {
      message = data;
    }
  } else if (error.message) {
    message = error.message;
  }

  return {
    message,
    status: error.response?.status,
    code,
  };
};

// Create axios instance with environment variable
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = TokenManager.getRefreshToken();

        if (!refresh_token) {
          throw new ApiAuthError("No refresh token available", 401);
        }

        // Create refresh request
        const refreshResponse = await axios.post<AuthTokenResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          {
            refresh_token, // Send in body as expected by API
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true, // Include cookies if needed for other purposes
          }
        );
        console.log("Token refresh successful:", refreshResponse.data);

        const { access_token, refresh_token: newRefreshToken } =
          refreshResponse.data;

        // Update stored tokens
        TokenManager.setAccessToken(access_token);
        if (newRefreshToken) {
          TokenManager.setRefreshToken(newRefreshToken);
        }

        // Update the authorization header for the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        TokenManager.clearTokens();

        // if (typeof window !== "undefined") {
        //   window.location.href = "/login";
        // }

        return Promise.reject(new ApiAuthError("Authentication failed", 401));
      }
    }

    // Use the enhanced error handler
    const apiError = handleApiError(error);
    return Promise.reject(apiError);
  }
);

// Utility functions for common API operations
export const apiUtils = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthTokenResponse> => {
    const response = await api.post<AuthTokenResponse>(
      "/auth/login",
      credentials
    );
    const { access_token, refresh_token } = response.data;

    TokenManager.setAccessToken(access_token);
    if (refresh_token) {
      TokenManager.setRefreshToken(refresh_token);
    }

    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      TokenManager.clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  isAuthenticated: (): boolean => {
    return !!TokenManager.getAccessToken();
  },

  refresh_token: async (): Promise<string | null> => {
    try {
      const refresh_token = TokenManager.getRefreshToken();
      if (!refresh_token) return null;

      const response = await axios.post<AuthTokenResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
        { refresh_token: refresh_token },
        {
          withCredentials: true,
          headers: {
            Cookie: `refresh_token=${refresh_token}`,
          },
        }
      );

      const { access_token, refresh_token: newRefreshToken } = response.data;
      TokenManager.setAccessToken(access_token);

      if (newRefreshToken) {
        TokenManager.setRefreshToken(newRefreshToken);
      }

      return access_token;
    } catch (error) {
      console.error("Manual token refresh failed:", error);
      TokenManager.clearTokens();
      return null;
    }
  },
};

export default api;
export { TokenManager, ApiAuthError };
export type { AuthTokenResponse, ApiError, ApiErrorResponse };
