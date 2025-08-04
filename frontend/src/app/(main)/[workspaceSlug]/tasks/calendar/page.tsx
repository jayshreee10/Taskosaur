'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useTask } from '@/contexts/task-context';
import { useProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import TaskCalendarView from '@/components/tasks/views/TaskCalendarView';
import {
  HiPlus,
  HiCalendarDays,
  HiExclamationTriangle,
  HiFolder,
} from 'react-icons/hi2';
import { HiX } from "react-icons/hi";
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Props {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-4">
      <div className="animate-pulse space-y-6">
        <div className="h-6 bg-[var(--muted)] rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-[var(--muted)] rounded w-1/2 mb-8"></div>
        <div className="h-10 bg-[var(--muted)] rounded mb-4"></div>
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
  onRetry?: () => void;
}) => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-4">
      <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
        <HiExclamationTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-4">
          <span>{error}</span>
          <div className="flex gap-2">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="sm"
                className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
              >
                Try Again
              </Button>
            )}
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

export default function WorkspaceTasksCalendarPage({ params }: Props) {
  
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
        setError('Workspace not found. Please check the URL and try again.');
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

  const getSelectedProjectName = () => {
    if (selectedProject === 'all') return 'All Projects';
    return workspaceProjects.find(p => p.id === selectedProject)?.name || 'Unknown Project';
  };

  if (isLoading || !dataLoaded) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retryFetch} />;
  }

  if (!workspace) {
    return <ErrorState error="Workspace not found. Please check the URL and try again." onRetry={retryFetch} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Header - Consistent with other pages */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
              <HiCalendarDays className="w-5 h-5" />
              {workspace.name} Calendar
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              View and manage tasks across all projects in your workspace calendar.
            </p>
          </div>
          
          {/* Action Button */}
          <Button asChild className="h-9 px-4 border-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2">
            <Link href={`/${workspaceSlug}/tasks/new`}>
              <HiPlus className="w-4 h-4" />
              Add Task
            </Link>
          </Button>
        </div>

        {/* Filter Controls & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Project Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <HiFolder className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Project:</span>
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[200px] h-9 border-none bg-[var(--primary)]/5 text-[var(--foreground)] hover:bg-[var(--primary)]/10 transition-colors">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="border-none bg-[var(--card)] rounded-[var(--card-radius)] shadow-lg">
                <SelectItem value="all">All Projects</SelectItem>
                {workspaceProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Stats */}
          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--foreground)]">{filteredTasks.length}</span>
              <span>of {workspaceTasks.length} tasks</span>
            </div>
            {selectedProject !== 'all' && (
              <>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="px-2 py-1 text-xs border-none bg-[var(--primary)]/10 text-[var(--primary)] flex items-center gap-1"
                  >
                    {getSelectedProjectName()}
                    <button
                      onClick={() => setSelectedProject('all')}
                      className="ml-1 hover:bg-[var(--primary)]/20 rounded-full p-0.5 transition-colors"
                      title="Clear filter"
                    >
                      <HiX className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              </>
            )}
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
                    Task Calendar
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--muted-foreground)] mt-1">
                    {selectedProject === 'all' 
                      ? `Showing all tasks from ${workspaceProjects.length} projects` 
                      : `Showing tasks from ${getSelectedProjectName()}`
                    }
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
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mb-4 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                    <HiCalendarDays className="w-6 h-6 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--foreground)] mb-1">
                    No tasks found
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4">
                    {selectedProject === 'all' 
                      ? 'Create your first task to see it on the calendar' 
                      : 'No tasks found for the selected project'
                    }
                  </p>
                  <Button asChild variant="outline" className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]">
                    <Link href={`/${workspaceSlug}/tasks/new`}>
                      <HiPlus className="w-4 h-4 mr-2" />
                      Create Task
                    </Link>
                  </Button>
                </div>
              ) : (
                <TaskCalendarView
                  tasks={filteredTasks}
                  workspaceSlug={workspaceSlug}
                  projectSlug=""
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}