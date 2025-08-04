'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTask } from '@/contexts/task-context';
import { useProject } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskKanbanView from '@/components/tasks/views/TaskKanbanView';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HiPlus, HiViewColumns, HiExclamationTriangle } from 'react-icons/hi2';
import { Task } from '@/contexts/task-context';
import { Project } from '@/utils/api';

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
        <div className="h-10 bg-muted rounded mb-4"></div>
        <Card className="border-none bg-[var(--card)]">
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

export default function TasksKanbanPage() {
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
  const [priorityFilter, setPriorityFilter] = useState<"all" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST">("all");

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
        limit: 100, // Load more for kanban view
        ...(priorityFilter !== "all" && { priority: priorityFilter }),
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
    currentOrganization?.id,
    priorityFilter
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

  if (isLoading && !isInitializedRef.current) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-background border-none">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 ">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <HiViewColumns size={20} />
                My Tasks
              </h1>
              <p className="text-sm text-muted-foreground">
                Organize and track your tasks using the kanban board view.
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Priority Filter */}
              <div className="flex items-center gap-2">
                <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as "all" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST") }>
                  <SelectTrigger className="w-[140px] border-none bg-[var(--card)]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="border-none bg-[var(--popover)]">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="HIGHEST">Highest</SelectItem>
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

          {/* Task Count */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {displayTasks.length} tasks
            </span>
            <span>•</span>
            <span>Kanban Board View</span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-4 -mt-4">
          <TaskViewTabs currentView="kanban" baseUrl="/tasks" />
        </div>

        {/* Kanban Board */}
        <Card className="border-none shadow-none p-0">
            <CardContent className="p-0 min-h-[70vh] h-[70vh]"  >
               <TaskKanbanView
                  tasks={normalizeTasks(displayTasks)}
                  projects={displayProjects}
                />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
