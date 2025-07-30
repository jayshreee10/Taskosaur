'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useTask } from '@/contexts/task-context';
import { useProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskListView from '@/components/tasks/views/TaskListView';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HiPlus,
  HiClipboardDocumentList,
  HiExclamationTriangle,
  HiArrowPath,
} from 'react-icons/hi2';

interface Props {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
          <div className="text-sm text-muted-foreground">Loading workspace tasks...</div>
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
        <AlertTitle>Error loading workspace tasks</AlertTitle>
        <AlertDescription>
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

export default function WorkspaceTasksPage(props: Props) {
  const [workspace, setWorkspace] = useState<any>(null);
  const [workspaceTasks, setWorkspaceTasks] = useState<any[]>([]);
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [workspaceSlug, setWorkspaceSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const fetchingRef = useRef(false);
  const currentSlugRef = useRef<string>('');

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getTasksByWorkspace } = useTask();
  const { getProjectsByWorkspace } = useProjectContext();
  const { isAuthenticated } = useAuth();

  const fetchData = async () => {
    try {
      const params = await props.params;
      const slug = params.workspaceSlug;
      
      if (fetchingRef.current && currentSlugRef.current === slug) {
        return;
      }
      
      if (currentSlugRef.current === slug && dataLoaded && workspace) {
        return;
      }
      
      fetchingRef.current = true;
      currentSlugRef.current = slug;
      
      setLoading(true);
      setError(null);
      setDataLoaded(false);
      setWorkspaceSlug(slug);
      
      if (!isAuthenticated()) {
        setError('Authentication required');
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const workspaceData = await getWorkspaceBySlug(slug);
      
      if (!workspaceData) {
        setLoading(false);
        fetchingRef.current = false;
        notFound();
        return;
      }

      setWorkspace(workspaceData);

      const [tasks, projects] = await Promise.all([
        getTasksByWorkspace(workspaceData.id),
        getProjectsByWorkspace(workspaceData.id)
      ]);

      setWorkspaceTasks(tasks || []);
      setProjectsData(projects || []);
      
      setDataLoaded(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    const initializeSlug = async () => {
      const params = await props.params;
      const slug = params.workspaceSlug;
      
      if (currentSlugRef.current !== slug) {
        fetchingRef.current = false;
        currentSlugRef.current = '';
        setDataLoaded(false);
        setWorkspace(null);
        setWorkspaceTasks([]);
        setProjectsData([]);
      }
      
      fetchData();
    };
    
    initializeSlug();
  }, [props.params]);

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

  const filteredTasks = workspaceTasks.filter(task => {
    const projectMatch = selectedProject === 'all' || task.projectId === selectedProject;
    const statusMatch = selectedStatus === 'all' || task.status?.toLowerCase() === selectedStatus.toLowerCase();
    return projectMatch && statusMatch;
  });

  if (loading || !dataLoaded) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retryFetch} />;
  }

  if (!workspace) {
    notFound();
    return null;
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
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <HiClipboardDocumentList size={20} />
                {workspace.name} Tasks
              </h1>
              <p className="text-sm text-muted-foreground">
                All tasks across all projects in {workspace.name} workspace.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projectsData.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="min-w-[120px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Link href={`/${workspaceSlug}/tasks/new`}>
                <Button className="flex items-center gap-2">
                  <HiPlus size={16} />
                  Add Task
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredTasks.length} of {workspaceTasks.length} tasks
            </span>
            {(selectedProject !== 'all' || selectedStatus !== 'all') && (
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Filtered by:</span>
                {selectedProject !== 'all' && (
                  <Badge variant="secondary">
                    {projectsData.find(p => p.id === selectedProject)?.name || 'Project'}
                  </Badge>
                )}
                {selectedStatus !== 'all' && (
                  <Badge variant="secondary">
                    {statusOptions.find(s => s.value === selectedStatus)?.label}
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSelectedProject('all');
                    setSelectedStatus('all');
                  }}
                  className="text-primary hover:text-primary/80 text-xs underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <TaskViewTabs currentView="" baseUrl={`/${workspaceSlug}/tasks`} />
        </div>
        
        <Card>
          {filteredTasks.length > 0 ? (
            <TaskListView
              tasks={filteredTasks}
              workspaceSlug={workspaceSlug}
              projects={projectsData}
            />
          ) : (
            <CardContent className="p-8 text-center">
              <HiClipboardDocumentList size={48} className="mx-auto text-muted-foreground mb-4" />
              <CardTitle className="text-sm font-medium text-foreground mb-2">
                {workspaceTasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
              </CardTitle>
              <CardDescription className="mb-6">
                {workspaceTasks.length === 0 
                  ? 'Create your first task to get started with project management.'
                  : 'Try adjusting your filters or create a new task.'
                }
              </CardDescription>
              <Link href={`/${workspaceSlug}/tasks/new`}>
                <Button className="flex items-center gap-2">
                  <HiPlus size={16} />
                  Create Task
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}