import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Types for API responses
interface AuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
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
    this.name = 'ApiAuthError';
  }
}

// Type guard function
const isApiErrorResponse = (data: any): data is ApiErrorResponse => {
  return data && typeof data === 'object';
};

// Token management utilities with cookie support
const TokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  setAccessToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get('refreshToken') || null;
  },

  setRefreshToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      Cookies.set('refreshToken', token, {
        expires: 30, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    }
  },

  clearTokens: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      Cookies.remove('refreshToken', { path: '/' });
    }
  }
};

// Enhanced error handling function
const handleApiError = (error: AxiosError): ApiError => {
  let message = 'An unexpected error occurred';
  let code: string | undefined;

  if (error.response?.data) {
    const data = error.response.data;
    
    if (isApiErrorResponse(data)) {
      message = data.message || data.error || message;
      code = data.code;
    } else if (typeof data === 'string') {
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
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();
        
        if (!refreshToken) {
          throw new ApiAuthError('No refresh token available', 401);
        }

        // Create refresh request
        const refreshResponse = await axios.post<AuthTokenResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          {
            refresh_token: refreshToken,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `refreshToken=${refreshToken}`,
            },
            withCredentials: true,
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        // Update stored tokens
        TokenManager.setAccessToken(accessToken);
        if (newRefreshToken) {
          TokenManager.setRefreshToken(newRefreshToken);
        }

        // Update the authorization header for the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        TokenManager.clearTokens();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(new ApiAuthError('Authentication failed', 401));
      }
    }

    // Use the enhanced error handler
    const apiError = handleApiError(error);
    return Promise.reject(apiError);
  }
);

// Utility functions for common API operations
export const apiUtils = {
  login: async (credentials: { email: string; password: string }): Promise<AuthTokenResponse> => {
    const response = await api.post<AuthTokenResponse>('/auth/login', credentials);
    const { accessToken, refreshToken } = response.data;
    
    TokenManager.setAccessToken(accessToken);
    if (refreshToken) {
      TokenManager.setRefreshToken(refreshToken);
    }
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  isAuthenticated: (): boolean => {
    return !!TokenManager.getAccessToken();
  },

  refreshToken: async (): Promise<string | null> => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return null;

      const response = await axios.post<AuthTokenResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { 
          withCredentials: true,
          headers: {
            'Cookie': `refreshToken=${refreshToken}`,
          }
        }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      TokenManager.setAccessToken(accessToken);
      
      if (newRefreshToken) {
        TokenManager.setRefreshToken(newRefreshToken);
      }
      
      return accessToken;
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      TokenManager.clearTokens();
      return null;
    }
  },
};

export default api;
export { TokenManager, ApiAuthError };
export type { AuthTokenResponse, ApiError, ApiErrorResponse };
