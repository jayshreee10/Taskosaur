'use client';
import { useState, useEffect, useRef, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useAuth } from '@/contexts/auth-context';
import WorkspaceAvatar from '@/components/ui/avatars/WorkspaceAvatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  HiCog6Tooth,
  HiPhoto,
  HiBell,
  HiExclamationTriangle,
  HiArchiveBox,
  HiTrash,
  HiChevronLeft
} from 'react-icons/hi2';
import Link from 'next/link';

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar: string | null;
  color: string;
  settings: {
    timeTracking: boolean;
    notifications: {
      email: boolean;
      slack: boolean;
    };
    defaultTaskAssignee: string;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
  };
  _count: {
    members: number;
    projects: number;
  };
}

interface Props {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default function WorkspaceSettingsPage(props: Props) {
  const { getWorkspaceBySlug, updateWorkspace, deleteWorkspace } = useWorkspaceContext();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const params = use(props.params);
  const workspaceSlug = params.workspaceSlug;

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');
  const currentSlugRef = useRef<string>('');
  const isInitializedRef = useRef(false);
  const contextFunctionsRef = useRef({
    getWorkspaceBySlug,
    isAuthenticated
  });

  useEffect(() => {
    contextFunctionsRef.current = {
      getWorkspaceBySlug,
      isAuthenticated
    };
  }, [getWorkspaceBySlug, isAuthenticated]);

