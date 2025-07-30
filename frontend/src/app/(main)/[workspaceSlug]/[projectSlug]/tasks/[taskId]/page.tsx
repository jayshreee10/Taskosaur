"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTask } from '@/contexts/task-context';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import TaskDetailClient from '@/components/tasks/TaskDetailClient';
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
import '@/styles/components/tasks.css';
import {
  HiExclamationTriangle,
  HiArrowLeft
} from 'react-icons/hi2';

interface Props {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
    taskId: string;
  }>;
}

const LoadingSkeleton = () => (
  <div className="task-detail-loading">
    <div className="task-detail-loading-container">
      <div className="task-detail-loading-content">
        <div className="task-detail-loading-breadcrumb"></div>
        <div className="task-detail-loading-grid">
          <div className="task-detail-loading-main">
            <Card>
              <CardContent className="p-6">
                <div className="task-detail-loading-card-header"></div>
                <div className="task-detail-loading-lines">
                  <div className="task-detail-loading-line task-detail-loading-line-full"></div>
                  <div className="task-detail-loading-line task-detail-loading-line-3-4"></div>
                  <div className="task-detail-loading-line task-detail-loading-line-1-2"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="task-detail-loading-card-header"></div>
                <div className="task-detail-loading-lines">
                  <div className="task-detail-loading-line task-detail-loading-line-full"></div>
                  <div className="task-detail-loading-line task-detail-loading-line-3-4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="task-detail-loading-sidebar">
            <Card>
              <CardContent className="p-6">
                <div className="task-detail-loading-card-header"></div>
                <div className="task-detail-loading-lines">
                  <div className="task-detail-loading-input"></div>
                  <div className="task-detail-loading-input"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="task-detail-loading-card-header"></div>
                <div className="task-detail-loading-lines">
                  <div className="task-detail-loading-input"></div>
                  <div className="task-detail-loading-input"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ 
  error, 
  onGoBack,
  onRetry 
}: { 
  error: string;
  onGoBack: () => void;
  onRetry?: () => void;
}) => (
  <div className="task-detail-error">
    <div className="task-detail-error-container">
      <Card className="task-detail-error-content">
        <CardHeader>
          <CardTitle className="task-detail-error-header">
            <HiExclamationTriangle className="task-detail-error-icon" />
            <span className="task-detail-error-title">
              Error loading task
            </span>
          </CardTitle>
          <CardDescription className="task-detail-error-message">
            {error || 'Task not found'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <div className="task-detail-error-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={onGoBack}
            >
              <HiArrowLeft size={16} />
              Go back
            </Button>
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
              >
                Try again
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  </div>
);

export default function TaskDetailPage({ params }: Props) {
  const [task, setTask] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const resolvedParams = use(params);
  const { workspaceSlug, projectSlug, taskId } = resolvedParams;
  const router = useRouter();
  
  const { getTaskById } = useTask();
  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace } = useProjectContext();
  const { isAuthenticated } = useAuth();
  
  // Global fetch prevention hook
  const {
    shouldPreventFetch,
    markFetchStart,
    markFetchComplete,
    markFetchError,
    getCachedData,
    reset
  } = useGlobalFetchPrevention();

  // Generate slug from project name
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

  // Find project by slug
  const findProjectBySlug = (projects: any[], slug: string) => {
    return projects.find(
      (project) => generateProjectSlug(project.name) === slug
    );
  };

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }
    
    const fetchKey = `task-detail-${workspaceSlug}/${projectSlug}/tasks/${taskId}`;
    
    // Check if we should prevent this fetch
    if (shouldPreventFetch(fetchKey)) {
      // Try to get cached data
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setTask(cachedData.task);
        setWorkspace(cachedData.workspace);
        setProject(cachedData.project);
        setIsLoading(false);
        return;
      }
    }
    
    // Reset state for new fetch
    setTask(null);
    setWorkspace(null);
    setProject(null);
    setError(null);
    setIsLoading(true);
    
    // Fetch data
    const fetchData = async () => {
      // Mark fetch as started
      markFetchStart(fetchKey);
      
      try {
        // Fetch workspace
        const workspaceData = await getWorkspaceBySlug(workspaceSlug);
        if (!workspaceData) {
          throw new Error('Workspace not found');
        }
        setWorkspace(workspaceData);
        
        // Fetch projects
        const projectsData = await getProjectsByWorkspace(workspaceData.id);
        const foundProject = findProjectBySlug(projectsData || [], projectSlug);
        if (!foundProject) {
          throw new Error('Project not found');
        }
        setProject(foundProject);
        
        // Fetch task
        const taskData = await getTaskById(taskId);
        if (!taskData) {
          throw new Error('Task not found');
        }
        
        // Enhance task data
        const enhancedTask = {
          ...taskData,
          project: {
            id: foundProject.id,
            name: foundProject.name,
            slug: generateProjectSlug(foundProject.name)
          },
          workspace: {
            id: workspaceData.id,
            name: workspaceData.name,
            slug: workspaceData.slug || workspaceSlug
          },
          // Add default values for fields that might not come from API
          comments: (taskData as any).comments || [],
          attachments: (taskData as any).attachments || [],
          subtasks: (taskData as any).subtasks || [],
          tags: (taskData as any).tags || [],
          reporter: (taskData as any).reporter || null,
          updatedAt: (taskData as any).updatedAt || (taskData as any).createdAt || new Date().toISOString(),
        };
        
        setTask(enhancedTask);
        
        // Mark fetch as complete and cache the data
        markFetchComplete(fetchKey, {
          task: enhancedTask,
          workspace: workspaceData,
          project: foundProject
        });
        

        
      } catch (error) {
        console.error('❌ [TASK_DETAIL] Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load task data');
        markFetchError(fetchKey);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceSlug, projectSlug, taskId]); // Only depend on route parameters

  // Manual retry function
  const retryFetch = () => {
    const fetchKey = `task-detail-${workspaceSlug}/${projectSlug}/tasks/${taskId}`;
    reset(fetchKey);
    
    // Reset state
    setTask(null);
    setWorkspace(null);
    setProject(null);
    setError(null);
    setIsLoading(true);
    
    // Re-trigger the effect by forcing a state update
    setIsLoading(true);
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error || !task) {
    return (
      <ErrorState 
        error={error || 'Task not found'} 
        onGoBack={() => router.back()}
        onRetry={retryFetch}
      />
    );
  }

  return (
    <TaskDetailClient
      task={task}
      workspaceSlug={workspaceSlug}
      projectSlug={projectSlug}
      taskId={taskId}
    />
  );
}