'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/workspace-context';
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
  HiTrash,
  HiChevronLeft
} from 'react-icons/hi2';
import Link from 'next/link';

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
  const workspaceContext = useWorkspace();
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
        setWorkspace({
          ...workspaceData,
          description: workspaceData.description ?? '',
        });

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
          setProject({
            ...matchedProject,
            description: matchedProject.description ?? '',
          });
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
  }, [ workspaceSlug, projectSlug]);

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
      
      const updatedProject = await projectContext.updateProject(project.id, updateData);
      setProject({
        ...updatedProject,
        description: updatedProject.description ?? '',
      });
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
      
      await projectContext.deleteProject(project.id);
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

  if (!workspace || !project) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
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
      <div className="max-w-7xl mx-auto p-4">
        
        {/* Compact Header - Following your theme patterns */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href={`/${workspaceSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              {workspace.name}
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link href={`/${workspaceSlug}/${projectSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              {project.name}
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-[var(--foreground)] font-medium">Settings</span>
          </div>
          
          {/* Header with back button */}
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/${workspaceSlug}/${projectSlug}`}>
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
                Project Settings
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage your project configuration and preferences
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
                  Project Information
                </CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">
                  Basic information about your project
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
                  {/* Project Avatar */}
                  <div className="space-y-3">
                    <Label className="text-[var(--foreground)] font-medium">Project Avatar</Label>
                    <div className="flex items-center gap-4">
                      <ProjectAvatar project={project} size="lg" />
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                      >
                        Change Avatar
                      </Button>
                    </div>
                  </div>
                  
                  {/* Name and Key */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name" className="text-[var(--foreground)] font-medium">Project Name *</Label>
                      <Input
                        id="project-name"
                        name="project-name"
                        defaultValue={project.name}
                        required
                        className="h-9 border-input bg-background text-[var(--foreground)]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="project-key" className="text-[var(--foreground)] font-medium">Project Key</Label>
                      <Input
                        id="project-key"
                        value={project.key}
                        disabled
                        className="h-9 bg-[var(--muted)] text-[var(--muted-foreground)] border-none"
                      />
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Project key cannot be changed after creation
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
                      defaultValue={project.description}
                      placeholder="Brief description of your project..."
                      className="border-input bg-background text-[var(--foreground)] resize-none"
                    />
                  </div>
                  
                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-[var(--foreground)] font-medium">Start Date</Label>
                      <Input
                        id="start-date"
                        name="start-date"
                        type="date"
                        defaultValue={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''}
                        className="h-9 border-input bg-background text-[var(--foreground)]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-[var(--foreground)] font-medium">End Date</Label>
                      <Input
                        id="end-date"
                        name="end-date"
                        type="date"
                        defaultValue={project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''}
                        className="h-9 border-input bg-background text-[var(--foreground)]"
                      />
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-[var(--foreground)] font-medium">Status</Label>
                      <Select name="status" defaultValue={project.status}>
                        <SelectTrigger className="h-9 border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="border-none bg-[var(--card)]">
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-none">Active</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="ON_HOLD">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-none">On Hold</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="COMPLETED">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-none">Completed</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="ARCHIVED">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[var(--muted)] text-[var(--muted-foreground)] border-none">Archived</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-[var(--foreground)] font-medium">Priority</Label>
                      <Select name="priority" defaultValue={project.priority}>
                        <SelectTrigger className="h-9 border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="border-none bg-[var(--card)]">
                          <SelectItem value="LOW">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-none">Low</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-none">Medium</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="HIGH">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-none">High</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="URGENT">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-none">Urgent</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                {/* Archive Project */}
                <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                      <HiArchiveBox className="w-5 h-5 text-[var(--muted-foreground)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1">Archive Project</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Make this project read-only. No new changes can be made.</p>
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
                
                {/* Delete Project */}
                <div className="flex items-center justify-between p-4 border border-[var(--destructive)]/20 rounded-lg bg-[var(--destructive)]/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--destructive)]/10 flex items-center justify-center">
                      <HiTrash className="w-5 h-5 text-[var(--destructive)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1">Delete Project</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Permanently remove this project and all its data. This cannot be undone.</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="h-9 bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 text-[var(--destructive-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
                  >
                    <HiTrash className="w-4 h-4" />
                    Delete Project
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
                Delete Project
              </DialogTitle>
              <DialogDescription className="text-center text-[var(--muted-foreground)]">
                Are you sure you want to delete <span className="font-semibold text-[var(--foreground)]">"{project.name}"</span>? This action cannot be undone and will permanently remove all tasks, files, and data associated with this project.
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
                {deleteLoading ? 'Deleting...' : 'Delete Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}