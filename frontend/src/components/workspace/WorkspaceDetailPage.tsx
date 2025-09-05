
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from 'next/router';
import { useWorkspace } from "@/contexts/workspace-context";
import { useProject } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MembersManager from "@/components/shared/MembersManager";
import ActionButton from "@/components/common/ActionButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { InfoPanel } from "@/components/common/InfoPanel";
import { StatCard } from "@/components/common/StatCard";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import {
  HiUsers,
  HiFolder,
  HiExclamationTriangle,
  HiChartBar,
  HiSparkles,
} from "react-icons/hi2";
import { HiClipboardList } from "react-icons/hi";
import ProjectsWithPagination from "@/components/ui/ProjectsWithPagination";
import { toast } from "sonner";
import { Project } from '@/types';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  organizationId: string;
}

interface WorkspaceDetailPageProps {
  workspaceSlug: string
}
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-4">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-[var(--muted)] rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-6 bg-[var(--muted)] rounded w-40"></div>
              <div className="h-4 bg-[var(--muted)] rounded w-64"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-[var(--muted)] rounded"></div>
            <div className="h-9 w-28 bg-[var(--muted)] rounded"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="bg-[var(--card)] rounded-[var(--card-radius)] border-none"
            >
              <CardContent className="p-4">
                <div className="h-12 bg-[var(--muted)] rounded mb-2"></div>
                <div className="h-8 bg-[var(--muted)] rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
              <CardContent className="p-6">
                <div className="h-64 bg-[var(--muted)] rounded"></div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
              <CardContent className="p-6">
                <div className="h-96 bg-[var(--muted)] rounded"></div>
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
  workspaceSlug,
}: {
  error: string;
  workspaceSlug: string;
}) => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <Alert
        variant="destructive"
        className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)] max-w-md"
      >
        <HiExclamationTriangle className="h-4 w-4" />
        <AlertTitle>
          {error === "Workspace not found"
            ? "Workspace Not Found"
            : "Error Loading Workspace"}
        </AlertTitle>
        <AlertDescription className="mt-2">
          {error === "Workspace not found"
            ? `The workspace "${workspaceSlug}" does not exist or you don't have access to it.`
            : error ||
              "An unexpected error occurred while loading the workspace."}
          <div className="mt-4">
            <ActionButton
              variant="default"
              primary
              onClick={() => router.push("/dashboard")}
            >
              Return to Dashboard
            </ActionButton>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default function WorkspaceDetailPage({ workspaceSlug }: WorkspaceDetailPageProps) {
  // Helper to normalize project descriptions to string
  // Map API projects to the full Project type expected by ProjectsWithPagination
  function normalizeProjects(projects: any[]): Project[] {
    return projects.map((p) => ({
      ...p,
      description: typeof p.description === "string" ? p.description : undefined,
      settings: p.settings ?? {},
      createdAt: p.createdAt ?? "",
      updatedAt: p.updatedAt ?? "",
      slug: p.slug ?? generateProjectSlug(p.name),
      workspacets: p.workspacets ?? "",
    }));
  }
  const searchParams = useSearchParams();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceActivity, setWorkspaceActivity] = useState<any[]>([]);

  // Context hooks
  const { getWorkspaceBySlug, getWorkspaceRecentActivity } = useWorkspace();
  const { getProjectsByWorkspace } = useProject();
  const { isAuthenticated } = useAuth();

  // Local state for activity loading and error
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

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

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
      case "active":
        return "primary";
      case "completed":
        return "default";
      default:
        return "outline";
    }
  };

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!workspaceSlug || !isAuthenticated() || isFetchingRef.current) {
        if (!workspaceSlug || !isAuthenticated()) {
          setError("Authentication required");
          setLoading(false);
        }
        return;
      }

      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);

        const workspaceData = await getWorkspaceBySlug(workspaceSlug);

        if (!workspaceData) {
          setError("Workspace not found");
          setLoading(false);
          return;
        }

        setWorkspace(workspaceData);
        setWorkspaceLoaded(true);

        // Fetch projects
        try {
          const projectsData = await getProjectsByWorkspace(workspaceData.id);
          setProjects(normalizeProjects(projectsData || []));
        } catch (error) {
          setProjects([]);
        }

        // Fetch recent activity
        try {
          const responseActivity = await getWorkspaceRecentActivity(
            workspaceData.id,
            {
              limit: 5,
              page: 1,
            }
          );
          setWorkspaceActivity(responseActivity.activities || []);
        } catch (error) {
          console.error("Error fetching workspace activity:", error);
        }
      } catch (err) {
        console.error("Error fetching workspace data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load workspace"
        );
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchWorkspaceData();

    return () => {
      setWorkspaceLoaded(false);
    };
  }, [
    workspaceSlug,
    isAuthenticated
  ]);

  // Show toast if workspace was just created
  useEffect(() => {
    if (searchParams.get("created")) {
      toast.success("Workspace created successfully!");
      // Optionally, remove the param from the URL (not shown here)
    }
  }, [searchParams]);

  const handleRefreshActivity = async () => {
    if (workspace?.id) {
      try {
        setActivityError(null);
        setActivityLoading(true);
        await getWorkspaceRecentActivity(workspace.id, {
          limit: 5,
          page: 1,
        });
      } catch (error) {
        console.error("Error refreshing activity:", error);
        setActivityError("Failed to refresh activity");
      } finally {
        setActivityLoading(false);
      }
    }
  };

  const getWorkspaceStats = () => {
    const activeProjects = projects.filter(
      (p) => p.status.toLowerCase() === "active"
    ).length;
    const completedProjects = projects.filter(
      (p) => p.status.toLowerCase() === "completed"
    ).length;
    const totalProjects = projects.length;
    const completionRate =
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

    return { activeProjects, completedProjects, totalProjects, completionRate };
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !workspace) {
    return (
      <ErrorState
        error={error || "Workspace not found"}
        workspaceSlug={workspaceSlug}
      />
    );
  }

  const stats = getWorkspaceStats();

  return (
    <div className="dashboard-container">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Enhanced Header */}
        <WorkspaceHeader workspace={workspace} workspaceSlug={workspaceSlug} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<HiFolder />}
            label="Total Projects"
            value={stats.totalProjects}
          />
          <StatCard
            icon={<HiSparkles />}
            label="Active"
            value={stats.activeProjects}
          />
          <StatCard
            icon={<HiChartBar />}
            label="Completed"
            value={stats.completedProjects}
          />
          <StatCard
            icon={<HiUsers />}
            label="Completion"
            value={`${stats.completionRate}%`}
          />
        </div>

        {/* Main Content Grid - Better Aligned */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Projects and Activity Side by Side */}
          <div className="lg:col-span-2">
            <div className="flex flex-col lg:flex-row lg:space-x-4">
              <div className="flex-shrink-0 lg:w-[100%] h-[80%]">
                <ProjectsWithPagination
                  projects={projects}
                 
                  generateProjectSlug={generateProjectSlug}
                />
              </div>

              {/* Recent Activity InfoPanel with fixed width */}
              <div className="flex-shrink-0 lg:w-[50%] flex flex-col gap-4">
                <InfoPanel
                  title="Recent Activity"
                  subtitle="Latest team updates"
                >
                  {activityLoading ? (
                    /* Loading skeleton */
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 animate-pulse"
                        >
                          <div className="w-6 h-6 bg-[var(--muted)] rounded-full"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-[var(--muted)] rounded w-full"></div>
                            <div className="h-2 bg-[var(--muted)] rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activityError ? (
                    /* Error UI */
                    <div className="text-center py-4">
                      <HiExclamationTriangle className="w-6 h-6 text-[var(--destructive)] mx-auto mb-2" />
                      <p className="text-xs text-[var(--destructive)] mb-2">
                        {activityError}
                      </p>
                      <ActionButton
                        variant="default"
                        primary
                        onClick={handleRefreshActivity}
                      >
                        Try Again
                      </ActionButton>
                    </div>
                  ) : workspaceActivity.length === 0 ? (
                    /* No activity */
                    <div className="text-center py-6 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 mb-2 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                        <HiClipboardList className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </div>
                      <p className="text-xs font-medium text-[var(--foreground)] mb-1">
                        No recent activity
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Activity will appear here
                      </p>
                    </div>
                  ) : (
                    /* Activity List */
                    <div className="space-y-1 max-h-[480px] overflow-y-auto">
                      {workspaceActivity.slice(0, 4).map((activity: any) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-2 p-2 rounded-md transition-colors hover:bg-[var(--accent)]"
                        >
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold">
                              {activity.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[var(--foreground)] leading-tight">
                              <span className="font-medium">
                                {activity.user.name}
                              </span>{" "}
                              {activity.description}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                              {formatActivityDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </InfoPanel>
                {workspaceLoaded &&
                  workspace &&
                  workspace.id &&
                  workspace.organizationId && (
                    <MembersManager
                      key={`workspace-${workspace.id}`}
                      type="workspace"
                      entityId={workspace.id}
                      organizationId={workspace.organizationId}
                      className="h-fit"
                    />
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
