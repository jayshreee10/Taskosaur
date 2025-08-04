"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-context";
import { useProject } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import WorkspaceAvatar from "@/components/ui/avatars/WorkspaceAvatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MembersManager from "@/components/shared/MembersManager";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HiPlus, 
  HiCog, 
  HiUsers, 
  HiFolder, 
  
  HiExclamationTriangle, 
  
  HiCalendarDays,
  HiChartBar,
  HiSparkles,
  
} from "react-icons/hi2";
import { HiClipboardList , HiRefresh , HiOfficeBuilding} from "react-icons/hi";
import ProjectsWithPagination from "@/components/ui/ProjectsWithPagination";

interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  organizationId: string;
}

// Use the ProjectsWithPagination Project type for compatibility
// (do not export, just for this file)
type Project = {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  workspaceId: string;
};

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
            <Card key={i} className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
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

const ErrorState = ({ error, workspaceSlug }: { error: string; workspaceSlug: string }) => (
  <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
    <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)] max-w-md">
      <HiExclamationTriangle className="h-4 w-4" />
      <AlertTitle>
        {error === "Workspace not found" ? "Workspace Not Found" : "Error Loading Workspace"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {error === "Workspace not found"
          ? `The workspace "${workspaceSlug}" does not exist or you don't have access to it.`
          : error || "An unexpected error occurred while loading the workspace."}
        <div className="mt-4">
          <Link href="/dashboard">
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
            >
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  </div>
);

export default function WorkspaceDetailPage() {
  // Helper to normalize project descriptions to string
  function normalizeProjects(projects: any[]): Project[] {
    return projects.map((p) => ({
      ...p,
      description: typeof p.description === 'string' ? p.description : '',
    }));
  }
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceActivity, setWorkspaceActivity] = useState<any[]>([]);
  
  // Context hooks
  const {
    getWorkspaceBySlug,
    getWorkspaceRecentActivity,
  } = useWorkspace();
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
  }, [workspaceSlug, isAuthenticated, getWorkspaceBySlug, getProjectsByWorkspace, getWorkspaceRecentActivity]);

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
    const activeProjects = projects.filter(p => p.status.toLowerCase() === 'active').length;
    const completedProjects = projects.filter(p => p.status.toLowerCase() === 'completed').length;
    const totalProjects = projects.length;
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    return { activeProjects, completedProjects, totalProjects, completionRate };
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !workspace) {
    return <ErrorState error={error || "Workspace not found"} workspaceSlug={workspaceSlug} />;
  }

  const stats = getWorkspaceStats();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <WorkspaceAvatar workspace={workspace} size="xl" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-md font-bold text-[var(--foreground)]">{workspace.name}</h1>
                <Badge 
                  variant="secondary" 
                  className="px-2 py-1 text-xs border-none bg-[var(--primary)]/10 text-[var(--primary)]"
                >
                  Workspace
                </Badge>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] max-w-md">
                {workspace.description ||
                  `Collaborate on projects and manage tasks for ${workspace.name}.`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={`/${workspaceSlug}/settings`}>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center gap-2"
              >
                <HiCog className="w-4 h-4" />
                Settings
              </Button>
            </Link>
            <Link href={`/${workspaceSlug}/projects/new`}>
              <Button
                className="h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
              >
                <HiPlus className="w-4 h-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <HiFolder className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Total Projects</p>
                  <p className="text-lg font-bold text-[var(--foreground)]">{stats.totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <HiSparkles className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Active</p>
                  <p className="text-lg font-bold text-[var(--foreground)]">{stats.activeProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <HiChartBar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Completed</p>
                  <p className="text-lg font-bold text-[var(--foreground)]">{stats.completedProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <HiUsers className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Completion</p>
                  <p className="text-lg font-bold text-[var(--foreground)]">{stats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid - Better Aligned */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Projects and Activity Side by Side */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              
              {/* Projects Card */}
              <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                        <HiFolder className="w-4 h-4 text-[var(--muted-foreground)]" />
                        Projects ({projects.length})
                      </CardTitle>
                      <CardDescription className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        All projects in workspace
                      </CardDescription>
                    </div>
                    <Link href={`/${workspaceSlug}/projects`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 px-2 text-xs border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                      >
                        View all
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ProjectsWithPagination
                    projects={projects}
                    workspaceSlug={workspaceSlug}
                    getStatusVariant={getStatusVariant}
                    generateProjectSlug={generateProjectSlug}
                  />
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                        <HiClipboardList className="w-4 h-4 text-[var(--muted-foreground)]" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Latest team updates
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRefreshActivity}
                      className="h-7 w-7 p-0 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                    >
                      <HiRefresh className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {activityLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 animate-pulse">
                          <div className="w-6 h-6 bg-[var(--muted)] rounded-full"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-[var(--muted)] rounded w-full"></div>
                            <div className="h-2 bg-[var(--muted)] rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activityError ? (
                    <div className="text-center py-4">
                      <HiExclamationTriangle className="w-6 h-6 text-[var(--destructive)] mx-auto mb-2" />
                      <p className="text-xs text-[var(--destructive)] mb-2">{activityError}</p>
                      <Button 
                        size="sm" 
                        onClick={handleRefreshActivity}
                        className="h-7 px-2 text-xs bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : workspaceActivity.length === 0 ? (
                    <div className="text-center py-6 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 mb-2 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                        <HiClipboardList className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </div>
                      <p className="text-xs font-medium text-[var(--foreground)] mb-1">No recent activity</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Activity will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {workspaceActivity.slice(0, 4).map((activity: any) => (
                        <div key={activity.id} className="flex items-start gap-2 p-2 rounded-md transition-colors hover:bg-[var(--accent)]">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold">
                              {activity.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[var(--foreground)] leading-tight">
                              <span className="font-medium">{activity.user.name}</span> {activity.description}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                              {formatActivityDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Members Manager - Right Column */}
          <div className="lg:col-span-1">
            {workspaceLoaded && workspace && workspace.id && workspace.organizationId && (
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
  );
}