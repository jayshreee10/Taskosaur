"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  HiUserPlus
} from 'react-icons/hi2';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  avatar?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-700 dark:bg-green-400/10 dark:text-green-500 ';
      case 'PENDING':
        return 'bg-yellow-400/10 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-500 ';
      case 'INACTIVE':
        return 'bg-gray-400/10 text-gray-700 dark:bg-gray-400/10 dark:text-gray-500 ';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] ';
    }
  };

  return (
    <Badge className={`text-[10px] font-semibold border-none  py-0.5 rounded-full capitalize text-center tracking-wide shadow-sm ${getStatusConfig(status)}`}
      >
      {status?.toLowerCase()}
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
  const [role, setRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    try {
      await onInvite(email.trim(), role);
      setEmail('');
      setRole('MEMBER');
      onClose();
    } catch (error) {
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--card)] border-none rounded-[var(--card-radius)] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)]">Invite Member via Email</DialogTitle>
          <DialogDescription className="text-[var(--muted-foreground)]">
            Send an invitation to join this workspace.
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

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  
  const { 
    getWorkspaceBySlug, 
    getWorkspaceMembers, 
    addMemberToWorkspace, 
    inviteMemberToWorkspace, 
    updateMemberRole, 
    removeMemberFromWorkspace 
  } = useWorkspaceContext();
  const { isAuthenticated, getCurrentUser } = useAuth();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
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
  const currentSlugRef = useRef<string>('');
  const isInitializedRef = useRef(false);
  const contextFunctionsRef = useRef({
    getWorkspaceBySlug,
    getWorkspaceMembers,
    isAuthenticated
  });

  const roles = [
    { id: '1', name: 'ADMIN', description: 'Full access to all workspace resources', variant: 'secondary' as const },
    { id: '2', name: 'MANAGER', description: 'Can manage projects and members', variant: 'default' as const },
    { id: '3', name: 'MEMBER', description: 'Can access and work on projects', variant: 'default' as const },
    { id: '4', name: 'VIEWER', description: 'Can only view workspace content', variant: 'secondary' as const },
  ];

  const getRoleLabel = (role: string) => {
    const roleConfig = roles.find(r => r.name === role);
    return roleConfig?.name || role;
  };

  useEffect(() => {
    contextFunctionsRef.current = {
      getWorkspaceBySlug,
      getWorkspaceMembers,
      isAuthenticated
    };
  }, [getWorkspaceBySlug, getWorkspaceMembers, isAuthenticated]);

  useEffect(() => {
    const initializeData = async () => {
      const pageKey = `${workspaceSlug}/members`;
      const requestId = `${pageKey}-${Date.now()}-${Math.random()}`;
      
      if (!isMountedRef.current || 
          (currentSlugRef.current === pageKey && isInitializedRef.current && workspace && members.length >= 0)) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      requestIdRef.current = requestId;
      currentSlugRef.current = pageKey;

      if (!workspaceSlug || !contextFunctionsRef.current.isAuthenticated()) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }

        const workspaceData = await contextFunctionsRef.current.getWorkspaceBySlug(workspaceSlug);
        
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }

        if (!workspaceData) {
          setError('Workspace not found');
          setLoading(false);
          return;
        }

        setWorkspace(workspaceData);

        const membersData = await contextFunctionsRef.current.getWorkspaceMembers(workspaceData.id);
        
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        
        const processedMembers = (membersData || []).map((member: any) => ({
          id: member.id,
          name: `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim() || 'Unknown User',
          email: member.user?.email || '',
          role: member.role || 'Member',
          status: member.user?.status || 'Active',
          joinedAt: member.createdAt || new Date().toISOString(),
          avatar: member.user?.avatar || ''
        }));
        
        setMembers(processedMembers);
        isInitializedRef.current = true;
        
      } catch (err) {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          isInitializedRef.current = false;
        }
      } finally {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    const pageKey = `${workspaceSlug}/members`;
    if (currentSlugRef.current !== pageKey) {
      isInitializedRef.current = false;
      setWorkspace(null);
      setMembers([]);
      setError(null);
    }

    const timeoutId = setTimeout(() => {
      initializeData();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [workspaceSlug]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;
      currentSlugRef.current = '';
      requestIdRef.current = '';
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);


  // Separate members into pending and others
  const filteredMembers = members.filter(member => {
    const name = member.name || '';
    const email = member.email || '';
    const searchLower = searchTerm.toLowerCase();
    return (name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower)) && member.status?.toLowerCase() !== 'pending';
  });

  const filteredPendingMembers = members.filter(member => {
    const name = member.name || '';
    const email = member.email || '';
    const searchLower = searchTerm.toLowerCase();
    return (name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower)) && member.status?.toLowerCase() === 'pending';
  });

  const refreshMembers = async () => {
    if (!workspace) return;
    
    try {
      setIsRefreshing(true);
      const membersData = await contextFunctionsRef.current.getWorkspaceMembers(workspace.id);
      
      const processedMembers = (membersData || []).map((member: any) => ({
        id: member.id,
        name: `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim() || 'Unknown User',
        email: member.user?.email || '',
        role: member.role || 'Member',
        status: member.user?.status || 'Active',
        joinedAt: member.createdAt || new Date().toISOString(),
        avatar: member.user?.avatar || ''
      }));
      
      setMembers(processedMembers);
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
    currentSlugRef.current = '';
    requestIdRef.current = '';
    setMembers([]);
    setWorkspace(null);
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
      await updateMemberRole(memberId, { role: newRole as any }, currentUser.id);
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

    if (!confirm('Are you sure you want to remove this member from the workspace?')) {
      return;
    }

    try {
      setRemovingMember(memberId);
      await removeMemberFromWorkspace(memberId, currentUser.id);
      await refreshMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const handleInvite = async (email: string, role: string) => {
    if (!workspace) return;

    try {
      await inviteMemberToWorkspace({ 
        email, 
        workspaceId: workspace.id, 
        role: role as any 
      });
      await refreshMembers();
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Error loading workspace members</AlertTitle>
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

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Workspace not found
            </h2>
          </div>
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
              Internal Operations Members
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage members and their permissions in this workspace.
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
                    Members ({filteredMembers.length})
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
                    title={searchTerm ? 'No members found matching your search' : 'No members found in this workspace'}
                    description={searchTerm ? 'Try adjusting your search terms' : 'Start by inviting team members to collaborate'}
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 rounded-lg transition-colors hover:bg-[var(--primary)]/5">
                        <div className="flex items-center space-x-3">
                          <UserAvatar
                            user={{
                              firstName: member.name.split(' ')[0] || '',
                              lastName: member.name.split(' ')[1] || '',
                              avatar: member.avatar,
                            }}
                            size="sm"
                          />
                          <div>
                            <div className="text-sm font-medium text-[var(--foreground)] flex gap-3">
                              {member.name}   <StatusBadge status={member.status} />
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                        
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="h-9 w-28 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 text-xs"
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

          {/* Pending Invitations - Small Sidebar Card */}
          <div className="lg:col-span-1">
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiEnvelope className="w-5 h-5 text-[var(--muted-foreground)]" />
                  Pending Invitations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredPendingMembers.length === 0 ? (
                  <EmptyState
                    icon={HiEnvelope}
                    title="No pending invitations"
                    description="All invitations have been accepted or no invitations have been sent"
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredPendingMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 rounded-lg transition-colors hover:bg-[var(--primary)]/5">
                        <div className="flex items-center space-x-3">
                          <UserAvatar
                            user={{
                              firstName: member.name.split(' ')[0] || '',
                              lastName: member.name.split(' ')[1] || '',
                              avatar: member.avatar,
                            }}
                            size="sm"
                          />
                          <div>
                            <div className="text-sm font-medium text-[var(--foreground)] flex gap-3">
                              {member.name}   <StatusBadge status={member.status} />
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-md border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 text-xs">
                            Invited
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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