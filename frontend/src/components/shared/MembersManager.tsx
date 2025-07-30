"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalFetchPrevention } from "@/hooks/useGlobalFetchPrevention";
import UserAvatar from "@/components/ui/avatars/UserAvatar";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle,
  Button, 

  
  Modal,
  EmptyState 
} from "@/components/ui";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Input } from "../ui/input";
import { Badge } from "@/components/ui/badge";
import {
  HiPlus,
  HiTrash,
  HiX,
  HiMail,
  HiUserAdd,
  HiCheck,
} from "react-icons/hi";
import '@/styles/members.css';

// Types
export interface Member {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface OrganizationMember {
  id: string;
  role: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface MemberRole {
  value: string;
  label: string;
  variant: "default" | "success" | "warning" | "info" | "secondary";
}

interface MembersManagerProps {
  type: "workspace" | "project";
  entityId: string; // workspaceId or projectId
  organizationId: string;
  workspaceId?: string; // For project type, pass the workspace ID
  className?: string;
  title?: string;
}

const MembersManagerComponent = memo(function MembersManager({
  type,
  entityId,
  organizationId,
  workspaceId,
  className = "",
  title,
}: MembersManagerProps) {
  // Early return if we've already processed this exact configuration
  const componentKey = `${type}-${entityId}-${organizationId}`;
  const [members, setMembers] = useState<Member[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<
    OrganizationMember[]
  >([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrgMembers, setIsLoadingOrgMembers] = useState(false);
  const [isLoadingWorkspaceMembers, setIsLoadingWorkspaceMembers] = useState(false);
  const [orgMembersLoaded, setOrgMembersLoaded] = useState(false);
  const [workspaceMembersLoaded, setWorkspaceMembersLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(type === "workspace" ? "MEMBER" : "DEVELOPER");
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Use refs to track the last fetch params to prevent duplicate calls
  const lastFetchParamsRef = useRef<string>('');
  const mountedRef = useRef(true);

  const {
    shouldPreventFetch,
    markFetchStart,
    markFetchComplete,
    markFetchError,
    getCachedData,
    reset
  } = useGlobalFetchPrevention();

  // Contexts
  const projectContext = useProjectContext();
  const workspaceContext = useWorkspaceContext();
  const { getCurrentUser } = useAuth();

  // Role definitions
  const workspaceRoles: MemberRole[] = [
    { value: "ADMIN", label: "Admin", variant: "secondary" },
    { value: "MANAGER", label: "Manager", variant: "default" },
    { value: "MEMBER", label: "Member", variant: "default" },
    { value: "VIEWER", label: "Viewer", variant: "secondary" },
  ];

  const projectRoles: MemberRole[] = [
    { value: "ADMIN", label: "Admin", variant: "secondary" },
    { value: "DEVELOPER", label: "Developer", variant: "default" },
    { value: "MANAGER", label: "Manager", variant: "default" },
    { value: "VIEWER", label: "Viewer", variant: "secondary" },
  ];

  const roles = type === "workspace" ? workspaceRoles : projectRoles;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "secondary";
      case "DEVELOPER":
      case "MANAGER":
      case "MEMBER":
        return "default";
      case "VIEWER":
        return "secondary";
      default:
        return "default";
    }
  };

  const fetchMembers = async () => {
    // Create a unique key for this fetch request
    const fetchKey = `${type}-${entityId}-${organizationId}`;
    
    // Use the hook to check if we should prevent this fetch
    if (shouldPreventFetch(fetchKey)) {
      return;
    }
    
    // Check if we have cached data first
    const cachedData = getCachedData(fetchKey);
    if (cachedData) {
      // console.log('🎯 Using cached members data for:', fetchKey);
      setMembers(cachedData);
      setIsLoading(false);
      setIsFetchingMembers(false);
      return;
    }
    
    if (!entityId || !mountedRef.current) {
      // console.log('⏭️ Members fetch conditions not met, skipping:', { 
      //   entityId: !!entityId,
      //   mounted: mountedRef.current
      // });
      return;
    }

    try {
      markFetchStart(fetchKey);
      setIsFetchingMembers(true);
      setIsLoading(true);
      lastFetchParamsRef.current = fetchKey;

      // console.log(`🔍 Fetching ${type} members for entityId:`, entityId);

      let membersData;
      if (type === "workspace") {
        membersData = await workspaceContext.getWorkspaceMembers?.(entityId) || [];
      } else {
        membersData = await projectContext.getProjectMembers(entityId);
      }

      if (mountedRef.current) {
        setMembers(membersData || []);
        setHasInitialized(true);
        markFetchComplete(fetchKey, membersData);
        // console.log(`✅ ${type} members fetched:`, { count: membersData?.length || 0 });
      }
    } catch (error: any) {
      console.error(`Error fetching ${type} members:`, error);
      markFetchError(fetchKey);
      if (mountedRef.current) {
        const errorMessage = error?.message || `Failed to load ${type} members`;
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsFetchingMembers(false);
      }
    }
  };

  const fetchOrganizationMembers = async () => {
    if (orgMembersLoaded || isLoadingOrgMembers) {
      // console.log('⏭️ Organization members already loaded or loading, skipping');
      return;
    }

    try {
      setIsLoadingOrgMembers(true);

      // console.log('🔍 Fetching organization members for organizationId:', organizationId);
      const orgMembersData = await projectContext.getOrganizationMembers(organizationId);
      
      setOrganizationMembers(orgMembersData || []);
      setOrgMembersLoaded(true);
      // console.log('✅ Organization members fetched:', { count: orgMembersData?.length || 0 });
    } catch (error: any) {
      console.error('Error fetching organization members:', error);
      const errorMessage = error?.message || 'Failed to load organization members';
      setError(errorMessage);
    } finally {
      setIsLoadingOrgMembers(false);
    }
  };

  const fetchWorkspaceMembers = async () => {
    if (workspaceMembersLoaded || isLoadingWorkspaceMembers) {
      // console.log('⏭️ Workspace members already loaded or loading, skipping');
      return;
    }

    try {
      setIsLoadingWorkspaceMembers(true);

      // Determine workspace ID based on type
      let targetWorkspaceId = '';
      
      if (type === 'project') {
        // For project type, use the passed workspaceId prop
        targetWorkspaceId = workspaceId || '';
      } else {
        // For workspace type, entityId is already the workspace ID
        targetWorkspaceId = entityId;
      }

      if (!targetWorkspaceId) {
        console.error('Could not determine workspace ID for fetching workspace members');
        return;
      }

      // console.log('🔍 Fetching workspace members for workspaceId:', targetWorkspaceId);
      const workspaceMembersData = await workspaceContext.getWorkspaceMembers?.(targetWorkspaceId) || [];
      
      // Transform workspace members to match Member interface
      const transformedMembers: Member[] = workspaceMembersData.map((wsMember: any) => ({
        id: wsMember.id,
        role: wsMember.role,
        userId: wsMember.userId || wsMember.user?.id || '',
        user: {
          id: wsMember.user?.id || wsMember.userId || '',
          firstName: wsMember.user?.firstName || '',
          lastName: wsMember.user?.lastName || '',
          email: wsMember.user?.email || '',
          avatar: wsMember.user?.avatar || undefined,
        }
      }));
      
      setWorkspaceMembers(transformedMembers);
      setWorkspaceMembersLoaded(true);
      // console.log('✅ Workspace members fetched:', { count: transformedMembers?.length || 0 });
    } catch (error: any) {
      console.error('Error fetching workspace members:', error);
      const errorMessage = error?.message || 'Failed to load workspace members';
      setError(errorMessage);
    } finally {
      setIsLoadingWorkspaceMembers(false);
    }
  };

  // Single useEffect to handle all initialization and updates with debouncing
  useEffect(() => {
    mountedRef.current = true;
    
    // Add more detailed conditions to prevent unnecessary calls
    if (!entityId || !organizationId || isFetchingMembers) {
      // console.log('⏭️ MembersManager useEffect skipped:', { 
      //   entityId: !!entityId, 
      //   organizationId: !!organizationId, 
      //   isFetchingMembers,
      //   type 
      // });
      return;
    }
    
    // console.log(`🔄 MembersManager useEffect triggered for ${type}:`, { entityId, organizationId });
    
    // Debounce the fetch call to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        fetchMembers();
      }
    }, 50); // 50ms debounce
    
    // Cleanup function to reset state when component unmounts or dependencies change
    return () => {
      clearTimeout(timeoutId);
      if (isFetchingMembers) {
        // console.log('🧹 MembersManager cleanup: resetting fetch state');
        setIsFetchingMembers(false);
      }
      // Don't clear lastFetchParamsRef here as it would allow duplicates on re-renders
    };
  }, [entityId, organizationId, type]);

