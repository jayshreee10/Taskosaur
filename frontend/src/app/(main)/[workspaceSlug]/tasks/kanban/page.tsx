'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useTask } from '@/contexts/task-context';
import { useProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskKanbanView from '@/components/tasks/views/TaskKanbanView';
import {
  HiPlus,
  HiChevronDown,
  HiViewColumns,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
        <div className="h-10 bg-muted rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-20 bg-muted rounded"></div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ 
  error, 
  onBack 
}: { 
  error: string;
  onBack?: () => void;
}) => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto p-6">
      <Alert variant="destructive">
        <HiExclamationTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <span>{error}</span>
          <Link 
            href="/workspaces"
            className="text-sm text-primary hover:text-primary/80 underline"
          >
            Back to Workspaces
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  </div>
);

export default function WorkspaceTasksKanbanPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { workspaceSlug } = resolvedParams;
  
  // Get authentication context
  const { isAuthenticated } = useAuth();
  
  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getTasksByWorkspace } = useTask();
  const { getProjectsByWorkspace } = useProjectContext();
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [workspaceProjects, setWorkspaceProjects] = useState<any[]>([]);
  const [workspaceTasks, setWorkspaceTasks] = useState<any[]>([]);
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchingRef = useRef(false);
  const currentSlugRef = useRef<string>('');

  const fetchData = useCallback(async () => {
    try {
      const slug = workspaceSlug;
      
      if (fetchingRef.current && currentSlugRef.current === slug) {
        return;
      }
      
      if (currentSlugRef.current === slug && dataLoaded && workspace) {
        return;
      }
      
      fetchingRef.current = true;
      currentSlugRef.current = slug;
      
      setIsLoading(true);
      setError('');
      setDataLoaded(false);
      
      if (!isAuthenticated()) {
        setError('Authentication required');
        setIsLoading(false);
        fetchingRef.current = false;
        return;
      }

      const workspaceData = await getWorkspaceBySlug(slug);
      
      if (!workspaceData) {
        setIsLoading(false);
        fetchingRef.current = false;
        return;
      }

      setWorkspace(workspaceData);

      const [tasks, projects] = await Promise.all([
        getTasksByWorkspace(workspaceData.id),
        getProjectsByWorkspace(workspaceData.id)
      ]);

      setWorkspaceTasks(tasks || []);
      setProjectsData(projects || []);
      setWorkspaceProjects(projects || []);
      
      setDataLoaded(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [workspaceSlug, workspace, dataLoaded, getWorkspaceBySlug, getTasksByWorkspace, getProjectsByWorkspace, isAuthenticated]);

  useEffect(() => {
    if (currentSlugRef.current !== workspaceSlug) {
      fetchingRef.current = false;
      currentSlugRef.current = '';
      setDataLoaded(false);
      setWorkspace(null);
      setWorkspaceTasks([]);
      setProjectsData([]);
      setWorkspaceProjects([]);
    }
    
    fetchData();
  }, [workspaceSlug, fetchData]);

  useEffect(() => {
    return () => {
      fetchingRef.current = false;
      currentSlugRef.current = '';
    };
  }, []);

  const retryFetch = () => {
    fetchingRef.current = false;
    currentSlugRef.current = '';
    setDataLoaded(false);
    fetchData();
  };

  // Filter tasks based on selected project
  const filteredTasks = selectedProject === 'all' 
    ? workspaceTasks 
    : workspaceTasks.filter(task => task.project === selectedProject);

  if (isLoading || !dataLoaded) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onBack={retryFetch} />;
  }

  if (!workspace) {
    return <ErrorState error="Workspace not found. Please check the URL and try again." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <HiViewColumns size={20} />
                {workspace.name} Tasks
              </h1>
              <p className="text-sm text-muted-foreground">
                All tasks across all projects in {workspace.name} workspace.
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Project Filter */}
              <div className="flex items-center gap-2">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {workspaceProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Task Button */}
              <Button asChild>
                <Link href={`/${workspaceSlug}/tasks/new`} className="flex items-center gap-2">
                  <HiPlus size={16} />
                  Add Task
                </Link>
              </Button>
            </div>
          </div>

          {/* Task Count and Filter Summary */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredTasks.length} of {workspaceTasks.length} tasks
            </span>
            {selectedProject !== 'all' && (
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Filtered by:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                  {workspaceProjects.find(p => p.id === selectedProject)?.name || 'Project'}
                </span>
                <button
                  onClick={() => setSelectedProject('all')}
                  className="text-primary hover:text-primary/80 text-xs underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-6">
          <TaskViewTabs currentView="kanban" baseUrl={`/${workspaceSlug}/tasks`} />
        </div>

        {/* Kanban Board */}
        <div className="flex-1 min-h-0 flex flex-col">
          <TaskKanbanView 
            tasks={filteredTasks} 
            workspaceSlug={workspaceSlug} 
            projects={projectsData}
          />
        </div>
      </div>
    </div>
  );
}