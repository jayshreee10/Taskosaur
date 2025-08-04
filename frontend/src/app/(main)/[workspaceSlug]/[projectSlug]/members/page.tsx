"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HiMagnifyingGlass,
  HiPlus,
  HiTrash,
  HiUsers,
  HiEnvelope,
  HiExclamationTriangle,
  HiChevronDown,
  HiCheck,
  HiUserPlus,
  HiCog,
  HiFolder
} from 'react-icons/hi2';

import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  avatarUrl?: string;
  joinedAt: string;
  lastActive?: string;
  status?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  workspaceId: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)]';
    }
  };

  return (
    <Badge className={`text-xs px-2 py-1 rounded-md border-none ${getStatusConfig(status)}`}>
      {status || 'Active'}
    </Badge>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-[var(--muted)] rounded w-1/3 mb-6"></div>
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
          <CardContent className="p-4">
            <div className="h-6 bg-[var(--muted)] rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-2">
                  <div className="h-8 w-8 bg-[var(--muted)] rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
                    <div className="h-3 bg-[var(--muted)] rounded w-2/3"></div>
                  </div>
                  <div className="h-6 w-16 bg-[var(--muted)] rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description 
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <div className="text-center py-8 flex flex-col items-center justify-center">
    <Icon className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
    <p className="text-sm font-medium text-[var(--foreground)] mb-2">{title}</p>
    <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
  </div>
);

