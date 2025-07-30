// Consolidated authentication utilities and fetch wrapper

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// ====================== COOKIE UTILITIES ======================

/**
 * Get a cookie value by name
 */
const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

/**
 * Set a cookie with options
 */
const setCookie = (name: string, value: string, options: {
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
} = {}): void => {
  if (typeof window === 'undefined') {
    return;
  }

  let cookieString = `${name}=${value}`;
  
  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }
  
  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }
  
  if (options.path) {
    cookieString += `; path=${options.path}`;
  }
  
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }
  
  if (options.secure) {
    cookieString += `; secure`;
  }
  
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }
  
  document.cookie = cookieString;
};

/**
 * Remove a cookie by setting it to expire
 */
const removeCookie = (name: string, path: string = '/'): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};

// ====================== TOKEN UTILITIES ======================

/**
 * Get access token from sessionStorage (short-lived, 15 minutes)
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Primary: Get access token from sessionStorage
  const accessToken = sessionStorage.getItem('access_token');
  if (accessToken) {
    return accessToken;
  }
  
  // Fallback to old localStorage location for backward compatibility
  const localToken = localStorage.getItem('token');
  if (localToken) {
    return localToken;
  }
  
  return null;
};

/**
 * Set access token in sessionStorage (expires in 15 minutes)
 */
export const setAccessToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('access_token', token);
  }
};

/**
 * Remove access token from sessionStorage
 */
export const removeAccessToken = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('access_token');
  }
};

/**
 * Get refresh token from cookies using taskosourtoken name
 */
export const getRefreshToken = (): string | null => {
  return getCookie('taskosourtoken');
};

/**
 * Set refresh token as persistent cookie using taskosourtoken name
 * Note: In production, this should be set by the backend for security
 * This is a fallback for development
 * Cookie will persist until manually deleted by user
 */
export const setRefreshToken = (token: string): void => {
  setCookie('taskosourtoken', token, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax'
  });
};

/**
 * Remove refresh token cookie
 */
export const removeRefreshToken = (): void => {
  removeCookie('taskosourtoken', '/');
};

/**
 * Clear all tokens
 */
export const clearAllTokens = (): void => {
  removeAccessToken();
  removeRefreshToken();
  
  // Also clean up any remaining old storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Check if user is authenticated based on available tokens
 */
export const hasValidTokens = (): boolean => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  // We need at least a refresh token for authentication
  // Access token might be expired but can be refreshed
  return !!(refreshToken);
};

// ====================== AUTH FETCH UTILITIES ======================

/**
 * Refresh the access token using the refresh token
 */
const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) {
      console.warn('No taskosourtoken cookie available');
      clearAllTokens();
      return false;
    }



    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    });

    if (!response.ok) {
      console.warn('Token refresh failed - clearing tokens', response.status);
      clearAllTokens();
      return false;
    }

    const data = await response.json();
    
    // Store new access token
    if (data.access_token) {
      setAccessToken(data.access_token);

      
      // Update refresh token if provided
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);

      }
      
      return true;
    }
    
    console.warn('No access token in refresh response');
    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAllTokens();
    return false;
  }
};


export const authFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const makeRequest = async (token: string | null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    return fetch(url, requestOptions);
  };

  try {
    const accessToken = getAccessToken();
    let response = await makeRequest(accessToken);
    
    // If we get a 401, try to refresh the token
    if (response.status === 401) {
      const refreshSuccess = await refreshToken();
      
      if (refreshSuccess) {
        // Retry the request with the new access token
        const newAccessToken = getAccessToken();
        response = await makeRequest(newAccessToken);
      } else {
        // Token refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return response;
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
};