  // Separate mount/unmount effect
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      // console.log('🧹 MembersManager unmounting, clearing fetch params');
      const fetchKey = `${type}-${entityId}-${organizationId}`;
      reset(fetchKey);
      lastFetchParamsRef.current = '';
      setHasInitialized(false);
    };
  }, [reset, type, entityId, organizationId]);

  const handleAddMember = async (userId: string) => {
    try {
      if (type === "workspace") {
        const memberData = {
          userId,
          workspaceId: entityId,
          role: selectedRole as any, // Type cast to handle different role types
        };
        await workspaceContext.addMemberToWorkspace?.(memberData);
      } else {
        const memberData = {
          userId,
          projectId: entityId,
          role: selectedRole,
        };
        await projectContext.addMemberToProject(memberData);
      }

      await fetchMembers();
      setShowAddModal(false);
      setSelectedRole(type === "workspace" ? "MEMBER" : "DEVELOPER");
      setError(null);
    } catch (error: any) {
      console.error(`Error adding ${type} member:`, error);
      const errorMessage = error?.message || `Failed to add ${type} member`;
      setError(errorMessage);
    }
  };

  const handleInviteMember = async () => {
    try {
      if (!inviteEmail.trim()) return;

      if (type === "workspace") {
        const inviteData = {
          email: inviteEmail.trim(),
          workspaceId: entityId,
          role: selectedRole as any, // Type cast to handle different role types
        };
        await workspaceContext.inviteMemberToWorkspace?.(inviteData);
      } else {
        const inviteData = {
          email: inviteEmail.trim(),
          projectId: entityId,
          role: selectedRole,
        };
        await projectContext.inviteMemberToProject(inviteData);
      }

      await fetchMembers();
      setShowInviteModal(false);
      setInviteEmail("");
      setSelectedRole(type === "workspace" ? "MEMBER" : "DEVELOPER");
      setError(null);
    } catch (error: any) {
      console.error(`Error inviting ${type} member:`, error);
      const errorMessage = error?.message || `Failed to invite ${type} member`;
      setError(errorMessage);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) return;

      if (type === "workspace") {
        await workspaceContext.removeMemberFromWorkspace?.(memberId, currentUser.id);
      } else {
        await projectContext.removeProjectMember(memberId, currentUser.id);
      }

      await fetchMembers();
      setError(null);
    } catch (error: any) {
      console.error(`Error removing ${type} member:`, error);
      const errorMessage = error?.message || `Failed to remove ${type} member`;
      setError(errorMessage);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) return;

      if (type === "workspace") {
        await workspaceContext.updateMemberRole?.(memberId, { role: newRole as any }, currentUser.id);
      } else {
        await projectContext.updateProjectMemberRole(memberId, currentUser.id, newRole);
      }

      await fetchMembers();
      setEditingMember(null);
      setError(null);
    } catch (error: any) {
      console.error(`Error updating ${type} member role:`, error);
      const errorMessage = error?.message || `Failed to update ${type} member role`;
      setError(errorMessage);
    }
  };

  const getAvailableOrgMembers = () => {
    const memberUserIds = members.map((member) => member.userId);
    return organizationMembers.filter(
      (orgMember) => !memberUserIds.includes(orgMember.user.id)
    );
  };

  const getAvailableWorkspaceMembers = () => {
    const memberUserIds = members.map((member) => member.userId);
    return workspaceMembers.filter(
      (wsMember) => !memberUserIds.includes(wsMember.userId)
    );
  };

  // Determine which members to show based on type
  const getAvailableMembers = () => {
    if (type === 'project') {
      // For projects, show workspace members
      return getAvailableWorkspaceMembers();
    } else {
      // For workspaces, show organization members
      return getAvailableOrgMembers();
    }
  };

  const isLoadingMembers = type === 'project' ? isLoadingWorkspaceMembers : isLoadingOrgMembers;
  const membersLoaded = type === 'project' ? workspaceMembersLoaded : orgMembersLoaded;

  const displayTitle = title || `${type === "workspace" ? "Workspace" : "Project"} Members`;

  if (isLoading) {
    return (
      <Card className={`members-skeleton ${className}`}>
        <div className="members-skeleton-content">
          <div className="members-skeleton-title"></div>
          <div className="members-skeleton-items">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="members-skeleton-item">
                <div className="members-skeleton-avatar"></div>
                <div className="members-skeleton-text">
                  <div className="members-skeleton-line w-3/4"></div>
                  <div className="members-skeleton-line-short"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={`members-card ${className}`}>
        <CardHeader className="members-header">
          <CardTitle className="members-title">
            {displayTitle} ({members.length})
          </CardTitle>
          <div className="members-actions">
            <Button
              onClick={() => {
                setSelectedRole(type === "workspace" ? "MEMBER" : "DEVELOPER");
                setShowInviteModal(true);
              }}
              className="flex items-center gap-1"
              size="sm"
              variant="secondary"
            >
              <HiMail size={12} />
              <span>Invite</span>
            </Button>
            <Button
              onClick={() => {
                setShowAddModal(true);
                if (type === 'project') {
                  fetchWorkspaceMembers();
                } else {
                  fetchOrganizationMembers();
                }
              }}
              className="flex items-center gap-1"
              size="sm"
              variant="secondary"

            >
              <HiPlus size={12} />
              <span>Add</span>
            </Button>
          </div>
        </CardHeader>

        {error && (
          <div className="members-error">
            <div className="members-error-content">
              <p className="members-error-text">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-error/60 hover:text-error ml-2"
                title="Dismiss error"
              >
                <HiX size={16} />
              </button>
            </div>
          </div>
        )}

        <CardContent>
          {members.length === 0 ? (
            <EmptyState
              icon={<HiUserAdd size={20} />}
              title="No members yet"
              description={`Add members to start collaborating on this ${type}.`}
            />
          ) : (
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <UserAvatar
                      user={{
                        firstName: member.user.firstName,
                        lastName: member.user.lastName,
                        avatar: member.user.avatar,
                      }}
                      size="sm"
                    />
                    <div>
                      <div className="member-name">
                        {member.user.firstName} {member.user.lastName}
                      </div>
                      <div className="member-email">
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="member-actions">
                    {editingMember === member.id ? (
                      <div className="member-role-editor">
                        <Select value={member.role} onValueChange={(value) => handleUpdateRole(member.id, value)}>
                          <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent className="bg-background text-foreground">
                            {roles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => setEditingMember(null)}
                          className="text-muted hover:text-secondary-600 dark:hover:text-secondary-300 p-1"
                        >
                          <HiX size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingMember(member.id)}
                          className="text-muted hover:text-secondary-600 dark:hover:text-secondary-300 p-1"
                        >
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-error hover:text-error/80 p-1"
                          title="Remove member"
                        >
                          <HiTrash size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add Member to ${type === "workspace" ? "Workspace" : "Project"}`}
      >
        <div className="modal-content">
          <div className="modal-field">
            <label className="modal-label">Role</label>
            <div className="w-32">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground">
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">
              {type === 'project' ? 'Workspace Members' : 'Organization Members'}
            </label>
            {isLoadingMembers ? (
              <div className="modal-org-members">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 animate-pulse">
                      <div className="h-8 w-8 bg-stone-200 dark:bg-stone-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-3/4"></div>
                        <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 w-12 bg-stone-200 dark:bg-stone-700 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="modal-org-members">
                {getAvailableMembers().map((member: any) => (
                  <div key={member.id} className="modal-org-member">
                    <div className="member-info">
                      <UserAvatar
                        user={{
                          firstName: member.user?.firstName || member.firstName,
                          lastName: member.user?.lastName || member.lastName,
                          avatar: member.user?.avatar || member.avatar,
                        }}
                        size="sm"
                      />
                      <div>
                        <div className="member-name">
                          {(member.user?.firstName || member.firstName)} {(member.user?.lastName || member.lastName)}
                        </div>
                        <div className="member-email">
                          {member.user?.email || member.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddMember(member.user?.id || member.userId)}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                ))}
                {getAvailableMembers().length === 0 && membersLoaded && (
                  <div className="text-center py-8 px-4">
                    <div className="mb-3">
                      <HiUserAdd size={24} className="mx-auto text-stone-400 dark:text-stone-500" />
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 font-medium">
                      All {type === 'project' ? 'workspace' : 'organization'} members are already part of this {type}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                      Use the "Invite" button to invite new members via email
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedRole(type === "workspace" ? "MEMBER" : "DEVELOPER");
          setInviteEmail("");
        }}
        title="Invite Member via Email"
      >
        <div className="modal-content">
          <div className="modal-field">
            <label className="modal-label">
              Email Address
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">
              Role
            </label>
            <div className="w-32">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground">
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowInviteModal(false);
                setSelectedRole(type === "workspace" ? "MEMBER" : "DEVELOPER");
                setInviteEmail("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteEmail.trim()}
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
});

MembersManagerComponent.displayName = 'MembersManager';

export default MembersManagerComponent;
