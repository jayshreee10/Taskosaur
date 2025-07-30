"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import WorkspaceAvatar from "@/components/ui/avatars/WorkspaceAvatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MembersManager from "@/components/shared/MembersManager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, EmptyState, LoadingSkeleton } from "@/components/ui";
import {
  HiPlus,
  HiCog,
  HiUsers,
  HiFolder,
  HiClipboardList,
  HiExternalLink,
  HiExclamation,
  HiUserAdd,
  HiX,
  HiCheck,
  HiMail,
  HiChevronDown,
} from "react-icons/hi";
import "@/styles/workspace.css";

interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  organizationId: string;
}

interface Project {
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
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace } = useProjectContext();
  const { isAuthenticated } = useAuth();

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
        return "secondary";
      case "completed":
        return "default";
      default:
        return "outline";
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

        try {
          const projectsData = await getProjectsByWorkspace(workspaceData.id);
          setProjects(projectsData || []);
        } catch (error) {
          console.error("Error fetching projects:", error);
          setProjects([]);
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
  }, [workspaceSlug, isAuthenticated]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !workspace) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-error/20 dark:border-error-dark bg-error-light dark:bg-error-dark/20">
          <CardHeader>
            <CardTitle className="flex items-start gap-3">
              <HiExclamation className="w-5 h-5 text-error mt-0.5" />
              <span className="text-lg font-semibold text-error dark:text-error">
                {error === "Workspace not found"
                  ? "Workspace Not Found"
                  : "Error Loading Workspace"}
              </span>
            </CardTitle>
            <CardDescription className="text-sm text-error dark:text-error">
              {error === "Workspace not found"
                ? `The workspace "${workspaceSlug}" does not exist.`
                : error ||
                  "An unexpected error occurred while loading the workspace."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              href="/dashboard"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Return to Dashboard
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const mockRecentActivity = [
    {
      id: "1",
      user: "John Doe",
      action: "created task",
      target: "Homepage Design",
      time: "2 hours ago",
    },
    {
      id: "2",
      user: "Jane Smith",
      action: "completed",
      target: "User Authentication",
      time: "4 hours ago",
    },
    {
      id: "3",
      user: "Mike Johnson",
      action: "updated",
      target: "Dashboard Layout",
      time: "6 hours ago",
    },
  ];

  return (
    <div className="workspaces-container">
      <div className="max-w-7xl mx-auto">
        <div className="workspace-header">
          <div className="workspace-info">
            <WorkspaceAvatar workspace={workspace} size="xl" />
            <div>
              <h1 className="workspace-title">{workspace.name}</h1>
              <p className="workspace-description">
                {workspace.description ||
                  `This workspace contains all projects and tasks related to our ${workspace.name} efforts.`}
              </p>
            </div>
          </div>
          <div className="workspace-actions">
            <Link href={`/${workspaceSlug}/settings`}>
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <HiCog size={14} />
                <span>Settings</span>
              </Button>
            </Link>
            <Link href={`/${workspaceSlug}/projects/new`}>
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <HiPlus size={14} />
                <span>New Project</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="workspace-grid">
          <div className="workspace-content">
            <Card className="workspace-card">
              <CardHeader className="workspace-card-header">
                <CardTitle className="flex items-center gap-2">
                  <HiFolder size={16} />
                  Projects
                </CardTitle>
                <CardAction>
                  <Link
                    href={`/${workspaceSlug}/projects`}
                    className="project-link flex items-center gap-1"
                  >
                    View All <HiExternalLink size={12} />
                  </Link>
                </CardAction>
              </CardHeader>

              <CardContent>
                {projects.length === 0 ? (
                  <EmptyState
                    icon={<HiFolder size={20} />}
                    title="No projects found"
                    description="Create your first project to get started."
                  />
                ) : (
                  <div className="project-list">
                    {projects.map((project) => (
                      <div key={project.id} className="project-item">
                        <div className="project-info">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                                {project.name?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-sm font-medium text-foreground dark:text-foreground-dark">
                                {project.name}
                              </h3>
                              <div className="project-meta">
                                <Badge
                                  variant={getStatusVariant(project.status)}
                                  className="capitalize"
                                >
                                  {project.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/${workspaceSlug}/${generateProjectSlug(
                            project.name
                          )}`}
                          className="project-link"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="workspace-card">
              <CardHeader className="workspace-card-header">
                <CardTitle className="flex items-center gap-2">
                  <HiClipboardList size={16} />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="activity-list">
                  {mockRecentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-avatar">
                        {activity.user.charAt(0)}
                      </div>
                      <div className="activity-content">
                        <div className="activity-description">
                          <span className="font-medium">{activity.user}</span>{" "}
                          {activity.action}{" "}
                          <span className="font-medium">{activity.target}</span>
                        </div>
                        <p className="activity-time">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="workspace-sidebar">
            {workspaceLoaded &&
              workspace &&
              workspace.id &&
              workspace.organizationId && (
                <MembersManager
                  key={`workspace-${workspace.id}`}
                  type="workspace"
                  entityId={workspace.id}
                  organizationId={workspace.organizationId}
                  className=""
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
