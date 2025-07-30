'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import ProjectAvatar from '@/components/ui/avatars/ProjectAvatar';
import WorkflowManager from '@/components/workflows/WorkflowManager';
import AutomationRules from '@/components/automation/AutomationRules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  HiArrowPath,
  HiCpuChip,
  HiExclamationTriangle,
  HiPhoto,
  HiArchiveBox,
  HiTrash
} from 'react-icons/hi2';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  workspaceId: string;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceContext = useContext(WorkspaceContext);
  const projectContext = useProjectContext();
  const { isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const workspaceSlug = params?.workspaceSlug as string;
  const projectSlug = params?.projectSlug as string;

  const getAuthToken = () => {
    return '';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!workspaceContext || !projectContext) {
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        
        const workspaceData = await workspaceContext.getWorkspaceBySlug(workspaceSlug);
        setWorkspace(workspaceData);

        const projects = await projectContext.getProjectsByWorkspace(workspaceData.id);

        const matchedProject = projects.find((p: any) => {
          const projectNameSlug = p.name.toLowerCase().replace(/\s+/g, '-');
          const projectKeySlug = p.key?.toLowerCase();
          
          return projectNameSlug === projectSlug || 
                 projectKeySlug === projectSlug || 
                 p.key === projectSlug ||
                 p.slug === projectSlug;
        });

        if (matchedProject) {
          setProject(matchedProject);
        } else {
          console.error('No matching project found for slug:', projectSlug);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch project data');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceSlug && projectSlug) {
      fetchData();
    }
  }, [workspaceContext, projectContext, workspaceSlug, projectSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !projectContext) return;

    setSaving(true);
    setError(null);

    try {
      const token = getAuthToken();
      const formData = new FormData(e.target as HTMLFormElement);
      
      const formatDateToISO = (dateString: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString();
      };
      
      const updateData: any = {
        name: formData.get('project-name') as string,
        description: formData.get('description') as string,
        status: formData.get('status') as string,
        priority: formData.get('priority') as string,
      };

      const startDate = formData.get('start-date') as string;
      const endDate = formData.get('end-date') as string;
      
      if (startDate) {
        updateData.startDate = formatDateToISO(startDate);
      }
      
      if (endDate) {
        updateData.endDate = formatDateToISO(endDate);
      }
      
      const updatedProject = await projectContext.updateProject(project.id, updateData, token);
      
      setProject(updatedProject);
      alert('Project updated successfully!');
      
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error instanceof Error ? error.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !projectContext) return;

    setDeleteLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      
      await projectContext.deleteProject(project.id, token);
      alert('Project deleted successfully!');
      router.push(`/${workspaceSlug}`);
      
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete project');
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
            <span className="ml-2 text-muted-foreground">Loading project settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace || !project) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <Alert variant="destructive">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Project Not Found</AlertTitle>
            <AlertDescription>
              The requested project could not be found or you don't have access to it.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>{workspace.name}</span>
            <span>/</span>
            <span>{project.name}</span>
            <span>/</span>
            <span>Settings</span>
          </nav>
          <h1 className="text-lg font-semibold text-foreground mb-1">
            Project Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your project configuration and preferences.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <HiCog6Tooth size={16} />
              General
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <HiArrowPath size={16} />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <HiCpuChip size={16} />
              Automation
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2">
              <HiExclamationTriangle size={16} />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiPhoto size={16} />
                  Project Information
                </CardTitle>
                <CardDescription>
                  Basic information about your project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <HiExclamationTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Project Avatar</Label>
                    <div className="flex items-center gap-4">
                      <ProjectAvatar project={project} size="lg" />
                      <Button variant="outline" size="sm">
                        Change Avatar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name *</Label>
                      <Input
                        id="project-name"
                        name="project-name"
                        defaultValue={project.name}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="project-key">Project Key</Label>
                      <Input
                        id="project-key"
                        value={project.key}
                        disabled
                        className="bg-muted text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Project key cannot be changed after creation.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={project.description}
                      placeholder="Brief description of your project..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        name="start-date"
                        type="date"
                        defaultValue={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        name="end-date"
                        type="date"
                        defaultValue={project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={project.status}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Active</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="ON_HOLD">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">On Hold</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="COMPLETED">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Completed</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="ARCHIVED">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Archived</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" defaultValue={project.priority}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Low</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Medium</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="HIGH">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">High</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="URGENT">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">Urgent</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiArrowPath size={16} />
                  Workflow Configuration
                </CardTitle>
                <CardDescription>
                  Configure task statuses and workflow transitions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowManager projectId={project?.id || ''} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiCpuChip size={16} />
                  Automation Rules
                </CardTitle>
                <CardDescription>
                  Set up automated workflows and triggers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutomationRules projectId={project?.id || ''} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-destructive">
              <CardHeader className="bg-destructive/10">
                <CardTitle className="flex items-center gap-2 text-destructive">
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
                    <h4 className="font-medium text-foreground mb-1">
                      Archive Project
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Archiving a project will make it read-only. No new changes can be made.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4 flex-shrink-0 flex items-center gap-2">
                    <HiArchiveBox size={16} />
                    Archive
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-start justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Delete Project
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Once you delete a project, all of its data will be permanently removed.
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="ml-4 flex-shrink-0 flex items-center gap-2"
                  >
                    <HiTrash size={16} />
                    Delete Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
                <HiExclamationTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">Delete Project</DialogTitle>
              <DialogDescription className="text-center">
                Are you sure you want to delete "{project.name}"? This action cannot be undone and will permanently remove all tasks, files, and data associated with this project.
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
                {deleteLoading ? 'Deleting...' : 'Delete Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}