"use client";
import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskCalendarView from '@/components/tasks/views/TaskCalendarView';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useTask } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  HiPlus,
  HiCalendarDays,
  HiExclamationTriangle,
  HiArrowPath,
  HiChevronRight,
  HiFolder,
} from 'react-icons/hi2';

interface Props {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-4">
      <div className="animate-pulse space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-[var(--muted)] rounded w-20"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-4"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-24"></div>
        </div>
        
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-[var(--muted)] rounded w-1/3"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-1/2"></div>
        </div>
        
        {/* Controls skeleton */}
        <div className="h-10 bg-[var(--muted)] rounded w-32"></div>
        
        {/* Calendar skeleton */}
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
          <CardContent className="p-6">
            <div className="h-96 bg-[var(--muted)] rounded"></div>
          </CardContent>
        </Card>
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
    <div className="max-w-7xl mx-auto p-4">
      <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
        <HiExclamationTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-4">
          <span>{error}</span>
          <div className="flex gap-2">
            <Button 
              onClick={onRetry}
              variant="outline" 
              size="sm"
              className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center gap-2"
            >
              <HiArrowPath className="w-4 h-4" />
              Try Again
            </Button>
            <Link 
              href="/workspaces"
              className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 underline self-start"
            >
              Back to Workspaces
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  </div>
);

export default function ProjectTasksCalendarPage({ params }: Props) {
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

  // Track the current route to prevent duplicate calls
  const currentRouteRef = useRef<string>('');
  const isFirstRenderRef = useRef(true);

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

      const workspace = await workspaceContext.getWorkspaceBySlug(workspaceSlug);
      if (!workspace) {
        setError('Workspace not found');
        setLoading(false);
        return;
      }
      setWorkspaceData(workspace);

      const projects = await projectContext.getProjectsByWorkspace(workspace.id);
      const project = findProjectBySlug(projects || [], projectSlug);
      
      if (!project) {
        setError('Project not found');
        setLoading(false);
        return;
      }
      setProjectData(project);

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

  useEffect(() => {
    const currentRoute = `${workspaceSlug}/${projectSlug}/tasks/calendar`;
    
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
      
      currentRouteRef.current = currentRoute;
      loadData();
    }
    
    isFirstRenderRef.current = false;
  }, [workspaceSlug, projectSlug]);

  if (loading || !dataLoaded) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  if (!workspaceData || !projectData) {
    return <ErrorState error="Project or workspace not found" onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Link 
            href={`/${workspaceSlug}`} 
            className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            <HiFolder className="w-4 h-4" />
            {workspaceData?.name}
          </Link>
          <HiChevronRight className="w-4 h-4" />
          <Link 
            href={`/${workspaceSlug}/${projectSlug}`} 
            className="hover:text-[var(--foreground)] transition-colors"
          >
            {projectData?.name}
          </Link>
          <HiChevronRight className="w-4 h-4" />
          <span className="text-[var(--foreground)]">Calendar</span>
        </div>

        {/* Header - Consistent with other pages */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
              <HiCalendarDays className="w-5 h-5" />
              {projectData?.name} Calendar
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              View and manage tasks for {projectData?.name} project in calendar format.
            </p>
          </div>
          
          {/* Action Button */}
          <Button asChild className="h-9 px-4 border-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2">
            <Link href={`/${workspaceSlug}/${projectSlug}/tasks/new`}>
              <HiPlus className="w-4 h-4" />
              Create Task
            </Link>
          </Button>
        </div>

        {/* Task Stats */}
        <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--foreground)]">{projectTasks.length}</span>
            <span>{projectTasks.length === 1 ? 'task' : 'tasks'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span>Project:</span>
            <span className="font-medium text-[var(--foreground)]">{projectData?.name}</span>
          </div>
        </div>

     
        {/* Calendar Content */}
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
          <CardContent className="p-0">
            {/* Calendar Header */}
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <HiCalendarDays className="w-5 h-5 text-[var(--muted-foreground)]" />
                    Project Calendar
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--muted-foreground)] mt-1">
                    Showing {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'} for {projectData?.name}
                  </CardDescription>
                </div>
                
                {/* Calendar Controls could go here */}
                <div className="flex items-center gap-2">
                  {/* Add any calendar-specific controls here */}
                </div>
              </div>
            </div>

            {/* Calendar View */}
            <div className="calendar-wrapper p-6">
              {projectTasks.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mb-4 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                    <HiCalendarDays className="w-6 h-6 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--foreground)] mb-1">
                    No tasks found
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4">
                    Create your first task for {projectData?.name} to see it on the calendar
                  </p>
                  <Button asChild variant="outline" className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]">
                    <Link href={`/${workspaceSlug}/${projectSlug}/tasks/new`}>
                      <HiPlus className="w-4 h-4 mr-2" />
                      Create Task
                    </Link>
                  </Button>
                </div>
              ) : (
                <TaskCalendarView
                  tasks={projectTasks}
                  workspaceSlug={workspaceSlug}
                  projectSlug={projectSlug}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}