"use client";
import React, { createContext, useContext } from 'react';
import { 
  getAccessToken, 
  setAccessToken, 
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  clearAllTokens,
  hasValidTokens,
  authFetch
} from '../../utils/authFetch';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  status?: string;
  emailVerified?: boolean;
  preferences?: {
    theme?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
  };
}

interface UpdateEmailData {
  email: string;
}

interface AuthContextType {
  register: (userData: UserData) => Promise<any>;
  login: (loginData: LoginData) => Promise<any>;
  logout: () => Promise<any>;
  getAllUsers: () => Promise<any>;
  getUserById: (userId: string) => Promise<any>;
  updateUser: (userId: string, userData: UpdateUserData) => Promise<any>;
  updateUserEmail: (userId: string, emailData: UpdateEmailData) => Promise<any>;
  deleteUser: (userId: string) => Promise<any>;
  getCurrentUser: () => User | null;
  isAuthenticated: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const register = async (userData: UserData) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      // console.log('Registration successful:', data);

      // Store refresh token (backend should set httpOnly cookie, but fallback to localStorage)
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
      }
      
      // Store access token in sessionStorage
      if (data.access_token) {
        setAccessToken(data.access_token);
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // console.log('User stored in localStorage:', data.user);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (loginData: LoginData) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();


      // Store refresh token as taskosourtoken cookie
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);

      }
      
      // Store access token in sessionStorage (expires in 15 minutes)
      if (data.access_token) {
        setAccessToken(data.access_token);

      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      } else {
        // Clear all tokens and user data
        clearAllTokens();
        localStorage.removeItem('user');
        localStorage.removeItem('currentOrganizationId');
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('organizationChanged'));
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens even if logout request fails
      clearAllTokens();
      localStorage.removeItem('user');
      localStorage.removeItem('currentOrganizationId');
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('organizationChanged'));
      throw error;
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await authFetch(`${BASE_URL}/users`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      // console.log('Users fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  };

  const getUserById = async (userId: string) => {
    try {
      const response = await authFetch(`${BASE_URL}/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user by ID');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData) => {
    try {
      const response = await authFetch(`${BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const data = await response.json();

      
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const updateUserEmail = async (userId: string, emailData: UpdateEmailData) => {
    try {
      const response = await authFetch(`${BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user email');
      }

      const data = await response.json();

      
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return data;
    } catch (error) {
      console.error('Update user email error:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await authFetch(`${BASE_URL}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }


      
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        clearAllTokens();
        localStorage.removeItem('user');
        localStorage.removeItem('currentOrganizationId'); 

      }
      
      return {};
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  };

  const getCurrentUser = (): User | null => {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      
      const userString = localStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString) as User;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  const isAuthenticated = (): boolean => {
    // Check if we're running in the browser
    if (typeof window === 'undefined') {
      return false;
    }
    
    const user = getCurrentUser();
    const hasTokens = hasValidTokens();
    return !!(hasTokens && user);
  };

  const value: AuthContextType = {
    register,
    login,
    logout,
    getAllUsers,
    getUserById,
    updateUser,
    updateUserEmail,
    deleteUser,
    getCurrentUser,
    isAuthenticated,
  };

  return (
    
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;