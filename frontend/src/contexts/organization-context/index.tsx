"use client";
import React, { createContext, useContext } from 'react';
import { authFetch } from '@/utils/authFetch';

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000');

interface OrganizationSettings {
  allowInvites: boolean;
  requireEmailVerification: boolean;
  defaultRole: string;
  features: {
    timeTracking: boolean;
    customFields: boolean;
    automation: boolean;
    integrations: boolean;
  };
}

interface CreateOrganizationData {
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  settings?: OrganizationSettings;
}

interface OrganizationContextType {
  getOrganizationsByUser: (userId: string) => Promise<any>;
  createOrganization: (organizationData: CreateOrganizationData) => Promise<any>;
}

export const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const getCurrentUser = () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  const getOrganizationsByUser = async (userId: string) => {
    try {
      const response = await authFetch(`${BASE_URL}/organization-members/user/${userId}/organizations`);

      if (!response.ok) {
        throw new Error('Failed to get organizations by user');
      }

      const data = await response.json();
      // console.log('User organizations fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Get organizations by user error:', error);
      throw error;
    }
  };

  const createOrganization = async (organizationData: CreateOrganizationData) => {
    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated or user ID not found');
      }

      // Generate slug from name if not provided
      const slug = organizationData.slug || organizationData.name.toLowerCase().replace(/\s+/g, '-');

      // Default settings if not provided
      const defaultSettings: OrganizationSettings = {
        allowInvites: true,
        requireEmailVerification: false,
        defaultRole: "MEMBER",
        features: {
          timeTracking: true,
          customFields: true,
          automation: true,
          integrations: true
        }
      };

      const finalOrganizationData = {
        name: organizationData.name,
        slug: slug,
        description: organizationData.description || "",
        website: organizationData.website || "",
        ownerId: currentUser.id,
        settings: organizationData.settings || defaultSettings,
      };



      const response = await authFetch(`${BASE_URL}/organizations`, {
        method: 'POST',
        body: JSON.stringify(finalOrganizationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create organization');
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Create organization error:', error);
      throw error;
    }
  };

  const value: OrganizationContextType = {
    getOrganizationsByUser,
    createOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export default OrganizationProvider;