"use client";
import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskKanbanView from '@/components/tasks/views/TaskKanbanView';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useTask } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-200 border-t-amber-600"></div>
          <div className="text-sm text-[var(--muted-foreground)]">Loading project kanban...</div>
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
      <Card className="border-[var(--destructive)]/20 bg-[var(--destructive)]/10">
        <CardHeader>
          <CardTitle className="flex items-start gap-3">
            <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <span className="text-sm font-semibold text-[var(--destructive)]">
              Error loading project kanban
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-[var(--destructive)]">
            {error}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            onClick={onRetry}
            variant="secondary"
            className="flex items-center gap-2 text-[var(--destructive)] border-[var(--destructive)]/30"
          >
            <HiArrowPath size={16} />
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
);

export default function ProjectTasksKanbanPage({ params }: Props) {
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
    const currentRoute = `${workspaceSlug}/${projectSlug}/tasks/kanban`;
    
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
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  if (!workspaceData || !projectData) {
    return <ErrorState error="Project or workspace not found" onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href={`/${workspaceSlug}`} className="hover:text-foreground">
                  {workspaceData?.name}
                </Link>
                <span>/</span>
                <Link href={`/${workspaceSlug}/${projectSlug}`} className="hover:text-foreground">
                  {projectData?.name}
                </Link>
              </div>
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
              <Link href={`/${workspaceSlug}/${projectSlug}/tasks/new`}>
                <Button size="md" className="flex items-center gap-2">
                  <HiPlus size={16} />
                  Create Task
                </Button>
              </Link>
            </div>
          </div>
          {/* Task Count */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {projectTasks.length} tasks
            </span>
          </div>
        </div>
        {/* View Tabs */}
        <div className="mb-6">
          <TaskViewTabs currentView="kanban" baseUrl={`/${workspaceSlug}/${projectSlug}/tasks`} />
        </div>
        {/* Kanban Board */}
        <div className="">
          <TaskKanbanView
            tasks={projectTasks}
            workspaceSlug={workspaceSlug}
            projectSlug={projectSlug}
          />
        </div>
      </div>
    </div>
  );
}