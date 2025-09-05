import { useState, useEffect, useCallback, useMemo } from "react";
import { useTask } from "@/contexts/task-context";

import { useProjectContext } from "@/contexts/project-context";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/router";
import TaskListView from "@/components/tasks/views/TaskListView";
import TaskGanttView from "@/components/tasks/views/TaskGanttView";
import { HiXMark } from "react-icons/hi2";
import { Input } from "@/components/ui/input";
import { Task } from "@/contexts/task-context";
import { ColumnConfig, Project, ViewMode } from "@/types";
import { TokenManager } from "@/lib/api";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { HiClipboardList, HiSearch } from "react-icons/hi";
import ActionButton from "@/components/common/ActionButton";
import TabView from "@/components/tasks/TabView";
import Loader from "@/components/common/Loader";
import Pagination from "@/components/common/Pagination";
import { ColumnManager } from "@/components/tasks/ColumnManager";
import {
  FilterDropdown,
  useGenericFilters,
} from "@/components/common/FilterDropdown";
import { CheckSquare, Flame, Building2, Folder } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import SortIngManager, { SortOrder, SortField } from "@/components/tasks/SortIngManager";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function TasksPageContent() {
  const router = useRouter();
  const { getAllTasks, getAllTaskStatuses, isLoading: taskLoading } = useTask();
  const { getWorkspacesByOrganization, isLoading: workspaceLoading } =
    useWorkspaceContext();
  const { getProjectsByOrganization, isLoading: projectLoading, getTaskStatusByProject } = useProjectContext();
  const { getCurrentUser, getUserAccess } = useAuth();
  const currentOrganizationId = TokenManager.getCurrentOrgId();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [statusFilterEnabled, setStatusFilterEnabled] = useState(false);

  const [currentView, setCurrentView] = useState<"list" | "kanban" | "gantt">(
    () => {
      const type =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("type")
          : null;
      return type === "list" || type === "gantt" ? type : "list";
    }
  );
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [ganttViewMode, setGanttViewMode] = useState<ViewMode>("days");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isNewTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const { createSection } = useGenericFilters();

  const currentUser = getCurrentUser();
  const debouncedSearchQuery = useDebounce(searchInput, 500);

  const isLoading = taskLoading;
  const hasValidUserAndOrg = !!currentUser?.id && !!currentOrganizationId;

  const defaultProject = useMemo(() => {
    return projects.length > 0 ? projects[0] : { slug: "default-project" };
  }, [projects]);

  const defaultWorkspace = useMemo(() => {
    return projects.length > 0 && projects[0].workspace
      ? projects[0].workspace
      : { slug: "default-workspace" };
  }, [projects]);

  useEffect(() => {
    if (!currentOrganizationId) return;
    getUserAccess({ name: "organization", id: currentOrganizationId })
      .then((data) => {
        setHasAccess(data?.canChange);
      })
      .catch((error) => {
        console.error("Error fetching user access:", error);
      });
  }, [currentOrganizationId]);

  // Fetch statuses for selected project
  useEffect(() => {
    const fetchStatusesForProject = async () => {
      if (selectedProjects.length === 1) {
        try {
         
          const statuses = await getTaskStatusByProject(selectedProjects[0]);
          setAvailableStatuses(statuses || []);
          setStatusFilterEnabled(true);
        } catch (error) {
          console.error('Failed to fetch statuses for selected project:', error);
          setAvailableStatuses([]);
          setStatusFilterEnabled(false);
        }
      } else {
        setAvailableStatuses([]);
        setStatusFilterEnabled(false);
      }
    };
    fetchStatusesForProject();
  }, [selectedProjects]);

  const normalizeTaskStatus = useCallback((task: Task) => {
    const statusId =
      task.statusId ||
      (typeof task.status === "object" ? task.status?.id : task.status);
    return {
      ...task,
      statusId: statusId,
      normalizedStatusId: statusId,
    };
  }, []);

  const loadInitialData = useCallback(async () => {
    if (!hasValidUserAndOrg || !currentOrganizationId) return;

    try {
      setError(null);

      const [workspacesData, projectsData] = await Promise.all([
        getWorkspacesByOrganization(currentOrganizationId),
        getProjectsByOrganization(currentOrganizationId),
      ]);

      setWorkspaces(workspacesData || []);
      setProjects(projectsData || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load initial data"
      );
    }
  }, [
    hasValidUserAndOrg,
    currentOrganizationId,
    getWorkspacesByOrganization,
    getProjectsByOrganization,
  ]);

  const loadTasks = useCallback(async () => {
    if (!hasValidUserAndOrg || !currentOrganizationId) return;

    try {
      setError(null);

      const params: {
        workspaceId?: string;
        projectId?: string;
        priorities?: string;
        statuses?: string;
        search?: string;
        page?: number;
        limit?: number;
      } = {
        page: currentPage,
        limit: pageSize,
        ...(debouncedSearchQuery.trim() && {
          search: debouncedSearchQuery.trim(),
        }),
        ...(selectedWorkspaces.length > 0 && {
          workspaceId: selectedWorkspaces.join(","),
        }),
        ...(selectedProjects.length > 0 && {
          projectId: selectedProjects.join(","),
        }),
        ...(selectedStatuses.length > 0 && {
          statuses: selectedStatuses.join(","),
        }),
        ...(selectedPriorities.length > 0 && {
          priorities: selectedPriorities.join(","),
        }),
      };

      

      const allTasks = await getAllTasks(currentOrganizationId, params);
      const normalizedTasks = allTasks.map(normalizeTaskStatus);

      const totalTasks = normalizedTasks.length;
      const totalPages = Math.ceil(totalTasks / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTasks = normalizedTasks.slice(startIndex, endIndex);

      setTasks(paginatedTasks);
      setPagination({
        currentPage,
        totalPages,
        totalCount: totalTasks,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load tasks");
    }
  }, [
    hasValidUserAndOrg,
    currentOrganizationId,
    selectedWorkspaces,
    selectedProjects,
    selectedStatuses,
    selectedPriorities,
    currentPage,
    pageSize,
    debouncedSearchQuery,
    normalizeTaskStatus,
  ]);

  const handleAddColumn = (columnId: string) => {
    const columnConfigs: Record<
      string,
      { label: string; type: ColumnConfig["type"] }
    > = {
      description: { label: "Description", type: "text" },
      taskNumber: { label: "Task Number", type: "number" },
      timeline: { label: "Timeline", type: "dateRange" },
      completedAt: { label: "Completed Date", type: "date" },
      storyPoints: { label: "Story Points", type: "number" },
      originalEstimate: { label: "Original Estimate", type: "number" },
      remainingEstimate: { label: "Remaining Estimate", type: "number" },
      reporter: { label: "Reporter", type: "user" },
      updatedBy: { label: "Updated By", type: "user" },
      createdAt: { label: "Created Date", type: "date" },
      updatedAt: { label: "Updated Date", type: "date" },
      sprint: { label: "Sprint", type: "text" },
      parentTask: { label: "Parent Task", type: "text" },
      childTasksCount: { label: "Child Tasks", type: "number" },
      commentsCount: { label: "Comments", type: "number" },
      attachmentsCount: { label: "Attachments", type: "number" },
      timeEntries: { label: "Time Entries", type: "number" },
    };

    const config = columnConfigs[columnId];
    if (!config) {
      console.warn(`Unknown column ID: ${columnId}`);
      return;
    }

    const newColumn: ColumnConfig = {
      id: columnId,
      label: config.label,
      type: config.type,
      visible: true,
    };

    setColumns((prev) => [...prev, newColumn]);
  };

  const handleRemoveColumn = (columnId: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== columnId));
  };



  const handleFilterDropdownOpen = useCallback(() => {
    if (hasValidUserAndOrg) {
      // No need to call loadTaskStatuses here
      (async () => {
        try {
          const [workspacesData, projectsData] = await Promise.all([
            getWorkspacesByOrganization(currentOrganizationId),
            getProjectsByOrganization(currentOrganizationId),
          ]);
          setWorkspaces(workspacesData || []);
          setProjects(projectsData || []);
        } catch (error) {
          setError(
            error instanceof Error ? error.message : "Failed to load filter data"
          );
        }
      })();
    }
  }, [hasValidUserAndOrg, currentOrganizationId]);

  useEffect(() => {
    loadTasks();
  }, [
    selectedWorkspaces,
    selectedProjects,
    selectedStatuses,
    selectedPriorities,
    currentPage,
    pageSize,
    debouncedSearchQuery,
  ]);

  const handleRetry = useCallback(() => {
    setError(null);
    loadInitialData();
    loadTasks();
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchInput("");
  }, []);

  const handleTaskCreated = useCallback(async () => {
    try {
      await loadTasks();
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    }
  }, [loadTasks]);

  const toggleWorkspace = useCallback((id: string) => {
    console.log("Toggling workspace:", id);
    setSelectedWorkspaces((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      console.log("New workspace selection:", newSelection);
      return newSelection;
    });
    setCurrentPage(1);
  }, []);

  const toggleProject = useCallback((id: string) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setCurrentPage(1);
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setCurrentPage(1);
  }, []);

  const togglePriority = useCallback((id: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedWorkspaces([]);
    setSelectedProjects([]);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setCurrentPage(1);
  }, []);

  const totalActiveFilters = useMemo(
    () =>
      selectedWorkspaces.length +
      selectedProjects.length +
      selectedStatuses.length +
      selectedPriorities.length,
    [
      selectedWorkspaces.length,
      selectedProjects.length,
      selectedStatuses.length,
      selectedPriorities.length,
    ]
  );

  const workspaceFilters = useMemo(() => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const filters = workspaces
      .filter((workspace) => workspace.id && uuidRegex.test(workspace.id))
      .map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        value: workspace.id,
        selected: selectedWorkspaces.includes(workspace.id),
        count: projects.filter((p) => p.workspaceId === workspace.id).length,
      }));

    console.log("Workspace Filters:", filters);
    return filters;
  }, [workspaces, projects, selectedWorkspaces]);

  const projectFilters = useMemo(() => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    return projects
      .filter((project) => project.id && uuidRegex.test(project.id))
      .map((project) => ({
        id: project.id,
        name: project.name,
        value: project.id,
        selected: selectedProjects.includes(project.id),
        count: tasks.filter((task) => task.projectId === project.id).length,
        workspace:
          workspaces.find((w) => w.id === project.workspaceId)?.name || "",
        workspaceId: project.workspaceId,
      }));
  }, [projects, selectedProjects, tasks, workspaces]);

  const statusFilters = useMemo(
    () =>
      availableStatuses.map((status) => ({
        id: status.id,
        name: status.name,
        value: status.id,
        selected: selectedStatuses.includes(status.id),
        count: tasks.filter((task) => {
          const taskStatusId =
            task.statusId ||
            (typeof task.status === "object" ? task.status?.id : task.status);
          return taskStatusId === status.id;
        }).length,
        color: status.color || "#6b7280",
      })),
    [availableStatuses, selectedStatuses, tasks]
  );

  const priorityFilters = useMemo(
    () =>
      [
        { id: "LOW", name: "Low", value: "LOW", color: "#6b7280" },
        { id: "MEDIUM", name: "Medium", value: "MEDIUM", color: "#f59e0b" },
        { id: "HIGH", name: "High", value: "HIGH", color: "#ef4444" },
        { id: "HIGHEST", name: "Highest", value: "HIGHEST", color: "#dc2626" },
      ].map((priority) => ({
        ...priority,
        selected: selectedPriorities.includes(priority.value),
        count: tasks.filter((task) => task.priority === priority.value).length,
      })),
    [selectedPriorities, tasks]
  );

  const filterSections = useMemo(
    () => [
      createSection({
        id: "workspace",
        title: "Workspace",
        icon: Building2,
        data: workspaceFilters,
        selectedIds: selectedWorkspaces,
        searchable: true,
        onToggle: toggleWorkspace,
        onSelectAll: () => setSelectedWorkspaces(workspaceFilters.map((w) => w.id)),
        onClearAll: () => setSelectedWorkspaces([]),
      }),
      createSection({
        id: "project",
        title: "Project",
        icon: Folder,
        data: projectFilters,
        selectedIds: selectedProjects,
        searchable: true,
        multiSelect: false,
        onToggle: toggleProject,
        onClearAll: () => setSelectedProjects([]),
      }),
      createSection({
        id: "status",
        title: "Status",
        icon: CheckSquare,
        data: statusFilters,
        selectedIds: selectedStatuses,
        searchable: false,
        onToggle: statusFilterEnabled ? toggleStatus : undefined,
        onSelectAll: statusFilterEnabled ? () => setSelectedStatuses(statusFilters.map((s) => s.id)) : undefined,
        onClearAll: statusFilterEnabled ? () => setSelectedStatuses([]) : undefined,
        disabled: !statusFilterEnabled,
      }),
      createSection({
        id: "priority",
        title: "Priority",
        icon: Flame,
        data: priorityFilters,
        selectedIds: selectedPriorities,
        searchable: false,
        onToggle: togglePriority,
        onSelectAll: () => setSelectedPriorities(priorityFilters.map((p) => p.id)),
        onClearAll: () => setSelectedPriorities([]),
      }),
    ],
    [
      workspaceFilters,
      projectFilters,
      statusFilters,
      priorityFilters,
      selectedWorkspaces,
      selectedProjects,
      selectedStatuses,
      selectedPriorities,
      toggleWorkspace,
      toggleProject,
      toggleStatus,
      togglePriority,
      statusFilterEnabled
    ]
  );

  // List of sortable fields (add more as needed)
  const sortableFields = [
    { value: "createdAt", label: "Created Date" },
    { value: "updatedAt", label: "Updated Date" },
    { value: "priority", label: "Priority" },
    { value: "taskNumber", label: "Task Number" },
    { value: "storyPoints", label: "Story Points" },
    { value: "completedAt", label: "Completed Date" },
    { value: "timeline", label: "Timeline" },
    { value: "reporter", label: "Reporter" },
    { value: "updatedBy", label: "Updated By" },
    { value: "sprint", label: "Sprint" },
    { value: "parentTask", label: "Parent Task" },
    { value: "childTasksCount", label: "Child Tasks" },
    { value: "commentsCount", label: "Comments" },
    { value: "attachmentsCount", label: "Attachments" },
    { value: "timeEntries", label: "Time Entries" },
    // Add more fields as needed
  ];

  // Sorting logic
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      // Handle date fields
      if (["createdAt", "updatedAt", "completedAt", "timeline"].includes(sortField)) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      // Handle number comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      // Fallback
      return 0;
    });
    return sorted;
  }, [tasks, sortOrder, sortField]);

  const renderContent = () => {
    if (isLoading)
      return <Loader text="Fetching your tasks..." className="py-20" />;

    if (!tasks.length) {
      return (
        <EmptyState
          searchQuery={debouncedSearchQuery}
          priorityFilter={selectedPriorities.length > 0 ? "filtered" : "all"}
        />
      );
    }

    switch (currentView) {
      case "gantt":
        return (
          <TaskGanttView
            tasks={sortedTasks}
            workspaceSlug={defaultWorkspace.slug}
            projectSlug={defaultProject.slug}
            viewMode={ganttViewMode}
            onViewModeChange={setGanttViewMode}
          />
        );
      case "kanban":
        return <div>Kanban Is only available on Project Level.</div>;
      default:
        return (
          <TaskListView tasks={sortedTasks} projects={projects} columns={columns} showAddTaskRow={false}/>
        );
    }
  };

  const showPagination =
    currentView === "list" && tasks.length > 0 && pagination.totalPages > 1;

  return (
    <div className="dashboard-container h-[91vh] flex flex-col space-y-3">
      {/* Sticky PageHeader */}
      <div className="sticky top-0 z-50">
        <PageHeader
          icon={<HiClipboardList className="size-20px" />} 
          title="My Tasks"
          description="Manage and track all your assigned tasks in one place."
          actions={
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:max-w-xs">
                  <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <Input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 rounded-md border border-[var(--border)]"
                  />
                  {searchInput && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      <HiXMark size={16} />
                    </button>
                  )}
                </div>
                {currentView === "list" && (
                  <FilterDropdown
                    sections={filterSections}
                    title="Advanced Filters"
                    activeFiltersCount={totalActiveFilters}
                    onClearAllFilters={clearAllFilters}
                    placeholder="Filter results..."
                    dropdownWidth="w-56"
                    showApplyButton={false}
                    onOpen={handleFilterDropdownOpen}
                  />
                )}
              </div>
              {hasAccess && (
                <ActionButton
                  primary
                  showPlusIcon
                  onClick={() => setNewTaskModalOpen(true)}
                >
                  Create Task
                </ActionButton>
              )}
              <NewTaskModal
                isOpen={isNewTaskModalOpen}
                onClose={() => setNewTaskModalOpen(false)}
                onTaskCreated={handleTaskCreated}
              />
            </div>
          }
        />
      </div>

      {/* Sticky TabView */}
      <div className="sticky top-[64px] z-40">
        <TabView
          currentView={currentView}
          onViewChange={(v) => {
            setCurrentView(v);
            router.push(`/tasks?type=${v}`, undefined, { shallow: true });
          }}
          rightContent={
            <>
              {currentView === "gantt" && (
                <div className="flex items-center bg-[var(--odd-row)] rounded-lg p-1 shadow-sm">
                  {(["days", "weeks", "months"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGanttViewMode(mode)}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize cursor-pointer ${
                        ganttViewMode === mode
                          ? "bg-blue-500 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-[var(--accent)]/50"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
              {currentView === "list" && (
                <div className="flex items-center gap-2">
                  <SortIngManager
                    
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSortFieldChange={setSortField}
                    onSortOrderChange={setSortOrder}
                  />
                  <ColumnManager
                    currentView={currentView}
                    availableColumns={columns}
                    onAddColumn={handleAddColumn}
                    onRemoveColumn={handleRemoveColumn}
                  />
                </div>
              )}
            </>
          }
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto rounded-md">
        {error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          renderContent()
        )}
      </div>

      {/* Sticky Pagination */}
      {showPagination && (
        <div className="sticky bottom-0 z-30">
          <Pagination
            pagination={pagination}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={handlePageChange}
            itemType="tasks"
          />
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return <TasksPageContent />;
}
