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
  HiArchiveBox
} from 'react-icons/hi2';

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
        
        setWorkspace(data);
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
      setWorkspace(updatedWorkspace);
      
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
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading workspace settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <Alert variant="destructive">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Workspace Settings</AlertTitle>
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
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <HiCog6Tooth size={20} />
            {workspace.name} Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace configuration and preferences.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiPhoto size={16} />
                Workspace Information
              </CardTitle>
              <CardDescription>Basic information about your workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <Label>Workspace Avatar</Label>
                  <div className="flex items-center gap-4">
                    <WorkspaceAvatar workspace={{...workspace, avatar: workspace.avatar || undefined}} size="lg" />
                    <Button variant="outline" size="sm">
                      Change avatar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace name *</Label>
                    <Input
                      id="workspace-name"
                      name="workspace-name"
                      defaultValue={workspace.name}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workspace-url">Workspace URL</Label>
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      <span className="inline-flex items-center px-3 bg-muted text-muted-foreground text-sm border-r border-border">
                        {workspace.organization.slug}.taskosaur.com/
                      </span>
                      <Input
                        id="workspace-url"
                        value={workspace.slug}
                        disabled
                        className="flex-1 bg-muted text-muted-foreground border-0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Workspace URL cannot be changed after creation.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={workspace.description}
                    placeholder="Brief description of your workspace..."
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be displayed on your workspace profile.
                  </p>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiBell size={16} />
                Workspace Preferences
              </CardTitle>
              <CardDescription>Configure workspace-specific settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-role">Default role for new members</Label>
                    <Select defaultValue={workspace.settings?.defaultTaskAssignee || "member"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="project-manager">Project Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Workspace visibility</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private - Only invited members can access</SelectItem>
                        <SelectItem value="public">Public - Anyone in your organization can access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Feature Settings</Label>
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
                      <div key={setting.key} className="flex items-start gap-3">
                        <Checkbox
                          id={setting.key}
                          name={setting.key}
                          defaultChecked={setting.defaultChecked}
                        />
                        <div className="space-y-1">
                          <Label htmlFor={setting.key} className="text-sm font-medium">
                            {setting.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader className="bg-destructive/10">
              <CardTitle className="text-destructive flex items-center gap-2 mb-1">
                <HiExclamationTriangle size={16} />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-destructive/70">
                Permanent actions that cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-start justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Archive workspace</h4>
                  <p className="text-xs text-muted-foreground">
                    Archiving a workspace will make it read-only. No new changes can be made, but you can still view all data.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 flex-shrink-0 flex items-center gap-1"
                >
                  <HiArchiveBox size={14} />
                  Archive
                </Button>
              </div>
              
              <div className="flex items-start justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Delete workspace</h4>
                  <p className="text-xs text-muted-foreground">
                    Once you delete a workspace, all of its data will be permanently removed. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="ml-4 flex-shrink-0"
                >
                  Delete Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
                <HiExclamationTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">Delete Workspace</DialogTitle>
              <DialogDescription className="text-center">
                Are you sure you want to delete "{workspace.name}"? This action cannot be undone and will permanently remove all projects, tasks, and data associated with this workspace.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1"
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