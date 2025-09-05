import { useState, useEffect, useRef, useCallback } from "react";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import ProjectAvatar from "@/components/ui/avatars/ProjectAvatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { EntityCard } from "@/components/common/EntityCard";
import ActionButton from "@/components/common/ActionButton";
import {
  HiFolder,
  HiClipboardDocumentList,
  HiCalendarDays,
} from "react-icons/hi2";
import { HiSearch, HiExclamation } from "react-icons/hi";
import { useRouter } from "next/router";
import { DynamicBadge } from "@/components/common/DynamicBadge";

import { NewProjectModal } from "@/components/projects/NewProjectModal";

const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="text-center py-12">
    <div className="w-12 h-12 bg-[var(--muted)] rounded-md flex items-center justify-center mx-auto mb-4 text-[var(--muted-foreground)]">
      {icon}
    </div>
    <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
      {title}
    </h3>
    <p className="text-xs text-[var(--muted-foreground)] mb-4 max-w-md mx-auto">
      {description}
    </p>
    {action}
  </div>
);

const ProjectCardSkeleton = () => (
  <Card className="bg-[var(--card)] rounded-md shadow-sm border-none cursor-pointer p-4">
    <div className="animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-[var(--muted)] rounded-md flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-[var(--muted)] rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-3 bg-[var(--muted)] rounded w-full mb-3"></div>
      <div className="flex items-center gap-4">
        <div className="h-3 bg-[var(--muted)] rounded w-16"></div>
        <div className="h-3 bg-[var(--muted)] rounded w-16"></div>
      </div>
    </div>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="dashboard-container">
    <div className="animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="h-6 bg-[var(--muted)] rounded w-64 mb-2"></div>
          <div className="h-4 bg-[var(--muted)] rounded w-96"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-9 bg-[var(--muted)] rounded w-64"></div>
          <div className="h-9 bg-[var(--muted)] rounded w-32"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

const formatDate = (dateString: string) => {
  if (!dateString) return "Unknown";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Unknown";
  }
};

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-[var(--destructive)]/10 rounded-md flex items-center justify-center mx-auto mb-6 text-[var(--destructive)]">
        <HiExclamation size={24} />
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
        {error}
      </p>
      <Button
        variant="secondary"
        onClick={onRetry}
        className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
      >
        Try Again
      </Button>
    </div>
  </div>
);

