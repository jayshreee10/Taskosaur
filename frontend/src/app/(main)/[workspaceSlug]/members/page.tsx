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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  HiMagnifyingGlass,
  HiPlus,
  HiPencilSquare,
  HiTrash,
  HiUsers,
  HiEnvelope,
  HiExclamationTriangle
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

const UserAvatar = ({ 
  name, 
  size = "md" 
}: { 
  name: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };
  
  const getInitials = (name: string) => {
    if (!name || name.trim() === '') return 'UN';
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Avatar className={sizes[size]}>
      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-8"></div>
        <Card>
          <CardContent className="p-6">
            <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
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
  <div className="px-6 py-10 text-center">
    <Icon size={48} className="mx-auto text-muted-foreground mb-4" />
    <p className="text-sm text-foreground font-medium mb-1">{title}</p>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

// Invite modal component using shadcn Dialog
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
      console.error('Error inviting member:', error);
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join this workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r: any) => (
                    <SelectItem key={r.id} value={r.name}>
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
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

  // Enhanced refs to prevent duplicate API calls - Strict Mode compatible
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
    { id: '1', name: 'ADMIN', description: 'Full access to all workspace resources' },
    { id: '2', name: 'MANAGER', description: 'Can manage projects and members' },
    { id: '3', name: 'MEMBER', description: 'Can access and work on projects' },
    { id: '4', name: 'VIEWER', description: 'Can only view workspace content' },
  ];

  // Update context functions in refs when they change
  useEffect(() => {
    contextFunctionsRef.current = {
      getWorkspaceBySlug,
      getWorkspaceMembers,
      isAuthenticated
    };
  }, [getWorkspaceBySlug, getWorkspaceMembers, isAuthenticated]);

  // Enhanced initialization effect that's Strict Mode compatible
  useEffect(() => {
    const initializeData = async () => {
      // Generate unique request ID for this page (including path to distinguish between workspace pages)
      const pageKey = `${workspaceSlug}/members`;
      const requestId = `${pageKey}-${Date.now()}-${Math.random()}`;
      
      // Only prevent if we're truly initialized for this exact page and have data
      if (!isMountedRef.current || 
          (currentSlugRef.current === pageKey && isInitializedRef.current && workspace && members.length >= 0)) {
        console.log('🚫 [MEMBERS] Skipping fetch - already initialized or unmounted');
        return;
      }

      // Cancel any ongoing request with a small delay to handle rapid mount/unmount cycles
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      requestIdRef.current = requestId;
      currentSlugRef.current = pageKey;

      console.log('📋 [MEMBERS] Initializing data fetch for slug:', workspaceSlug, 'requestId:', requestId);

      if (!workspaceSlug || !contextFunctionsRef.current.isAuthenticated()) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Double-check we're still the active request
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          console.log('🚫 [MEMBERS] Request cancelled or component unmounted');
          return;
        }

        console.log('🔍 [MEMBERS] Fetching workspace data for slug:', workspaceSlug);
        const workspaceData = await contextFunctionsRef.current.getWorkspaceBySlug(workspaceSlug);
        
        // Check again if we're still the active request
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          console.log('🚫 [MEMBERS] Request cancelled after workspace fetch');
          return;
        }

        if (!workspaceData) {
          setError('Workspace not found');
          setLoading(false);
          return;
        }

        setWorkspace(workspaceData);

        console.log(`🔍 [MEMBERS] Fetching members for workspace: ${workspaceData.id}`);
        const membersData = await contextFunctionsRef.current.getWorkspaceMembers(workspaceData.id);
        
        // Final check if we're still the active request
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          console.log('🚫 [MEMBERS] Request cancelled after members fetch');
          return;
        }
        
        console.log(`📊 [MEMBERS] Received members data:`, { count: membersData?.length, isEmpty: !membersData || membersData.length === 0 });
        
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
        console.log(`✅ [MEMBERS] Successfully loaded ${processedMembers.length} members`);
        
      } catch (err) {
        // Only handle error if we're still the active request
        if (requestIdRef.current === requestId && isMountedRef.current) {
          console.error('❌ [MEMBERS] Error fetching data:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
          isInitializedRef.current = false;
        }
      } finally {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Reset initialization when page changes
    const pageKey = `${workspaceSlug}/members`;
    if (currentSlugRef.current !== pageKey) {
      console.log('📍 [MEMBERS] Page changed, resetting for new page:', pageKey);
      isInitializedRef.current = false;
      setWorkspace(null);
      setMembers([]);
      setError(null);
    }

    // Add a small delay to handle rapid mount/unmount cycles
    const timeoutId = setTimeout(() => {
      initializeData();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [workspaceSlug]); // Only depend on workspaceSlug

  // Enhanced cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('🧹 [MEMBERS] Component unmounting, cleaning up');
      isMountedRef.current = false;
      isInitializedRef.current = false;
      currentSlugRef.current = '';
      requestIdRef.current = '';
      
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const filteredMembers = members.filter(member => {
    const name = member.name || '';
    const email = member.email || '';
    const searchLower = searchTerm.toLowerCase();
    
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower);
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Function to refresh members list
  const refreshMembers = async () => {
    if (!workspace) return;
    
    try {
      setIsRefreshing(true);
      console.log(`🔄 [MEMBERS] Refreshing members for workspace ${workspace.id}`);
      const membersData = await contextFunctionsRef.current.getWorkspaceMembers(workspace.id);
      
      console.log(`📊 [MEMBERS] Refresh received members data:`, { count: membersData?.length, isEmpty: !membersData || membersData.length === 0 });
      
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
      setError(null); // Clear any previous errors
      console.log(`✅ [MEMBERS] Successfully refreshed ${processedMembers.length} members`);
    } catch (err) {
      console.error('❌ [MEMBERS] Error refreshing members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced manual retry function
  const retryFetch = () => {
    console.log('🔄 [MEMBERS] Manual retry triggered');
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Reset all state
    isInitializedRef.current = false;
    currentSlugRef.current = '';
    requestIdRef.current = '';
    setMembers([]);
    setWorkspace(null);
    setError(null);
    setLoading(true);
    
    // The useEffect will automatically trigger a new fetch
  };

  // Handle role update
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
      console.error('Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingMember(null);
    }
  };

  // Handle member removal
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
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  // Handle member invitation
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
      console.error('Error inviting member:', err);
      throw err;
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <Alert variant="destructive">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Error loading workspace members</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-4">
                <Button onClick={retryFetch} variant="outline" size="sm">
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
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-lg font-semibold text-foreground">
              Workspace not found
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-lg font-semibold text-foreground mb-1">
                {workspace.name} Members
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage members and their permissions in the {workspace.name} workspace.
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button onClick={() => setShowInviteModal(true)}>
                <HiPlus size={16} className="mr-2" />
                Invite Member
              </Button>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <Card className="mb-6">
          {isRefreshing && !loading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-lg overflow-hidden">
              <div className="h-full bg-primary animate-pulse"></div>
            </div>
          )}
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <HiUsers size={16} />
                Members ({filteredMembers.length})
                {isRefreshing && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2"></div>
                )}
              </CardTitle>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiMagnifyingGlass size={16} className="text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  placeholder="Search members..."
                />
              </div>
            </div>
          </CardHeader>
          
          {filteredMembers.length === 0 && !loading ? (
            <EmptyState
              icon={HiUsers}
              title={searchTerm ? 'No members found matching your search' : (error ? 'Error loading members' : 'No members found in this workspace')}
              description={searchTerm ? 'Try adjusting your search terms' : (error ? 'Please refresh the page or try again later' : 'Start by inviting team members to collaborate')}
            />
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={member.name} size="lg" />
                          <div>
                            <div className="font-medium text-foreground">
                              {member.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleUpdate(member.id, value)}
                            disabled={updatingMember === member.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(role => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {updatingMember === member.id && (
                            <div className="absolute inset-0 bg-[var(--background)]/50 rounded-lg flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'} className="capitalize">
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(member.joinedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <HiPencilSquare size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingMember === member.id}
                          >
                            {removingMember === member.id ? (
                              <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <HiTrash size={16} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
          
          {/* Show retry button if members disappeared but no error state */}
          {!loading && members.length === 0 && !error && workspace && (
            <CardContent>
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Members data seems to have disappeared. This might be a caching issue.
                </p>
                <Button 
                  onClick={retryFetch}
                  variant="outline"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <HiUsers size={16} className="mr-2" />
                      Reload Members
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          )}

          <CardContent className="border-t border-border pt-4">
            <Button 
              variant="ghost"
              onClick={() => setShowInviteModal(true)}
              className="text-primary hover:text-primary/80"
            >
              <HiPlus size={16} className="mr-2" />
              Invite Member
            </Button>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <HiEnvelope size={16} />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <EmptyState
            icon={HiEnvelope}
            title="No pending invitations"
            description="All invitations have been accepted or no invitations have been sent"
          />
        </Card>

        {/* Invite Member Modal */}
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