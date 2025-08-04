"use client";

import { useState, useEffect, use } from "react";
import { notFound, useRouter } from "next/navigation";
import { useTask } from "@/contexts/task-context";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalFetchPrevention } from "@/hooks/useGlobalFetchPrevention";
import TaskDetailClient from "@/components/tasks/TaskDetailClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "@/styles/components/tasks.css";
import { HiExclamationTriangle, HiArrowLeft } from "react-icons/hi2";
import { TokenManager } from "@/lib/api";
interface Props {
  params: Promise<{
    workspaceSlug: string;
    taskId: string;
  }>;
}

export default function TaskDetailPage({ params }: Props) {
  const [task, setTask] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Properly unwrap params using React.use()
  const resolvedParams = use(params);
  const { workspaceSlug, taskId } = resolvedParams;
  const router = useRouter();

  const { getTaskById } = useTask();
  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace } = useProjectContext();
  const { getCurrentUser } = useAuth();

  // Global fetch prevention hook
  const {
    shouldPreventFetch,
    markFetchStart,
    markFetchComplete,
    markFetchError,
    getCachedData,
    reset,
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

  useEffect(() => {
    if (!workspaceSlug || !taskId) {
      setError("Invalid URL parameters");
      setIsLoading(false);
      return;
    }

    const fetchKey = `task-detail-workspace-${workspaceSlug}/tasks/${taskId}`;

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

    const fetchData = async () => {
      // Mark fetch as started
      markFetchStart(fetchKey);

      try {
        const token = TokenManager.getAccessToken();
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Check if user is authenticated
        const currentUser = getCurrentUser();
        if (!currentUser) {
          throw new Error("Please log in to view this task");
        }
        const organizationId = localStorage.getItem("currentOrganizationId");
        if (!organizationId) {
          throw new Error("No organization ID found");
        }

        // Fetch workspace by slug to get the UUID
        const workspaceData = await getWorkspaceBySlug(
          workspaceSlug,
          organizationId
        );
        if (!workspaceData) {
          throw new Error("Workspace not found");
        }
        setWorkspace(workspaceData);

        // Fetch task by ID
        const taskData = await getTaskById(taskId);
        if (!taskData) {
          throw new Error("Task not found");
        }

        // Fetch projects using workspace UUID
        const projectsData = await getProjectsByWorkspace(workspaceData.id);
        const taskProject = projectsData?.find(
          (p: any) => p.id === taskData.projectId
        );

        if (taskProject) {
          setProject(taskProject);
        }

        // Enhance task data with workspace and project info
        const enhancedTask = {
          ...taskData,
          project: taskProject
            ? {
                id: taskProject.id,
                name: taskProject.name,
                slug: generateProjectSlug(taskProject.name),
              }
            : null,
          workspace: {
            id: workspaceData.id,
            name: workspaceData.name,
            slug: workspaceData.slug || workspaceSlug,
          },
          // Add default values for fields that might not come from API
          comments: (taskData as any).comments || [],
          attachments: (taskData as any).attachments || [],
          subtasks: (taskData as any).subtasks || [],
          tags: (taskData as any).tags || [],
          reporter: (taskData as any).reporter || null,
          updatedAt:
            (taskData as any).updatedAt ||
            (taskData as any).createdAt ||
            new Date().toISOString(),
        };

        setTask(enhancedTask);

        // Mark fetch as complete and cache the data
        markFetchComplete(fetchKey, {
          task: enhancedTask,
          workspace: workspaceData,
          project: taskProject,
        });
      } catch (error) {
        console.error("❌ [TASK_DETAIL_WORKSPACE] Error fetching data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load task data"
        );
        markFetchError(fetchKey);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceSlug, taskId]); // Only depend on route parameters

  // Manual retry function
  const retryFetch = () => {
    const fetchKey = `task-detail-workspace-${workspaceSlug}/tasks/${taskId}`;
    reset(fetchKey);

    // Reset state
    setTask(null);
    setWorkspace(null);
    setProject(null);
    setError(null);
    setIsLoading(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="task-detail-loading">
        <div className="task-detail-loading-container">
          <div className="task-detail-loading-content">
            <div className="task-detail-loading-breadcrumb"></div>
            <div className="task-detail-loading-grid">
              <div className="task-detail-loading-main">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <CardHeader className="task-detail-loading-card-header" />
                    <CardContent>
                      <div className="task-detail-loading-lines">
                        <div className="task-detail-loading-line task-detail-loading-line-full"></div>
                        <div className="task-detail-loading-line task-detail-loading-line-3-4"></div>
                        <div className="task-detail-loading-line task-detail-loading-line-1-2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="task-detail-loading-sidebar">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <CardHeader className="task-detail-loading-card-header" />
                    <CardContent>
                      <div className="task-detail-loading-lines">
                        <div className="task-detail-loading-input"></div>
                        <div className="task-detail-loading-input"></div>
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

  // Error state
  if (error || !task) {
    return (
      <div className="task-detail-error">
        <div className="task-detail-error-container">
          <Card className="task-detail-error-content">
            <CardHeader className="task-detail-error-header">
              <CardTitle className="flex items-center gap-2">
                <HiExclamationTriangle className="task-detail-error-icon" />
                Task Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="task-detail-error-message">
                {error || "The task you are looking for could not be found."}
              </CardDescription>
              <div className="task-detail-error-actions mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.back()}
                >
                  <HiArrowLeft size={14} />
                  Go back
                </Button>
                <Button variant="secondary" size="sm" onClick={retryFetch}>
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Generate project slug for the TaskDetailClient
  const projectSlug = project ? generateProjectSlug(project.name) : "";

  return (
    <TaskDetailClient
      task={task}
      workspaceSlug={workspaceSlug}
      projectSlug={projectSlug}
      taskId={taskId}
    />
  );
}
