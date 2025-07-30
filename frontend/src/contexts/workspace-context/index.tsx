"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authFetch } from '../../utils/authFetch';

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000');

type WorkspaceRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

interface WorkspaceData {
  name: string;
  description?: string;
  color?: string;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AddMemberToWorkspaceData {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

interface InviteMemberToWorkspaceData {
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
}

interface UpdateMemberRoleData {
  role: WorkspaceRole;
}

interface WorkspaceStats {
  totalMembers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  // Add other stats properties as needed
}

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceContextType {
  createWorkspace: (workspaceData: WorkspaceData) => Promise<any>;
  getWorkspaces: () => Promise<any>;
  getWorkspacesByOrganization: (organizationId?: string) => Promise<any>;
  getWorkspaceById: (workspaceId: string) => Promise<any>;
  getWorkspaceBySlug: (slug: string, organizationId?: string) => Promise<any>;
  updateWorkspace: (workspaceId: string, workspaceData: WorkspaceData) => Promise<any>;
  deleteWorkspace: (workspaceId: string) => Promise<any>;
  // Workspace member APIs
  getWorkspaceMembers: (workspaceId: string) => Promise<WorkspaceMember[]>;
  addMemberToWorkspace: (memberData: AddMemberToWorkspaceData) => Promise<WorkspaceMember>;
  inviteMemberToWorkspace: (inviteData: InviteMemberToWorkspaceData) => Promise<any>;
  updateMemberRole: (memberId: string, updateData: UpdateMemberRoleData, requestUserId: string) => Promise<WorkspaceMember>;
  removeMemberFromWorkspace: (memberId: string, requestUserId: string) => Promise<{ success: boolean }>;
  getWorkspaceStats: (workspaceId: string) => Promise<WorkspaceStats>;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  // Add caching state
  const [workspacesCache, setWorkspacesCache] = useState<any[]>([]);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const [isCacheValid, setIsCacheValid] = useState(false);
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;
  
  const getOrganizationId = () => {
    if (typeof window !== 'undefined') {
      const orgId = localStorage.getItem('currentOrganizationId');
      // console.log('🏢 getOrganizationId:', {
      //   orgId,
      //   type: typeof orgId,
      //   length: orgId?.length || 0,
      //   isUUID: orgId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId) : false
      // });
      return orgId;
    }
    return null;
  };

  const createWorkspace = async (workspaceData: WorkspaceData) => {
    const ORGANIZATION_ID = getOrganizationId();
    
    const finalWorkspaceData = {
      ...workspaceData,
      slug: workspaceData.name.toLowerCase().replace(/\s+/g, '-'),
      organizationId: ORGANIZATION_ID,
    };
    
    // console.log('Final Workspace Data:', finalWorkspaceData);
    try {
      const response = await authFetch(`${BASE_URL}/workspaces`, {
        method: 'POST',
        body: JSON.stringify(finalWorkspaceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create workspace');
      }
      
      const data = await response.json();
      // console.log('Workspace created successfully:', data);
      return data;
    } catch (error) {
      console.error('Create workspace error:', error);
      throw error;
    }
  };

  const getWorkspaces = async () => {
    // Check cache
    const currentTime = Date.now();
    if (isCacheValid && workspacesCache.length > 0 && (currentTime - cacheTimestamp) < CACHE_DURATION) {
      return workspacesCache;
    }
    
    try {
      const response = await authFetch(`${BASE_URL}/workspaces`, {
        method: 'GET',
      });
      // console.log('Fetching workspaces');
      if (!response.ok) {
        throw new Error('Failed to get workspaces');
      }
      
      const data = await response.json();
      // Update cache
      setWorkspacesCache(data);
      setCacheTimestamp(Date.now());
      setIsCacheValid(true);
      
      // console.log('Workspaces fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Get workspaces error:', error);
      throw error;
    }
  };

  // Add cache for organization workspaces
  const [orgWorkspacesCache, setOrgWorkspacesCache] = useState<{[key: string]: any}>({});
  const [orgCacheTimestamp, setOrgCacheTimestamp] = useState<{[key: string]: number}>({});
  const ORG_CACHE_DURATION = 30000; // 30 seconds

  const getWorkspacesByOrganization = async (organizationId?: string) => {
    const ORGANIZATION_ID = organizationId || getOrganizationId();
    const cacheKey = `${ORGANIZATION_ID}`;
    
    // Validate organizationId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (ORGANIZATION_ID && !uuidRegex.test(ORGANIZATION_ID)) {
      console.error('❌ Invalid organizationId format:', ORGANIZATION_ID);
      console.error('Expected UUID format like: 12345678-1234-1234-1234-123456789012');
      throw new Error(`Invalid organizationId format: ${ORGANIZATION_ID}. Expected UUID format.`);
    }
    
    if (!ORGANIZATION_ID) {
      console.error('❌ No organizationId found in localStorage');
      throw new Error('No organization selected. Please select an organization first.');
    }
    
    // Check cache first
    const currentTime = Date.now();
    const cachedData = orgWorkspacesCache[cacheKey];
    const cacheTime = orgCacheTimestamp[cacheKey];
    
    if (cachedData && cacheTime && (currentTime - cacheTime) < ORG_CACHE_DURATION) {

      return cachedData;
    }
    

    
    // Debug: Check what tokens are available
    const taskosourToken = typeof window !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('taskosourtoken='))?.split('=')[1] : null;
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    
    try {
      const response = await authFetch(`${BASE_URL}/workspaces?organizationId=${ORGANIZATION_ID}`, {
        method: 'GET',
      });
      

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error details:', errorText);
        throw new Error('Failed to get workspaces by organization');
      }
      
      const data = await response.json();
      
      // Update cache
      setOrgWorkspacesCache(prev => ({ ...prev, [cacheKey]: data }));
      setOrgCacheTimestamp(prev => ({ ...prev, [cacheKey]: currentTime }));
      

      return data;
    } catch (error) {
      console.error('Get workspaces by organization error:', error);
      throw error;
    }
  };

  const getWorkspaceById = async (workspaceId: string) => {
    try {
      const response = await authFetch(`${BASE_URL}/workspaces/${workspaceId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get workspace by ID');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get workspace by ID error:', error);
      throw error;
    }
  };

  const getWorkspaceBySlug = async (slug: string, organizationId?: string) => {
    const ORGANIZATION_ID = organizationId || getOrganizationId();
    try {
      const response = await authFetch(`${BASE_URL}/workspaces/organization/${ORGANIZATION_ID}/slug/${slug}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get workspace by slug');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get workspace by slug error:', error);
      throw error;
    }
  };

  const updateWorkspace = async (workspaceId: string, workspaceData: WorkspaceData) => {
    try {
      const response = await authFetch(`${BASE_URL}/workspaces/${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify(workspaceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update workspace');
      }
      
      const data = await response.json();
      // console.log('Workspace updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Update workspace error:', error);
      throw error;
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    try {
      const response = await authFetch(`${BASE_URL}/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }
      
      // console.log('Workspace deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Delete workspace error:', error);
      throw error;
    }
  };

  // Workspace member APIs - No caching for real-time data
  const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
    try {
      // console.log('🔍 getWorkspaceMembers called for:', { workspaceId, timestamp: new Date().toISOString() });
      
      const response = await authFetch(`${BASE_URL}/workspace-members?workspaceId=${workspaceId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get workspace members');
      }
      
      const data = await response.json();
      
      // console.log('✅ Workspace members fetched successfully:', { workspaceId, count: data?.length || 0 });
      return data || [];
    } catch (error) {
      console.error('Get workspace members error:', error);
      throw error;
    }
  };

  const addMemberToWorkspace = async (memberData: AddMemberToWorkspaceData): Promise<WorkspaceMember> => {
    try {
      const response = await authFetch(`${BASE_URL}/workspace-members`, {
        method: 'POST',
        body: JSON.stringify(memberData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add member to workspace');
      }
      
      const data = await response.json();
      
      // console.log('Member added to workspace successfully:', data);
      return data;
    } catch (error) {
      console.error('Add member to workspace error:', error);
      throw error;
    }
  };

  const inviteMemberToWorkspace = async (inviteData: InviteMemberToWorkspaceData) => {
    try {
      const response = await authFetch(`${BASE_URL}/workspace-members/invite`, {
        method: 'POST',
        body: JSON.stringify(inviteData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to invite member to workspace');
      }
      
      const data = await response.json();
      
      // console.log('Member invited to workspace successfully:', data);
      return data;
    } catch (error) {
      console.error('Invite member to workspace error:', error);
      throw error;
    }
  };

  const updateMemberRole = async (memberId: string, updateData: UpdateMemberRoleData, requestUserId: string): Promise<WorkspaceMember> => {
    try {
      const response = await authFetch(`${BASE_URL}/workspace-members/${memberId}?requestUserId=${requestUserId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update member role');
      }
      
      const data = await response.json();
      
      // console.log('Member role updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Update member role error:', error);
      throw error;
    }
  };

  const removeMemberFromWorkspace = async (memberId: string, requestUserId: string): Promise<{ success: boolean }> => {
    try {
      const response = await authFetch(`${BASE_URL}/workspace-members/${memberId}?requestUserId=${requestUserId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove member from workspace');
      }
      
      // console.log('Member removed from workspace successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Remove member from workspace error:', error);
      throw error;
    }
  };

  const getWorkspaceStats = async (workspaceId: string): Promise<WorkspaceStats> => {
    try {
      const response = await authFetch(`${BASE_URL}/workspace-members/workspace/${workspaceId}/stats`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get workspace stats');
      }
      
      const data = await response.json();
      // console.log('Workspace stats fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Get workspace stats error:', error);
      throw error;
    }
  };

  const value: WorkspaceContextType = {
    createWorkspace,
    getWorkspaces,
    getWorkspacesByOrganization,
    getWorkspaceById,
    getWorkspaceBySlug,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceMembers,
    addMemberToWorkspace,
    inviteMemberToWorkspace,
    updateMemberRole,
    removeMemberFromWorkspace,
    getWorkspaceStats,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceProvider;