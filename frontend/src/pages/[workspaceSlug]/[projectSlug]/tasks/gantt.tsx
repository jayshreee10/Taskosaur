import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OrganizationProvider from "@/contexts/organization-context";
import WorkspaceProvider from "@/contexts/workspace-context";
import ProjectProvider from "@/contexts/project-context";
import SprintProvider from "@/contexts/sprint-context";
import TaskProvider from "@/contexts/task-context";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { Toaster } from "sonner";
import { TaskViewTabs } from "@/components/tasks/TaskViewTabs";
import TaskGanttView from "@/components/tasks/views/TaskGanttView";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";
import { useTask } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HiPlus,
  HiClipboardDocumentList,
  HiExclamationTriangle,
  HiArrowPath,
} from "react-icons/hi2";
import { getCurrentOrganizationId } from "@/utils/hierarchyContext";

const LoadingSpinner = () => (
  <div className="flex min-h-screen bg-[var(--background)]">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Header />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-200 border-t-amber-600"></div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Loading project timeline...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="flex min-h-screen bg-[var(--background)]">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Header />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="border-[var(--destructive)]/20 bg-[var(--destructive)]/10">
            <CardHeader>
              <CardTitle className="flex items-start gap-3">
                <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <span className="text-sm font-semibold text-[var(--destructive)]">
                  Error loading project timeline
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
    </div>
  </div>
);

function ProjectTasksGanttPageContent() {
  const router = useRouter();
  const { workspaceSlug, projectSlug } = router.query;

  const authContext = useAuth();
  const workspaceContext = useWorkspaceContext();
  const projectContext = useProjectContext();
  const taskContext = useTask();
  const { getUserAccess } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Track the current route to prevent duplicate calls
  const currentRouteRef = useRef<string>("");
  const isFirstRenderRef = useRef(true);

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

  const findProjectBySlug = (projects: any[], slug: string) => {
    return projects.find(
      (project) => project.slug === slug
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDataLoaded(false);

      // Check authentication
      if (!authContext.isAuthenticated()) {
        router.push("/auth/login");
        return;
      }

      if (
        typeof workspaceSlug !== "string" ||
        typeof projectSlug !== "string"
      ) {
        setError("Invalid workspace or project slug");
        setLoading(false);
        return;
      }

      const workspace = await workspaceContext.getWorkspaceBySlug(
        workspaceSlug
      );
      if (!workspace) {
        setError("Workspace not found");
        setLoading(false);
        return;
      }
      setWorkspaceData(workspace);

      const projects = await projectContext.getProjectsByWorkspace(
        workspace.id
      );
      const project = findProjectBySlug(projects || [], projectSlug);

      if (!project) {
        setError("Project not found");
        setLoading(false);
        return;
      }
      setProjectData(project);

      const organizationId = getCurrentOrganizationId();
      if (!organizationId) {
        throw new Error(
          "No organization selected. Please select an organization first."
        );
      }
      const tasks = await taskContext.getTasksByProject(
        project.id,
        organizationId
      );
      setProjectTasks(tasks || []);

      setDataLoaded(true);
    } catch (err) {
      console.error("Error loading page data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectData) {
      getUserAccess({ name: "project", id: projectData.id })
        .then((data) => {
          setHasAccess(data?.canChange);
        })
        .catch((error) => {
          console.error("Error fetching user access:", error);
        });
    }
  }, [projectData]);

  useEffect(() => {
    if (!workspaceSlug || !projectSlug) return;

    const currentRoute = `${workspaceSlug}/${projectSlug}/tasks/gantt`;

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
    return (
      <ErrorState error="Project or workspace not found" onRetry={loadData} />
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-6">
          <Breadcrumb />

          <div className="min-h-screen bg-[var(--background)]">
            <div className="max-w-7xl mx-auto p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-1">
                      <Link
                        href={`/${workspaceSlug}`}
                        className="hover:text-[var(--foreground)]"
                      >
                        {workspaceData?.name}
                      </Link>
                      <span>/</span>
                      <Link
                        href={`/${workspaceSlug}/${projectSlug}`}
                        className="hover:text-[var(--foreground)]"
                      >
                        {projectData?.name}
                      </Link>
                    </div>
                    <h1 className="text-lg font-semibold text-[var(--foreground)] mb-1 flex items-center gap-2">
                      <HiClipboardDocumentList size={20} />
                      Tasks
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Manage and track all tasks for {projectData?.name}
                    </p>
                  </div>

                  {/* Controls */}
                  {projectData && (
                    <div className="flex flex-wrap gap-3 items-center">
                      <Link href={`/${workspaceSlug}/${projectSlug}/tasks/new`}>
                        <Button
                          size="default"
                          className="flex items-center gap-2"
                        >
                          <HiPlus size={16} />
                          Create Task
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Task Count */}
                <div className="mt-4 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                  <span>{projectTasks.length} tasks</span>
                </div>
              </div>

              {/* View Tabs */}
              <div className="mb-6">
                <TaskViewTabs
                  currentView="gantt"
                  baseUrl={`/${workspaceSlug}/${projectSlug}/tasks`}
                />
              </div>

              {/* Gantt Chart */}
              <div className="gantt-wrapper">
                <TaskGanttView
                  tasks={projectTasks}
                  workspaceSlug={workspaceSlug as string}
                  projectSlug={projectSlug as string}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function ProjectTasksGanttPage() {
  return (
    <ProtectedRoute>
      <OrganizationProvider>
        <WorkspaceProvider>
          <ProjectProvider>
            <SprintProvider>
              <TaskProvider>
                <ProjectTasksGanttPageContent />
              </TaskProvider>
            </SprintProvider>
          </ProjectProvider>
        </WorkspaceProvider>
      </OrganizationProvider>
    </ProtectedRoute>
  );
}
