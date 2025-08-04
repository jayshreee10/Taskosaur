'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { HiArrowLeft, HiExclamationTriangle } from 'react-icons/hi2';

interface Props {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-4xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-5 bg-muted rounded w-2/3 mb-3"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
        <Card>
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-muted rounded mb-6"></div>
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-24 bg-muted rounded mb-6"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default function NewProjectPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { workspaceSlug } = resolvedParams;
  const [workspace, setWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366F1',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    settings: {
      methodology: 'AGILE',
      defaultTaskType: 'TASK',
      enableTimeTracking: true,
      allowSubtasks: true,
      workflowId: 'default-workflow-id'
    }
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');
  const currentSlugRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { createProject } = useProjectContext();
  const { isAuthenticated } = useAuth();

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
      const pageKey = `${workspaceSlug}/projects/new`;
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
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
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
          setIsLoading(false);
          return;
        }
        
        setWorkspace(workspaceData);
        isInitializedRef.current = true;
        
      } catch (error) {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          if (error instanceof Error) {
            if (error.message.includes('404') || error.message.includes('Not Found')) {
              setError('Workspace not found');
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
              setError('You are not authorized to access this workspace. Please check your login status.');
            } else {
              setError(error.message);
            }
          } else {
            setError('Failed to load workspace');
          }
          isInitializedRef.current = false;
        }
      } finally {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    const pageKey = `${workspaceSlug}/projects/new`;
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
    setIsLoading(true);
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.slug.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.startDate !== '' &&
      formData.endDate !== '' &&
      formData.status !== '' &&
      formData.priority !== '' &&
      formData.color.trim() !== ''
    );
  };

  const generateProjectKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 10) || 'PROJ';
  };

  useEffect(() => {
    if (formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: generateProjectKey(formData.name)
      }));
    }
  }, [formData.name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!workspace) {
      setError('Workspace not found');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!isAuthenticated()) {
        setError('Authentication required');
        return;
      }

      // Generate a project key (short identifier)
      const key = generateProjectKey(formData.name);

      const projectData = {
        key,
        name: formData.name.trim(),
        slug: formData.slug || key,
        description: formData.description.trim(),
        color: formData.color,
        status: formData.status,
        priority: formData.priority,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate 
          ? new Date(formData.endDate).toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        workspaceId: workspace.id,
        settings: formData.settings
      };

      const newProject = await createProject(projectData);

      const projectSlug = formData.name.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      router.push(`/${workspaceSlug}/${projectSlug}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Workspace Not Found</AlertTitle>
            <AlertDescription>
              {error || 'Workspace not found. Please check the URL and try again.'}
              <div className="mt-4 flex gap-3">
                <Link 
                  href="/workspaces"
                  className="text-primary hover:text-primary/80 underline"
                >
                  Back to Workspaces
                </Link>
                <button
                  onClick={retryFetch}
                  className="text-primary hover:text-primary/80 underline"
                >
                  Try again
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Breadcrumb className="mb-3">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${workspaceSlug}`} className="flex items-center gap-1">
                  <HiArrowLeft size={12} />
                  {workspace.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New Project</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <h1 className="text-xl font-semibold text-foreground mb-2">Create New Project</h1>
          <p className="text-sm text-muted-foreground">
            Projects help organize tasks and track work within your {workspace.name} workspace.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <HiExclamationTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="My Project"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Project Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    placeholder="PROJ"
                  />
                  <p className="text-xs text-muted-foreground">A short identifier for your project (auto-generated from name)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the goals of this project"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({...prev, priority: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="flex items-center gap-3 max-w-md">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="h-10 w-20 border border-border rounded-lg cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#6366F1"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Link href={`/${workspaceSlug}`}>
                  <Button variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid()}
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}