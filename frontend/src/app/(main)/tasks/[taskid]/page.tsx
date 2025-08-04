"use client";

import { useState, useEffect, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useTask } from '@/contexts/task-context';
import TaskDetailClient from '@/components/tasks/TaskDetailClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HiExclamationTriangle, HiArrowLeft } from 'react-icons/hi2';

interface Props {
  params: Promise<{
    taskid: string;
  }>;
}

export default function TaskPage({ params }: Props) {
  // Use React's `use` hook to unwrap the Promise
  const resolvedParams = use(params);
  const taskid = resolvedParams.taskid;
  
  const [task, setTask] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { getTaskById } = useTask();

  // Generate slug from project name (keeping your existing utility function)
  const generateProjectSlug = (projectName: string) => {
    if (!projectName) return "";
    return projectName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  useEffect(() => {
    if (!taskid) {
      setError('Invalid URL parameters');
      setIsLoading(false);
      return;
    }

    setTask(null);
    setError(null);
    setIsLoading(true);

    const fetchData = async () => {
      try {
        const taskData = await getTaskById(taskid);
        if (!taskData) {
          throw new Error('Task not found');
        }
        setTask(taskData);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load task data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [taskid, getTaskById]);

  const retryFetch = () => {
    setTask(null);
    setError(null);
    setIsLoading(true);
    
    // Re-trigger the useEffect by setting a slight delay
    setTimeout(() => {
      const fetchData = async () => {
        try {
          const taskData = await getTaskById(taskid);
          if (!taskData) {
            throw new Error('Task not found');
          }
          setTask(taskData);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to load task data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, 100);
  };

  // Loading State - Following your dashboard loading pattern
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <div className="animate-pulse space-y-6">
            {/* Breadcrumb skeleton */}
            <div className="h-4 bg-[var(--muted)] rounded w-1/3 mb-6"></div>
            
            {/* Main grid layout matching your established patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content area */}
              <div className="lg:col-span-2 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="h-6 bg-[var(--muted)] rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="h-4 bg-[var(--muted)] rounded w-full"></div>
                        <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                        <div className="h-4 bg-[var(--muted)] rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="h-5 bg-[var(--muted)] rounded w-2/3 mb-2"></div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="h-9 bg-[var(--muted)] rounded"></div>
                        <div className="h-9 bg-[var(--muted)] rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State - Following your Alert component pattern
  if (error || !task) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <div className="max-w-md mx-auto mt-16">
            <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
              <HiExclamationTriangle className="h-4 w-4" />
              <AlertTitle>Task Not Found</AlertTitle>
              <AlertDescription className="mt-2">
                {error || 'The task you are looking for could not be found.'}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3 mt-6 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center gap-2"
              >
                <HiArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={retryFetch}
                className="h-9 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success State - Pass data to TaskDetailClient
  const projectSlug = task?.project?.slug || '';
  const workspaceSlug = task?.project?.workspace?.slug || task?.workspace?.slug || '';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TaskDetailClient
        task={task}
        workspaceSlug={workspaceSlug}
        projectSlug={projectSlug}
        taskId={taskid}
      />
    </div>
  );
}