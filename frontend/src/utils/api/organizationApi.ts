
import api from '@/lib/api';
import { authApi } from './authApi';

export interface OrganizationSettings {
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

export interface CreateOrganizationData {
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  settings?: OrganizationSettings;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  ownerId: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    workspaces: number;
  };
  userRole?: string;
  joinedAt?: string;
  isOwner?: boolean;
}

export interface OrganizationResponse {
  organizations?: Organization[];
  data?: Organization[];
  organization?: Organization | Organization[];
}

export const organizationApi = {
  getOrganizationsByUser: async (userId: string): Promise<Organization[]> => {
    try {
      console.log('Fetching organizations for user:', userId);
      
      const response = await api.get<OrganizationResponse>(
        `/organization-members/user/${userId}/organizations`
      );
      
      console.log('Organizations response:', response.data);
      
      // Handle different response structures
      let organizationsArray: Organization[] = [];
      
      if (Array.isArray(response.data)) {
        organizationsArray = response.data;
      } else if (response.data && Array.isArray(response.data.organizations)) {
        organizationsArray = response.data.organizations;
      } else if (response.data && Array.isArray(response.data.data)) {
        organizationsArray = response.data.data;
      } else if (response.data && response.data.organization) {
        organizationsArray = Array.isArray(response.data.organization) 
          ? response.data.organization 
          : [response.data.organization];
      } else {
        organizationsArray = [];
      }
      
      return organizationsArray;
    } catch (error) {
      console.error('Get organizations by user error:', error);
      throw error;
    }
  },

  createOrganization: async (organizationData: CreateOrganizationData): Promise<Organization> => {
    try {
      const currentUser = authApi.getCurrentUser();
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated or user ID not found');
      }

      console.log('Creating organization with data:', organizationData);

      // Generate slug from name if not provided
      const slug = organizationData.slug || 
        organizationData.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .trim();

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
        name: organizationData.name.trim(),
        slug: slug,
        description: organizationData.description?.trim() || "",
        website: organizationData.website?.trim() || "",
        ownerId: currentUser.id,
        settings: organizationData.settings || defaultSettings,
      };

      console.log('Final organization data:', finalOrganizationData);

      const response = await api.post<Organization>('/organizations', finalOrganizationData);
      
      console.log('Organization created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create organization error:', error);
      throw error;
    }
  },

  getOrganizationById: async (organizationId: string): Promise<Organization> => {
    try {
      const response = await api.get<Organization>(`/organizations/${organizationId}`);
      return response.data;
    } catch (error) {
      console.error('Get organization by ID error:', error);
      throw error;
    }
  },

  updateOrganization: async (
    organizationId: string, 
    updateData: Partial<CreateOrganizationData>
  ): Promise<Organization> => {
    try {
      const response = await api.patch<Organization>(
        `/organizations/${organizationId}`, 
        updateData
      );
      return response.data;
    } catch (error) {
      console.error('Update organization error:', error);
      throw error;
    }
  },

  deleteOrganization: async (organizationId: string): Promise<void> => {
    try {
      await api.delete(`/organizations/${organizationId}`);
    } catch (error) {
      console.error('Delete organization error:', error);
      throw error;
    }
  },

  // Helper function to get current organization from localStorage
  getCurrentOrganization: (): Organization | null => {
    try {
      if (typeof window === 'undefined') return null;
      
      const currentOrgId = localStorage.getItem('currentOrganizationId');
      if (!currentOrgId) return null;
      
      // You might want to cache organizations or fetch from API
      // For now, return null and let the component handle the fetch
      return null;
    } catch (error) {
      console.error('Error getting current organization:', error);
      return null;
    }
  }
};
