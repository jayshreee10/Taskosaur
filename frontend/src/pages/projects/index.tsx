import { useState, useEffect, useCallback, useMemo } from "react";
import { availableStatuses, availablePriorities } from "@/utils/data/projectFilters";
import { useProjectContext } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import ProjectAvatar from "@/components/ui/avatars/ProjectAvatar";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { EntityCard } from "@/components/common/EntityCard";
import ActionButton from "@/components/common/ActionButton";
import {
  HiClipboardDocumentList,
  HiCalendarDays,
  HiXMark,
} from "react-icons/hi2";
import { HiChevronDown, HiSearch, HiViewBoards } from "react-icons/hi";
import { DynamicBadge } from "@/components/common/DynamicBadge";
import Loader from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";
import { EmptyState } from "@/components/ui";
import { TokenManager } from "@/lib/api";
import { toast } from "sonner";
import {
  FilterDropdown,
  useGenericFilters,
} from "@/components/common/FilterDropdown";
import {
  CheckSquare,
  Flame,
  Clock,
  CheckCircle,
  PauseCircle,
  Calendar,
} from "lucide-react";

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

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

function WorkspaceProjectsContent() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();

  // Filter and pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [hasMore, setHasMore] = useState(false);

  // New filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  const debouncedSearchQuery = useDebounce(searchInput, 500);
  const { createSection } = useGenericFilters();
  const { getUserAccess } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  const { getProjectsByOrganization } = useProjectContext();
  const { isAuthenticated } = useAuth();
  const currentOrganization = TokenManager.getCurrentOrgId();

  const ProjectLeadingIcon = ({ project }: { project: any }) => {
    const hasImage =
      project.avatar || project.image || project.logo || project.icon;
    if (hasImage) {
      return (
        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-transparent">
          <ProjectAvatar
            project={project}
            size="md"
            className="w-full h-full object-cover rounded-md"
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

  // Filter functions
  const toggleStatus = useCallback((id: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const togglePriority = useCallback((id: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
  }, []);

  // Prepare filter data
  const statusFilters = useMemo(
    () =>
      availableStatuses.map((status) => ({
        id: status.id,
        name: status.name,
        value: status.value,
        selected: selectedStatuses.includes(status.value),
        count: projects.filter((project) => project.status === status.value)
          .length,
        color: status.color,
        icon: status.icon,
      })),
    [availableStatuses, selectedStatuses, projects]
  );

  const priorityFilters = useMemo(
    () =>
      availablePriorities.map((priority) => ({
        id: priority.id,
        name: priority.name,
        value: priority.value,
        selected: selectedPriorities.includes(priority.value),
        count: projects.filter((project) => project.priority === priority.value)
          .length,
        color: priority.color,
        icon: priority.icon,
      })),
    [availablePriorities, selectedPriorities, projects]
  );

  const filterSections = useMemo(
    () => [
      createSection({
        id: "status",
        title: "Status",
        icon: CheckSquare,
        data: statusFilters,
        selectedIds: selectedStatuses,
        allowSelectAll: false,
        searchable: false,
        multiSelect: false,
        onToggle: toggleStatus,
        onSelectAll: () => setSelectedStatuses(statusFilters.map((s) => s.id)),
        onClearAll: () => setSelectedStatuses([]),
      }),
      createSection({
        id: "priority",
        title: "Priority",
        icon: Flame,
        data: priorityFilters,
        selectedIds: selectedPriorities,
        searchable: false,
        multiSelect: false,
        allowSelectAll: false,
        onToggle: togglePriority,
        onSelectAll: () =>
          setSelectedPriorities(priorityFilters.map((p) => p.id)),
        onClearAll: () => setSelectedPriorities([]),
      }),
    ],
    [
      statusFilters,
      priorityFilters,
      selectedStatuses,
      selectedPriorities,
      toggleStatus,
      togglePriority,
    ]
  );

    useEffect(() => {
    if (!currentOrganization) return;
    getUserAccess({ name: "organization", id: currentOrganization })
      .then((data) => {
        setHasAccess(data?.canChange);
      })
      .catch((error) => {
        console.error("Error fetching user access:", error);
      });
  }, [currentOrganization]);

  const fetchData = useCallback(
    async (page: number = 1, resetData: boolean = true) => {
      if (!currentOrganization || !isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        if (resetData) {
          setIsLoading(true);
          setError(null);
          setDataLoaded(false);
        }

        // Fetch projects with filters
        const filters = {
          ...(selectedStatuses.length > 0 && {
            status: selectedStatuses.join(","),
          }),
          ...(selectedPriorities.length > 0 && {
            priority: selectedPriorities.join(","),
          }),
          page,
          pageSize,
        };

        const projectsData = await getProjectsByOrganization(
          currentOrganization,
          filters
        );

        const projectsArray = projectsData || [];

        if (resetData || page === 1) {
          setProjects(projectsArray);
        } else {
          setProjects((prev) => [...prev, ...projectsArray]);
        }

        setHasMore(projectsArray.length === pageSize);
        setCurrentPage(page);
        setDataLoaded(true);
      } catch (error: any) {
        if (
          error.message?.includes("401") ||
          error.message?.includes("Unauthorized")
        ) {
          setError("Authentication required. Please log in again.");
        } else {
          setError("Failed to load projects");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedStatuses,
      selectedPriorities,
      pageSize,
      isAuthenticated,
      currentOrganization,
      getProjectsByOrganization,
    ]
  );

  useEffect(() => {
    if (currentOrganization) {
      setCurrentPage(1);
      fetchData(1, true);
    }
  }, [selectedStatuses, selectedPriorities, currentOrganization]);

  const retryFetch = useCallback(() => {
    setDataLoaded(false);
    setProjects([]);
    setError(null);
    setIsLoading(true);
    setCurrentPage(1);
    fetchData(1, true);
  }, [fetchData]);

  // Handle search filtering (client-side)
  const filteredProjects = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return projects;
    } else {
      return projects.filter(
        (project) =>
          project.name
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          project.description
            ?.toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          project.key
            ?.toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())
      );
    }
  }, [debouncedSearchQuery, projects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const totalActiveFilters =
    selectedStatuses.length + selectedPriorities.length;

  const clearSearch = useCallback(() => {
    setSearchInput("");
  }, []);

  const handleProjectCreated = useCallback(async () => {
    try {
      // Refresh the projects list after creation
      await fetchData(1, true);
    } catch (error) {
      toast.error("Error refreshing projects after creation:", error);
      // Still show success even if refresh fails
    }
  }, [fetchData]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchData(currentPage + 1, false);
    }
  };

  if (isLoading && !dataLoaded) {
    return <Loader text="Fetching your organization projects" />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retryFetch} />;
  }

  return (
    <div className="dashboard-container">
      <div className="space-y-6 text-md">
        <PageHeader
          icon={<HiViewBoards className="size-20px" />}
          title={`Your Projects`}
          description="Manage and organize projects within this workspace."
          actions={
            <>
              {/* Search Input */}
              <div className="relative max-w-xs w-full">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-10 rounded-md border border-[var(--border)]"
                />
                {searchInput && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                  >
                    <HiXMark size={16} />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <FilterDropdown
                sections={filterSections}
                title="Advanced Filters"
                activeFiltersCount={totalActiveFilters}
                onClearAllFilters={clearAllFilters}
                placeholder="Filter projects..."
                dropdownWidth="w-56"
                showApplyButton={false}
              />

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

              <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onProjectCreated={handleProjectCreated}
                initialData={{
                  organizationId: currentOrganization,
                }}
              />
            </>
          }
        />

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          searchInput ? (
            <EmptyState
              icon={<HiSearch size={24} />}
              title="No projects found"
              description={`No projects match "${searchInput}". Try adjusting your search terms.`}
            />
          ) : (
            <EmptyState
              icon={<HiViewBoards size={24} />}
              title="No projects found"
              description="Create your first project to get started with organizing your tasks and collaborating with your team."
            />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-16">
              {filteredProjects.map((project) => {
                const projectSlug = generateProjectSlug(project.name);
                const statusText = formatStatus(project.status);
                const workspaceSlug = project.workspace.slug;
                return (
                  <EntityCard
                    key={project.id}
                    href={`/${workspaceSlug}/${projectSlug}`}
                    leading={
                      <div className="w-10 h-10 r flex items-center justify-center text-[var(--primary-foreground)] font-semibold">
                        <ProjectLeadingIcon project={project} />
                      </div>
                    }
                    heading={project.name}
                    subheading={
                      project.key || generateProjectSlug(project.name)
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

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  onClick={loadMore}
                  disabled={isLoading}
                  variant="outline"
                  className="group relative min-w-[140px] h-10 border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all duration-200 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Load More</span>
                        <HiChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                      </>
                    )}
                  </div>
                </Button>
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
