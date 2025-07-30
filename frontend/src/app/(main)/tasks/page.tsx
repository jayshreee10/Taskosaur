"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getTasks, getProjects } from '@/utils/apiUtils';
import TaskListView from '@/components/tasks/views/TaskListView';
import {
  HiPlus,
  HiClipboardDocumentList,
  HiFunnel,
  HiMagnifyingGlass,
  HiXMark,
  HiCheckCircle,
  HiUser,
  HiClock,
  HiUserPlus,
  HiEye,
  HiListBullet,
  HiViewColumns,
} from 'react-icons/hi2';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task } from '@/contexts/task-context';



interface Project {
  id: string;
  name: string;
  slug: string;
  workspace?: {
    slug: string;
  };
}

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="h-6 bg-[var(--muted)] rounded w-32 mb-2"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-64"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-[var(--muted)] rounded w-32"></div>
            <div className="h-10 bg-[var(--muted)] rounded w-24"></div>
          </div>
        </div>
        <div className="h-4 bg-[var(--muted)] rounded w-16 mb-4"></div>
        <Card className="border-[var(--border)]">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-[var(--muted)] rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                    <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
    <Card className="max-w-md w-full mx-4 border-[var(--border)]">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-[var(--destructive)]/10 rounded-lg flex items-center justify-center mx-auto mb-6 text-[var(--destructive)]">
          <HiClipboardDocumentList size={24} />
        </div>
        <CardTitle className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Something went wrong
        </CardTitle>
        <CardDescription className="text-sm text-[var(--muted-foreground)] mb-6">
          {error}
        </CardDescription>
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState("all");

  const isInitializedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const [tasksData, projectsData] = await Promise.all([
        getTasks(),
        getProjects()
      ]);

      setTasks(tasksData || []);
      setProjects(projectsData || []);
      isInitializedRef.current = true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetry = useCallback(() => {
    isInitializedRef.current = false;
    setError(null);
    loadData();
  }, [loadData]);

  const getDefaultWorkspaceAndProject = () => {
    const defaultWorkspace = projects.length > 0 && projects[0].workspace 
      ? projects[0].workspace 
      : { slug: 'default-workspace' };
    const defaultProject = projects.length > 0 
      ? projects[0] 
      : { slug: 'default-project' };
    
    return { defaultWorkspace, defaultProject };
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  const { defaultWorkspace, defaultProject } = getDefaultWorkspaceAndProject();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="flex justify-between items-center mb-6 lg:mb-8">
              <div className="h-8 bg-[var(--muted)] rounded w-1/3"></div>
              <div className="h-10 bg-[var(--muted)] rounded w-40"></div>
            </div>
            <div className="h-96 bg-[var(--muted)] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
              <HiClipboardDocumentList size={20} />
              My Tasks
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage and track all your assigned tasks in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={filterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="min-w-[140px] border-[var(--border)] bg-[var(--background)]">
                <SelectValue placeholder="Filter tasks" />
              </SelectTrigger>
              <SelectContent className="border-[var(--border)] bg-[var(--popover)]">
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="assigned">Assigned to me</SelectItem>
                <SelectItem value="created">Created by me</SelectItem>
                <SelectItem value="subscribed">Subscribed</SelectItem>
              </SelectContent>
            </Select>
            <Link href={`/${defaultWorkspace.slug}/${defaultProject.slug}/tasks/new`}>
              <Button className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90">
                <HiPlus size={16} />
                Add Task
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-sm text-[var(--muted-foreground)]">
          {tasks?.length || 0} tasks
        </div>

        {tasks && tasks.length > 0 ? (
          <TaskListView tasks={tasks} projects={projects} />
        ) : (
          <Card className="border-[var(--border)]">
            <CardContent className="p-8 text-center">
              <HiClipboardDocumentList
                size={48}
                className="mx-auto text-[var(--muted-foreground)] mb-4"
              />
              <CardTitle className="text-sm font-medium mb-2 text-[var(--foreground)]">
                No tasks yet
              </CardTitle>
              <CardDescription className="text-xs text-[var(--muted-foreground)] mb-6">
                Create your first task to get started with project management.
              </CardDescription>
              <Link href={`/${defaultWorkspace.slug}/${defaultProject.slug}/tasks/new`}>
                <Button className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90">
                  <HiPlus size={16} />
                  Create Task
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}