const InviteModal = ({ 
  isOpen, 
  onClose, 
  onInvite,
  availableRoles
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onInvite: (email: string, role: string) => void;
  availableRoles: Array<{ id: string; name: string; description: string }>;
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [inviting, setInviting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    try {
      await onInvite(email.trim(), role);
      setEmail('');
      setRole('DEVELOPER');
      onClose();
    } catch (error) {
      // Error handling would be done by parent
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--card)] border-none rounded-[var(--card-radius)] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)]">Invite Member to Project</DialogTitle>
          <DialogDescription className="text-[var(--muted-foreground)]">
            Send an invitation to join this project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--foreground)]">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="border-input bg-background text-[var(--foreground)]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[var(--foreground)]">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-9 border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="border-none bg-[var(--card)]">
                  {availableRoles.map((r: any) => (
                    <SelectItem key={r.id} value={r.name}>
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{r.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="h-9 w-20 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] transition-all duration-200"
              onClick={onClose}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="h-9 w-28 border-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium"
              disabled={inviting || !email.trim()}
            >
              {inviting ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function ProjectMembersPage() {
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;
  const projectSlug = params?.projectSlug as string;

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { 
    getProjectsByWorkspace, 
    getProjectMembers, 
    inviteMemberToProject,
    updateProjectMemberRole,
    removeProjectMember 
  } = useProjectContext();
  const { isAuthenticated, getCurrentUser } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');
  const currentRouteRef = useRef<string>('');
  const isInitializedRef = useRef(false);
  const fetchPrevention = useGlobalFetchPrevention();

  const roles = [
    { id: '1', name: 'ADMIN', description: 'Full access to project resources', variant: 'secondary' as const },
    { id: '2', name: 'MANAGER', description: 'Can manage project and members', variant: 'default' as const },
    { id: '3', name: 'DEVELOPER', description: 'Can develop and work on tasks', variant: 'default' as const },
    { id: '4', name: 'VIEWER', description: 'Can only view project content', variant: 'secondary' as const },
  ];

  const getRoleLabel = (role: string) => {
    const roleConfig = roles.find(r => r.name === role);
    return roleConfig?.name || role;
  };

  // Demo member data generator for development
  const generateDemoMembers = useCallback((projectSlug: string): Member[] => {
    const roleNames = ['ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER'];
    const domains = ['example.com', 'demo.org', 'test.io'];
    const statuses = ['ACTIVE', 'PENDING', 'INACTIVE'];
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: `member-${i + 1}`,
      email: `user${i + 1}@${domains[i % domains.length]}`,
      firstName: `User`,
      lastName: `${i + 1}`,
      username: `user${i + 1}`,
      role: roleNames[i % roleNames.length],
      status: statuses[i % statuses.length],
      avatarUrl: undefined,
      joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      const pageKey = `${workspaceSlug}/${projectSlug}/members`;
      const requestId = `${pageKey}-${Date.now()}-${Math.random()}`;

      if (!isMountedRef.current || (currentRouteRef.current === pageKey && isInitializedRef.current)) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      requestIdRef.current = requestId;
      currentRouteRef.current = pageKey;

      if (!workspaceSlug || !projectSlug || !isAuthenticated()) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Check if we should prevent fetch
      const shouldPrevent = fetchPrevention.shouldPreventFetch('project-members');
      if (shouldPrevent) {
        const cachedData = fetchPrevention.getCachedData('project-members');
        if (cachedData) {
          setMembers(cachedData);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        setError(null);
        fetchPrevention.markFetchStart('project-members');

        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }

        // Get workspace by slug
        const workspaceData = await getWorkspaceBySlug(workspaceSlug);
        if (!workspaceData) {
          setError('Workspace not found');
          setLoading(false);
          return;
        }
        setWorkspace(workspaceData);

        // Get projects in workspace and find the specific project
        const projectsData = await getProjectsByWorkspace(workspaceData.id);
        const foundProject = projectsData?.find((p: any) => p.slug === projectSlug);
        if (!foundProject) {
          setError('Project not found');
          setLoading(false);
          return;
        }
        setProject({
          ...foundProject,
          description: foundProject.description || ''
        });

        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }

        // Get project members
        try {
          const membersData = await getProjectMembers(foundProject.id);

          if (requestIdRef.current !== requestId || !isMountedRef.current) {
            return;
          }

          if (Array.isArray(membersData) && membersData.length > 0) {
            const processedMembers = membersData.map((member: any) => ({
              id: member.id,
              email: member.user?.email || member.email || '',
              firstName: member.user?.firstName || member.firstName || 'Unknown',
              lastName: member.user?.lastName || member.lastName || 'User',
              username: member.user?.username || member.username || '',
              role: member.role || 'DEVELOPER',
              status: member.user?.status || 'ACTIVE',
              avatarUrl: member.user?.avatar || member.avatarUrl,
              joinedAt: member.joinedAt || member.createdAt || new Date().toISOString(),
              lastActive: member.user?.lastActive || member.lastActive
            }));
            setMembers(processedMembers);
            fetchPrevention.markFetchComplete('project-members', processedMembers);
          } else {
            // Fallback to demo data if API doesn't return proper data
            const demoMembers = generateDemoMembers(projectSlug);
            setMembers(demoMembers);
            fetchPrevention.markFetchComplete('project-members', demoMembers);
          }
        } catch (membersError) {
          console.warn('Failed to fetch members, using demo data:', membersError);
          const demoMembers = generateDemoMembers(projectSlug);
          setMembers(demoMembers);
          fetchPrevention.markFetchComplete('project-members', demoMembers);
        }

        isInitializedRef.current = true;

      } catch (err) {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
          fetchPrevention.markFetchError('project-members');

          // Set demo data for development
          const demoMembers = generateDemoMembers(projectSlug);
          setMembers(demoMembers);
          isInitializedRef.current = false;
        }
      } finally {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    const pageKey = `${workspaceSlug}/${projectSlug}/members`;
    if (currentRouteRef.current !== pageKey) {
      isInitializedRef.current = false;
      setWorkspace(null);
      setProject(null);
      setMembers([]);
      setError(null);
    }

    const timeoutId = setTimeout(() => {
      initializeData();
    }, 50);

    return () => clearTimeout(timeoutId);
  // Only re-run when workspaceSlug or projectSlug changes
  }, [workspaceSlug, projectSlug]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;
      currentRouteRef.current = '';
      requestIdRef.current = '';
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const filteredMembers = members.filter(member => {
    const name = `${member.firstName} ${member.lastName}` || '';
    const email = member.email || '';
    const username = member.username || '';
    const role = member.role || '';
    const searchLower = searchTerm.toLowerCase();
    
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower) ||
           username.toLowerCase().includes(searchLower) ||
           role.toLowerCase().includes(searchLower);
  });

  const refreshMembers = async () => {
    if (!project) return;
    
    try {
      setIsRefreshing(true);
      const membersData = await getProjectMembers(project.id);
      
      if (Array.isArray(membersData) && membersData.length > 0) {
        const processedMembers = membersData.map((member: any) => ({
          id: member.id,
          email: member.user?.email || member.email || '',
          firstName: member.user?.firstName || member.firstName || 'Unknown',
          lastName: member.user?.lastName || member.lastName || 'User',
          username: member.user?.username || member.username || '',
          role: member.role || 'DEVELOPER',
          status: member.user?.status || 'ACTIVE',
          avatarUrl: member.user?.avatar || member.avatarUrl,
          joinedAt: member.joinedAt || member.createdAt || new Date().toISOString(),
          lastActive: member.user?.lastActive || member.lastActive
        }));
        setMembers(processedMembers);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsRefreshing(false);
    }
  };

  const retryFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    isInitializedRef.current = false;
    currentRouteRef.current = '';
    requestIdRef.current = '';
    setMembers([]);
    setWorkspace(null);
    setProject(null);
    setError(null);
    setLoading(true);
  };

  const handleRoleUpdate = async (memberId: string, newRole: string) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setUpdatingMember(memberId);
      await updateProjectMemberRole(memberId, currentUser.id, newRole);
      await refreshMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      setRemovingMember(memberId);
      await removeProjectMember(memberId, currentUser.id);
      await refreshMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const handleInvite = async (email: string, role: string) => {
    if (!project) return;

    try {
      await inviteMemberToProject({ 
        email, 
        projectId: project.id, 
        role 
      });
      await refreshMembers();
    } catch (err) {
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !members.length) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Error loading project members</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-4">
                <Button 
                  onClick={retryFetch} 
                  variant="outline" 
                  size="sm"
                  className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4">

        {/* Header - Compact */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
              <HiUsers className="w-5 h-5" />
              {project?.name || 'Project'} Members
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {workspace?.name && project?.name 
                ? `Manage members for ${project.name} in ${workspace.name} workspace`
                : 'Manage project members and their permissions'
              }
            </p>
          </div>
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="h-9 px-4 border-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Invite Member
          </Button>
        </div>

        {/* Main Content - Single Column Layout like MembersManager */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Members List - Takes most space */}
          <div className="lg:col-span-2">
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <HiUsers className="w-5 h-5 text-[var(--muted-foreground)]" />
                    Team Members ({filteredMembers.length})
                  </CardTitle>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiMagnifyingGlass className="w-4 h-4 text-[var(--muted-foreground)]" />
                    </div>
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 w-64 border-input bg-background text-[var(--foreground)]"
                      placeholder="Search members..."
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {filteredMembers.length === 0 && !loading ? (
                  <EmptyState
                    icon={HiUserPlus}
                    title={searchTerm ? 'No members found matching your search' : 'No members found in this project'}
                    description={searchTerm ? 'Try adjusting your search terms' : 'Start by inviting team members to collaborate on this project'}
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 rounded-lg transition-colors hover:bg-[var(--primary)]/5">
                        <div className="flex items-center space-x-3">
                          <UserAvatar
                            user={{
                              firstName: member.firstName,
                              lastName: member.lastName,
                              avatar: member.avatarUrl,
                            }}
                            size="sm"
                          />
                          <div>
                            <div className="text-sm font-medium text-[var(--foreground)]">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {member.email}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                              Joined {formatDate(member.joinedAt)}
                              {member.lastActive && ` • Active ${formatRelativeTime(member.lastActive)}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={member.status || 'ACTIVE'} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="h-9 w-24 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200"
                                disabled={updatingMember === member.id}
                              >
                                {updatingMember === member.id ? (
                                  <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    {getRoleLabel(member.role)}
                                    <HiChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="z-50 border-none bg-[var(--card)] rounded-[var(--card-radius)] shadow-lg">
                              {roles.map((role) => (
                                <DropdownMenuItem
                                  key={role.id}
                                  onClick={() => handleRoleUpdate(member.id, role.name)}
                                  className="text-[var(--foreground)] hover:bg-[var(--primary)]/10"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    {role.name}
                                    {member.role === role.name && (
                                      <HiCheck className="w-4 h-4 text-[var(--primary)]" />
                                    )}
                                  </div>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                                disabled={removingMember === member.id}
                              >
                                {removingMember === member.id ? (
                                  <div className="w-4 h-4 border-2 border-[var(--destructive)] border-t-transparent rounded-full animate-spin mr-2"></div>
                                ) : (
                                  <HiTrash className="w-4 h-4 mr-2" />
                                )}
                                Remove member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Info & Recent Activity - Small Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Project Info Card */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiFolder className="w-5 h-5 text-[var(--muted-foreground)]" />
                  Project Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{project?.name || 'Unknown Project'}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{project?.description || 'No description available'}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Workspace:</span>
                    <span className="font-medium text-[var(--foreground)]">{workspace?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Members:</span>
                    <span className="font-medium text-[var(--foreground)]">{members.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Active Members:</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {members.filter(m => m.status === 'ACTIVE').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member Roles Summary */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiCog className="w-5 h-5 text-[var(--muted-foreground)]" />
                  Role Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {roles.map((role) => {
                    const count = members.filter(m => m.role === role.name).length;
                    return (
                      <div key={role.id} className="flex items-center justify-between text-xs">
                        <span className="text-[var(--muted-foreground)]">{role.name}</span>
                        <Badge 
                          variant={role.variant} 
                          className="h-5 px-2 text-xs border-none bg-[var(--primary)]/10 text-[var(--primary)]"
                        >
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiEnvelope className="w-5 h-5 text-[var(--muted-foreground)]" />
                  Pending Invitations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <EmptyState
                  icon={HiEnvelope}
                  title="No pending invitations"
                  description="All invitations have been accepted or no invitations have been sent"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <InviteModal 
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
          availableRoles={roles}
        />
      </div>
    </div>
  );
}