  useEffect(() => {
    const initializeData = async () => {
      const pageKey = `${workspaceSlug}/settings`;
      const requestId = `${pageKey}-${Date.now()}-${Math.random()}`;
      
      if (!isMountedRef.current || 
          (currentSlugRef.current === pageKey && isInitializedRef.current && workspace)) {
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

        const data = await contextFunctionsRef.current.getWorkspaceBySlug(workspaceSlug);
        
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }

        if (!data) {
          setError('Workspace not found');
          setLoading(false);
          return;
        }
        
        // Patch: Normalize data to WorkspaceData shape if needed
        const normalized: WorkspaceData = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          avatar: null,
          color: data.color || '#6366F1',
          settings: {
            timeTracking: false,
            notifications: { email: false, slack: false },
            defaultTaskAssignee: ''
          },
          organizationId: data.organizationId,
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
          organization: {
            id: '',
            name: '',
            slug: '',
            avatar: null
          },
          _count: { members: 0, projects: 0 }
        };
        setWorkspace(normalized);
        isInitializedRef.current = true;
        
      } catch (error) {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          if (error instanceof Error) {
            if (error.message.includes('404') || error.message.includes('Not Found')) {
              notFound();
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
              setError('You are not authorized to access this workspace. Please check your login status.');
            } else {
              setError(error.message);
            }
          } else {
            setError('Failed to fetch workspace');
          }
          isInitializedRef.current = false;
        }
      } finally {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    const pageKey = `${workspaceSlug}/settings`;
    if (currentSlugRef.current !== pageKey) {
      isInitializedRef.current = false;
      setWorkspace(null);
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

  const retryFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    isInitializedRef.current = false;
    currentSlugRef.current = '';
    requestIdRef.current = '';
    setWorkspace(null);
    setError(null);
    setLoading(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      const updateData = {
        name: formData.get('workspace-name') as string,
        description: formData.get('description') as string,
        color: workspace.color,
      };

      const updatedWorkspace = await updateWorkspace(workspace.id, updateData);
      const normalized: WorkspaceData = {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        slug: updatedWorkspace.slug,
        description: updatedWorkspace.description || '',
        avatar: null,
        color: updatedWorkspace.color || '#6366F1',
        settings: {
          timeTracking: false,
          notifications: { email: false, slack: false },
          defaultTaskAssignee: ''
        },
        organizationId: updatedWorkspace.organizationId,
        createdAt: updatedWorkspace.createdAt || '',
        updatedAt: updatedWorkspace.updatedAt || '',
        organization: {
          id: '',
          name: '',
          slug: '',
          avatar: null
        },
        _count: { members: 0, projects: 0 }
      };
      setWorkspace(normalized);
      alert('Workspace updated successfully!');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspace) return;

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteWorkspace(workspace.id);
      alert('Workspace deleted successfully!');
      router.push('/dashboard');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete workspace');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            {/* Header skeleton */}
            <div className="h-4 bg-[var(--muted)] rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-[var(--muted)] rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-1/2 mb-6"></div>
            
            {/* Tabs skeleton */}
            <div className="h-10 bg-[var(--muted)] rounded mb-4"></div>
            
            {/* Card skeleton */}
            <div className="bg-[var(--card)] rounded-[var(--card-radius)] border-none p-4">
              <div className="h-5 bg-[var(--muted)] rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-[var(--muted)] rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Workspace Settings</AlertTitle>
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
        
        {/* Compact Header - Following project settings pattern */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/dashboard" className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              Dashboard
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link href={`/${workspaceSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              {workspace.name}
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-[var(--foreground)] font-medium">Settings</span>
          </div>
          
          {/* Header with back button */}
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/${workspaceSlug}`}>
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 w-9 p-0 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
              >
                <HiChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                Workspace Settings
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage your workspace configuration and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - Theme consistent */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="h-10 bg-[var(--muted)] rounded-lg p-1">
            <TabsTrigger 
              value="general" 
              className="flex items-center gap-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)]"
            >
              <HiCog6Tooth className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="flex items-center gap-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)]"
            >
              <HiBell className="w-4 h-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="danger" 
              className="flex items-center gap-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)]"
            >
              <HiExclamationTriangle className="w-4 h-4" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiPhoto className="w-5 h-5 text-[var(--primary)]" />
                  Workspace Information
                </CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">
                  Basic information about your workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {error && (
                  <Alert variant="destructive" className="mb-4 bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
                    <HiExclamationTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Workspace Avatar */}
                  <div className="space-y-3">
                    <Label className="text-[var(--foreground)] font-medium">Workspace Avatar</Label>
                    <div className="flex items-center gap-4">
                      <WorkspaceAvatar workspace={{...workspace, avatar: workspace.avatar || undefined}} size="lg" />
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                      >
                        Change Avatar
                      </Button>
                    </div>
                  </div>
                  
                  {/* Name and URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workspace-name" className="text-[var(--foreground)] font-medium">Workspace Name *</Label>
                      <Input
                        id="workspace-name"
                        name="workspace-name"
                        defaultValue={workspace.name}
                        required
                        className="h-9 border-input bg-background text-[var(--foreground)]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="workspace-url" className="text-[var(--foreground)] font-medium">Workspace URL</Label>
                      <div className="flex rounded-lg border border-[var(--border)] overflow-hidden h-9">
                        <span className="inline-flex items-center px-3 bg-[var(--muted)] text-[var(--muted-foreground)] text-sm border-r border-[var(--border)]">
                          {workspace.organization.slug}.taskosaur.com/
                        </span>
                        <Input
                          id="workspace-url"
                          value={workspace.slug}
                          disabled
                          className="flex-1 bg-[var(--muted)] text-[var(--muted-foreground)] border-0 h-full"
                        />
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Workspace URL cannot be changed after creation
                      </p>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[var(--foreground)] font-medium">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={workspace.description}
                      placeholder="Brief description of your workspace..."
                      className="border-input bg-background text-[var(--foreground)] resize-none"
                    />
                    <p className="text-xs text-[var(--muted-foreground)]">
                      This will be displayed on your workspace profile
                    </p>
                  </div>
                
                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="h-9 px-6 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiBell className="w-5 h-5 text-[var(--primary)]" />
                  Workspace Preferences
                </CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">
                  Configure workspace-specific settings and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Default Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-role" className="text-[var(--foreground)] font-medium">Default role for new members</Label>
                      <Select defaultValue={workspace.settings?.defaultTaskAssignee || "member"}>
                        <SelectTrigger className="h-9 border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                          <SelectValue placeholder="Select default role" />
                        </SelectTrigger>
                        <SelectContent className="border-none bg-[var(--card)]">
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility" className="text-[var(--foreground)] font-medium">Workspace visibility</Label>
                      <Select>
                        <SelectTrigger className="h-9 border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent className="border-none bg-[var(--card)]">
                          <SelectItem value="private">Private - Only invited members can access</SelectItem>
                          <SelectItem value="public">Public - Anyone in your organization can access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Feature Settings */}
                  <div className="space-y-3">
                    <Label className="text-[var(--foreground)] font-medium">Feature Settings</Label>
                    <div className="space-y-4 mt-3">
                      {[{ 
                          key: 'email-notifications', 
                          label: 'Email notifications', 
                          description: 'Send email notifications for workspace activities',
                          defaultChecked: workspace.settings?.notifications?.email || false
                        },
                        { 
                          key: 'slack-notifications', 
                          label: 'Slack integration', 
                          description: 'Enable Slack notifications and integrations',
                          defaultChecked: workspace.settings?.notifications?.slack || false
                        },
                        { 
                          key: 'time-tracking', 
                          label: 'Time tracking', 
                          description: 'Enable time tracking features for tasks and projects',
                          defaultChecked: workspace.settings?.timeTracking || false
                        }
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30">
                          <Checkbox
                            id={setting.key}
                            name={setting.key}
                            defaultChecked={setting.defaultChecked}
                            className="mt-0.5"
                          />
                          <div className="space-y-1">
                            <Label htmlFor={setting.key} className="text-sm font-medium text-[var(--foreground)] cursor-pointer">
                              {setting.label}
                            </Label>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {setting.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="h-9 px-6 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg"
                    >
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--destructive)] flex items-center gap-2">
                  <HiExclamationTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">
                  Permanent actions that cannot be undone
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Archive Workspace */}
                <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                      <HiArchiveBox className="w-5 h-5 text-[var(--muted-foreground)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1">Archive Workspace</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Make this workspace read-only. No new changes can be made.</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center gap-2"
                  >
                    <HiArchiveBox className="w-4 h-4" />
                    Archive
                  </Button>
                </div>
                
                {/* Delete Workspace */}
                <div className="flex items-center justify-between p-4 border border-[var(--destructive)]/20 rounded-lg bg-[var(--destructive)]/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--destructive)]/10 flex items-center justify-center">
                      <HiTrash className="w-5 h-5 text-[var(--destructive)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1">Delete Workspace</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Permanently remove this workspace and all its data. This cannot be undone.</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="h-9 bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 text-[var(--destructive-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
                  >
                    <HiTrash className="w-4 h-4" />
                    Delete Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog - Theme consistent */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md bg-[var(--card)] border-none rounded-[var(--card-radius)] shadow-lg">
            <DialogHeader>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[var(--destructive)]/10 mb-4">
                <HiExclamationTriangle className="h-6 w-6 text-[var(--destructive)]" />
              </div>
              <DialogTitle className="text-center text-lg font-semibold text-[var(--destructive)]">
                Delete Workspace
              </DialogTitle>
              <DialogDescription className="text-center text-[var(--muted-foreground)]">
                Are you sure you want to delete <span className="font-semibold text-[var(--foreground)]">"{workspace.name}"</span>? This action cannot be undone and will permanently remove all projects, tasks, and data associated with this workspace.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4 flex flex-row">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 h-9 bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 text-[var(--destructive-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Workspace'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}