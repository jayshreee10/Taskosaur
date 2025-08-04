"use client";
import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskListView from '@/components/tasks/views/TaskListView';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useTask } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  HiPlus,
  HiClipboardDocumentList,
  HiExclamationTriangle,
  HiArrowPath,
} from 'react-icons/hi2';

interface Props {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
          <div className="text-sm text-muted-foreground">Loading project tasks...</div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ 
  error, 
  onRetry 
}: { 
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-6">
      <Alert variant="destructive">
        <HiExclamationTriangle className="h-4 w-4" />
        <AlertTitle>Error loading project tasks</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <div className="mt-4">
            <Button 
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <HiArrowPath size={16} />
              Try again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  </div>
);

export default function TasksPage({ params }: Props) {
  const router = useRouter();
  const { workspaceSlug, projectSlug } = use(params);
  
  const authContext = useAuth();
  const workspaceContext = useWorkspaceContext();
  const projectContext = useProjectContext();
  const taskContext = useTask();
  
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Track the current route to prevent duplicate calls
  const currentRouteRef = useRef<string>('');
  const isFirstRenderRef = useRef(true);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDataLoaded(false);
      
      // Check authentication
      if (!authContext.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      // Get workspace
      const workspace = await workspaceContext.getWorkspaceBySlug(workspaceSlug);
      if (!workspace) {
        setError('Workspace not found');
        setLoading(false);
        return;
      }
      setWorkspaceData(workspace);

      // Get projects in workspace
      const projects = await projectContext.getProjectsByWorkspace(workspace.id);
      
      // Find project by slug
      const project = findProjectBySlug(projects || [], projectSlug);
      
      if (!project) {
        setError('Project not found');
        setLoading(false);
        return;
      }
      setProjectData(project);

      // Get tasks for project
      const tasks = await taskContext.getTasksByProject(project.id);
      setProjectTasks(tasks || []);
      
      setDataLoaded(true);

    } catch (err) {
      console.error('Error loading page data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateProjectSlug = (projectName: string) => {
    if (!projectName) return '';
    
    return projectName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const findProjectBySlug = (projects: any[], slug: string) => {
    return projects.find(project => generateProjectSlug(project.name) === slug);
  };

  useEffect(() => {
    const currentRoute = `${workspaceSlug}/${projectSlug}/tasks`;
    
    // Prevent duplicate calls for the same route
    if (currentRouteRef.current === currentRoute && !isFirstRenderRef.current) {
      return;
    }
    
    // Only reset state and fetch if this is a new route
    if (currentRouteRef.current !== currentRoute) {
      setWorkspaceData(null);
      setProjectData(null);
      setProjectTasks([]);
      setError(null);
      setDataLoaded(false);
      setSelectedStatus('all'); // Reset filter as well
      
      currentRouteRef.current = currentRoute;
      loadData();
    }
    
    isFirstRenderRef.current = false;
  }, [workspaceSlug, projectSlug]);

  // Filter tasks based on selected status
  const filteredTasks = projectTasks.filter(task => {
    const statusMatch = selectedStatus === 'all' || task.status?.toLowerCase() === selectedStatus.toLowerCase();
    return statusMatch;
  });

  if (loading || !dataLoaded) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  if (!workspaceData || !projectData) {
    return <ErrorState error="Project or workspace not found" onRetry={loadData} />;
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'todo', label: 'Todo' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Breadcrumb className="mb-2">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/${workspaceSlug}`}>
                      {workspaceData?.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/${workspaceSlug}/${projectSlug}`}>
                      {projectData?.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Tasks</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              
              <h1 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <HiClipboardDocumentList size={20} />
                Tasks
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage and track all tasks for {projectData?.name}
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="min-w-[120px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add Task Button */}
              <Link href={`/${workspaceSlug}/${projectSlug}/tasks/new`}>
                <Button className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg text-sm px-4 h-9">
                  <HiPlus size={16} />
                  Create Task
                </Button>
              </Link>
            </div>
          </div>

          {/* Task Count and Filter Summary */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredTasks.length} of {projectTasks.length} tasks
            </span>
            {selectedStatus !== 'all' && (
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Filtered by:</span>
                <Badge variant="secondary">
                  {statusOptions.find(s => s.value === selectedStatus)?.label}
                </Badge>
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="text-primary hover:text-primary/80 text-xs underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-4">
          <TaskViewTabs currentView="list" baseUrl={`/${workspaceSlug}/${projectSlug}/tasks`} />
        </div>
        
        {/* Tasks List */}
        
          {filteredTasks.length > 0 ? (
            <TaskListView
              tasks={filteredTasks}
              workspaceSlug={workspaceSlug}
              projectSlug={projectSlug}
            />
          ) : (
            <CardContent className="text-center">
              <HiClipboardDocumentList size={48} className="mx-auto text-muted-foreground mb-4" />
              <CardTitle className="text-sm font-medium text-foreground mb-2">
                {projectTasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
              </CardTitle>
              <CardDescription className="mb-6">
                {projectTasks.length === 0 
                  ? 'Create your first task to get started with project management.'
                  : 'Try adjusting your filters or create a new task.'
                }
              </CardDescription>
              <div className="flex justify-center gap-3">
                <Link href={`/${workspaceSlug}/${projectSlug}/tasks/new`}>
                  <Button className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg text-sm px-4 h-9">
                    <HiPlus size={16} />
                    Create Task
                  </Button>
                </Link>
                {selectedStatus !== 'all' && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedStatus('all')}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        
      </div>
    </div>
  );
}