function WorkspaceProjectsContent() {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const { isAuthenticated, getUserAccess } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  const [workspace, setWorkspace] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>("");
  const currentSlugRef = useRef<string>("");
  const isInitializedRef = useRef(false);

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace } = useProjectContext();

  const contextFunctionsRef = useRef({
    getWorkspaceBySlug,
    getProjectsByWorkspace,
    isAuthenticated,
  });

  useEffect(() => {
    contextFunctionsRef.current = {
      getWorkspaceBySlug,
      getProjectsByWorkspace,
      isAuthenticated,
    };
  }, [getWorkspaceBySlug, getProjectsByWorkspace, isAuthenticated]);

  const ProjectLeadingIcon = ({ project }: { project: any }) => {
    const hasImage =
      project.avatar || project.image || project.logo || project.icon;

    if (hasImage) {
      return (
        <div className="w-10 h-10 rounded-sm overflow-hidden flex-shrink-0 bg-transparent">
          <ProjectAvatar
            project={project}
            size="md"
            className="w-full h-full object-cover rounded-sm"
          />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-md bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-semibold flex-shrink-0">
        {project.name.charAt(0).toUpperCase()}
      </div>
    );
  };

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

  const formatStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "Active";
      case "PLANNING":
        return "Planning";
      case "ON_HOLD":
        return "On Hold";
      case "COMPLETED":
        return "Completed";
      default:
        return "Active";
    }
  };
  
  const fetchData = useCallback(async () => {
    const pageKey = `${workspaceSlug}/projects`;
    const requestId = `${pageKey}-${Date.now()}-${Math.random()}`;

    if (
      !isMountedRef.current ||
      (currentSlugRef.current === pageKey &&
        isInitializedRef.current &&
        dataLoaded)
    ) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    requestIdRef.current = requestId;
    currentSlugRef.current = pageKey;

    if (!workspaceSlug || !contextFunctionsRef.current.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDataLoaded(false);

      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        return;
      }

      const workspaceData =
        await contextFunctionsRef.current.getWorkspaceBySlug(
          workspaceSlug as string
        );

      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        return;
      }

      if (!workspaceData) {
        setError("Workspace not found");
        setIsLoading(false);
        return;
      }
      setWorkspace(workspaceData);

      const projectsData =
        await contextFunctionsRef.current.getProjectsByWorkspace(
          workspaceData.id
        );

      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        return;
      }

      setProjects(projectsData || []);
      setFilteredProjects(projectsData || []);

      isInitializedRef.current = true;
      setDataLoaded(true);
    } catch (error: any) {
      if (requestIdRef.current === requestId && isMountedRef.current) {
        if (
          error.message?.includes("401") ||
          error.message?.includes("Unauthorized")
        ) {
          setError("Authentication required. Please log in again.");
        } else {
          setError("Failed to load workspace data");
        }
        isInitializedRef.current = false;
      }
    } finally {
      if (requestIdRef.current === requestId && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [workspaceSlug]);

  useEffect(() => {
    const pageKey = `${workspaceSlug}/projects`;
    if (currentSlugRef.current !== pageKey) {
      isInitializedRef.current = false;
      setDataLoaded(false);
      setWorkspace(null);
      setProjects([]);
      setFilteredProjects([]);
    }

    if (workspaceSlug && !dataLoaded) {
      const timeoutId = setTimeout(() => {
        fetchData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [workspaceSlug, dataLoaded, fetchData]);

  useEffect(() => {
    if (workspace) {
      getUserAccess({ name: "workspace", id: workspace.id })
        .then((data) => {
          setHasAccess(data?.canChange);
        })
        .catch((error) => {
          console.error("Error fetching user access:", error);
        });
    }
  }, [workspace]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;
      currentSlugRef.current = "";
      requestIdRef.current = "";

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const retryFetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    isInitializedRef.current = false;
    currentSlugRef.current = "";
    requestIdRef.current = "";
    setDataLoaded(false);
    setWorkspace(null);
    setProjects([]);
    setFilteredProjects([]);
    setError(null);
    setIsLoading(true);

    // Trigger refetch
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.key?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading || !dataLoaded) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retryFetch} />;
  }

  if (!workspace) {
    return (
      <ErrorState
        error="Workspace not found. Please check the URL and try again."
        onRetry={retryFetch}
      />
    );
  }

  return (
    <div className="dashboard-container">
      <div className="space-y-6 text-md">
        <PageHeader
          title={`${workspace.name} Projects`}
          description="Manage and organize projects within this workspace."
          actions={
            <>
              {/* Search Input */}
              <div className="relative max-w-xs w-full">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 rounded-md border border-[var(--border)]"
                />
              </div>

              {/* Primary Action */}
              {hasAccess && (
                <ActionButton
                  primary
                  showPlusIcon
                  onClick={() => setIsNewProjectModalOpen(true)}
                >
                  Create Project
                </ActionButton>
              )}
            </>
          }
        />

        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          workspaceSlug={workspaceSlug as string}
          onProjectCreated={retryFetch}
        />

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          searchQuery ? (
            <EmptyState
              icon={<HiSearch size={24} />}
              title="No projects found"
              description={`No projects match "${searchQuery}". Try adjusting your search terms.`}
            />
          ) : (
            <EmptyState
              icon={<HiFolder size={24} />}
              title="No projects found"
              description="Create your first project to get started with organizing your tasks and collaborating with your team."
            />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-16">
              {filteredProjects.map((project) => {
                const projectSlug = project?.slug;
                const statusText = formatStatus(project.status);

                return (
                  <EntityCard
                    key={project.id}
                    href={`/${workspaceSlug}/${projectSlug}`}
                    leading={
                      <div className="w-10 h-10  flex items-center justify-center text-[var(--primary-foreground)] font-semibold">
                        <ProjectLeadingIcon project={project} />
                      </div>
                    }
                    heading={project.name}
                    subheading={
                      project.slug
                    }
                    description={project.description}
                    footer={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <HiClipboardDocumentList size={12} />
                            {project._count?.tasks || 0} tasks
                          </span>
                          <span className="flex items-center gap-1">
                            <HiCalendarDays size={12} />
                            {formatDate(project.updatedAt)}
                          </span>
                        </div>
                        <DynamicBadge label={statusText} size="sm" />
                      </div>
                    }
                  />
                );
              })}
            </div>

            {/* Footer Counter */}
            {filteredProjects.length > 0 && (
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full min-h-[48px] flex items-center justify-center pb-4 pointer-events-none">
                <p className="text-sm text-[var(--muted-foreground)] pointer-events-auto">
                  Showing {filteredProjects.length} of {projects.length} project
                  {projects.length !== 1 ? "s" : ""}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default function WorkspaceProjectsPage() {
  return <WorkspaceProjectsContent />;
}
