'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTask } from '@/contexts/task-context';
import { useProject } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskGanttView from '@/components/tasks/views/TaskGanttView';
import {
  HiPlus,
  HiChartBarSquare,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Task } from '@/contexts/task-context';
import { Project } from '@/utils/api';

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
        <div className="h-10 bg-muted rounded mb-4"></div>
        <Card>
          <CardContent className="p-6">
            <div className="h-96 bg-muted rounded"></div>
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
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto p-6">
      <Alert variant="destructive">
        <HiExclamationTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <span>{error}</span>
          <Button onClick={onRetry} variant="outline" size="sm">
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  </div>
);

export default function TasksGanttPage() {
  const { 
    getTasksByOrganization,
  } = useTask();
  
  const { 
    getProjectsByUserId,
  } = useProject();
  
  const { getCurrentUser } = useAuth();
  const { currentOrganization } = useOrganization();

  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);
  const [displayProjects, setDisplayProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState('all');

  const isInitializedRef = useRef(false);
  const currentUser = getCurrentUser();

  const loadData = useCallback(async () => {
    if (!currentUser?.id || !currentOrganization?.id) return;

    try {
      setError(null);
      setIsLoading(true);

      // Load projects for the current user (only on initial load)
      if (!isInitializedRef.current) {
        const projectsData = await getProjectsByUserId(currentUser.id);
        setDisplayProjects(projectsData || []);
      }

      // Prepare parameters for getTasksByOrganization
      const params = {
        page: 1,
        limit: 100, // Load more for gantt view
      };

      // Load tasks from organization
      const result = await getTasksByOrganization(currentOrganization.id, params);
      setDisplayTasks(result.tasks);

      isInitializedRef.current = true;
    } catch (error) {
      console.error("Error loading tasks:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentUser?.id,
    currentOrganization?.id
  ]);

  useEffect(() => {
    if (currentUser?.id && currentOrganization?.id) {
      loadData();
    }
  }, [loadData]);

  const handleRetry = useCallback(() => {
    isInitializedRef.current = false;
    setError(null);
    loadData();
  }, [loadData]);

  // Patch: Normalize tasks to ensure 'key' property exists for type compatibility
  const normalizeTasks = (tasks: any[]): any[] =>
    tasks.map(task => ({
      ...task,
      key: typeof task.key === 'string' ? task.key : (task.id || ''),
    }));

  // Filter tasks based on selected project
  const filteredTasks = selectedProject === 'all'
    ? normalizeTasks(displayTasks)
    : normalizeTasks(displayTasks.filter(task => task.projectId === selectedProject));

  if (isLoading && !isInitializedRef.current) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <HiChartBarSquare size={20} />
                My Tasks
              </h1>
              <p className="text-sm text-muted-foreground">
                View project timelines and task dependencies using the Gantt chart.
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
                    {displayProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Task Button */}
              <Button asChild>
                <Link href="/tasks/new" className="flex items-center gap-2">
                  <HiPlus size={16} />
                  Add Task
                </Link>
              </Button>
            </div>
          </div>

          {/* Task Count and Filter Summary */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredTasks.length} of {displayTasks.length} tasks
            </span>
            <span>•</span>
            <span>Timeline View</span>
            {selectedProject !== 'all' && (
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Filtered by:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                  {displayProjects.find(p => p.id === selectedProject)?.name || 'Project'}
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
          <TaskViewTabs currentView="gantt" baseUrl="/tasks" />
        </div>

        {/* Gantt Chart */}
        <Card>
          <CardContent className="gantt-wrapper p-6">
            <TaskGanttView
              tasks={filteredTasks}
              workspaceSlug=""
              projectSlug=""
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
