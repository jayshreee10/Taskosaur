"use client";

import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalFetchPrevention } from "@/hooks/useGlobalFetchPrevention";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/ui/avatars/UserAvatar";
import { HiPlus } from "react-icons/hi2";
import { HiTrash } from "react-icons/hi2";
import { HiMail } from "react-icons/hi2";
import { HiUserPlus } from "react-icons/hi2";
import { HiChevronDown } from "react-icons/hi2";
import { HiEllipsisVertical } from "react-icons/hi2";
import { HiCheck } from "react-icons/hi2";
import { HiUsers } from "react-icons/hi2";

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
  entityId: string;
  organizationId: string;
  workspaceId?: string;
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
  const [members, setMembers] = useState<Member[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
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

  const projectContext = useProjectContext();
  const workspaceContext = useWorkspaceContext();
  const { getCurrentUser } = useAuth();

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

  const getRoleLabel = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  const fetchMembers = useCallback(async () => {
    const fetchKey = `${type}-${entityId}-${organizationId}`;
    
    if (shouldPreventFetch(fetchKey)) return;
    
    const cachedData = getCachedData(fetchKey);
    if (cachedData) {
      setMembers(cachedData);
      setIsLoading(false);
      setIsFetchingMembers(false);
      return;
    }
    
    if (!entityId || !mountedRef.current) return;

    try {
      markFetchStart(fetchKey);
      setIsFetchingMembers(true);
      setIsLoading(true);
      lastFetchParamsRef.current = fetchKey;

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
      }
    } catch (error: any) {
      markFetchError(fetchKey);
      if (mountedRef.current) {
        setError(error?.message || `Failed to load ${type} members`);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsFetchingMembers(false);
      }
    }
  }, [type, entityId, organizationId, shouldPreventFetch, getCachedData, markFetchStart, markFetchComplete, markFetchError, workspaceContext, projectContext]);

  const fetchOrganizationMembers = useCallback(async () => {
    if (orgMembersLoaded || isLoadingOrgMembers) return;

    try {
      setIsLoadingOrgMembers(true);
      const orgMembersData = await projectContext.getOrganizationMembers(organizationId);
      setOrganizationMembers(orgMembersData || []);
      setOrgMembersLoaded(true);
    } catch (error: any) {
      setError(error?.message || 'Failed to load organization members');
    } finally {
      setIsLoadingOrgMembers(false);
    }
  }, [orgMembersLoaded, isLoadingOrgMembers, organizationId, projectContext]);

  const fetchWorkspaceMembers = useCallback(async () => {
    if (workspaceMembersLoaded || isLoadingWorkspaceMembers) return;

    try {
      setIsLoadingWorkspaceMembers(true);
      
      let targetWorkspaceId = '';
      if (type === 'project') {
        targetWorkspaceId = workspaceId || '';
      } else {
        targetWorkspaceId = entityId;
      }

      if (!targetWorkspaceId) return;

      const workspaceMembersData = await workspaceContext.getWorkspaceMembers?.(targetWorkspaceId) || [];
      
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
    } catch (error: any) {
      setError(error?.message || 'Failed to load workspace members');
    } finally {
      setIsLoadingWorkspaceMembers(false);
    }
  }, [workspaceMembersLoaded, isLoadingWorkspaceMembers, type, workspaceId, entityId, workspaceContext]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!entityId || !organizationId || isFetchingMembers) return;
    
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        fetchMembers();
      }
    }, 50);
    
    return () => {
      clearTimeout(timeoutId);
      if (isFetchingMembers) {
        setIsFetchingMembers(false);
      }
    };
  }, [entityId, organizationId, type, fetchMembers, isFetchingMembers]);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
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
          role: selectedRole as any,
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
      setError(error?.message || `Failed to add ${type} member`);
    }
  };

  const handleInviteMember = async () => {
    try {
      if (!inviteEmail.trim()) return;

      if (type === "workspace") {
        const inviteData = {
          email: inviteEmail.trim(),
          workspaceId: entityId,
          role: selectedRole as any,
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
      setError(error?.message || `Failed to invite ${type} member`);
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
      setError(error?.message || `Failed to remove ${type} member`);
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
      setError(error?.message || `Failed to update ${type} member role`);
    }
  };

  const getAvailableMembers = () => {
    const memberUserIds = members.map((member) => member.userId);
    
    if (type === 'project') {
      return workspaceMembers.filter(
        (wsMember) => !memberUserIds.includes(wsMember.userId)
      );
    } else {
      return organizationMembers.filter(
        (orgMember) => !memberUserIds.includes(orgMember.user.id)
      );
    }
  };


  const isLoadingMembers = type === 'project' ? isLoadingWorkspaceMembers : isLoadingOrgMembers;
  const membersLoaded = type === 'project' ? workspaceMembersLoaded : orgMembersLoaded;

  const displayTitle = title || `${type === "workspace" ? "Workspace" : "Project"} Members`;

  if (isLoading) {
    return (
      <Card className={`border-border bg-card ${className}`}>
        <div className="p-6">
          <div className="h-6 bg-muted rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
                <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`border-border bg-card ${className}`}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <HiUsers className="w-5 h-5 text-muted-foreground" />
              {displayTitle}
            </CardTitle>
          
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-border text-foreground hover:bg-accent"
                >
                  {/* <HiMail className="w-4 h-4 mr-2" /> */}
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">Invite Member via Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="border-input bg-background text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="border-input bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail("");
                      setSelectedRole(type === "workspace" ? "MEMBER" : "DEVELOPER");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInviteMember} 
                    disabled={!inviteEmail.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Send Invite
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button 
                variant={"outline"}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {
                    if (type === 'project') {
                      fetchWorkspaceMembers();
                    } else {
                      fetchOrganizationMembers();
                    }
                  }}
                >
                  <HiPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">
                    Add Member to {type === "workspace" ? "Workspace" : "Project"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="border-input bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">
                      {type === 'project' ? 'Workspace Members' : 'Organization Members'}
                    </Label>
                    {isLoadingMembers ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-3 p-3 border border-border rounded-lg animate-pulse">
                            <div className="h-8 w-8 bg-muted rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                            <div className="h-6 w-12 bg-muted rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {getAvailableMembers().map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-accent/50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <UserAvatar
                                user={{
                                  firstName: member.user?.firstName || member.firstName,
                                  lastName: member.user?.lastName || member.lastName,
                                  avatar: member.user?.avatar || member.avatar,
                                }}
                                size="sm"
                              />
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {(member.user?.firstName || member.firstName)} {(member.user?.lastName || member.lastName)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {member.user?.email || member.email}
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAddMember(member.user?.id || member.userId)}
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground hover:bg-accent"
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                        {getAvailableMembers().length === 0 && membersLoaded && (
                          <div className="text-center py-8 px-4">
                            {/* <HiUserAdd className="w-8 h-8 mx-auto text-muted-foreground mb-3" /> */}
                            <p className="text-sm text-muted-foreground font-medium">
                              All {type === 'project' ? 'workspace' : 'organization'} members are already part of this {type}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Use the "Invite" button to invite new members via email
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Members List */}
      <CardContent className="pt-0">
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <HiUserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No members yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add members to start collaborating on this {type}.
              </p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    user={{
                      firstName: member.user.firstName,
                      lastName: member.user.lastName,
                      avatar: member.user.avatar,
                    }}
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {member.user.firstName} {member.user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.user.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-border text-foreground hover:bg-accent"
                      >
                        {getRoleLabel(member.role)}
                        <HiChevronDown className="w-3 h-3 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="border-border bg-popover">
                      {roles.map((role) => (
                        <DropdownMenuItem
                          key={role.value}
                          onClick={() => handleUpdateRole(member.id, role.value)}
                          className="text-popover-foreground hover:bg-accent"
                        >
                          <div className="flex items-center justify-between w-full">
                            {role.label}
                            {member.role === role.value && (
                              <HiCheck className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <HiTrash className="w-4 h-4 mr-2" />
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MembersManagerComponent.displayName = 'MembersManager';

export default MembersManagerComponent;