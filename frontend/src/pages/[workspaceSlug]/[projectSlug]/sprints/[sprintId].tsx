import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTask } from "@/contexts/task-context";
import { HiClipboardDocumentList, HiXMark } from "react-icons/hi2";
import { HiSearch } from "react-icons/hi";
import type { ColumnConfig, Task } from "@/types/tasks";
import { useRouter } from "next/router";
import TabView from "@/components/tasks/TabView";
import TaskListView from "@/components/tasks/views/TaskListView";
import TaskGanttView from "@/components/tasks/views/TaskGanttView";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import Loader from "@/components/common/Loader";
import EmptyState from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { ColumnManager } from "@/components/tasks/ColumnManager";
import { ViewMode } from "@/types";
import { TokenManager } from "@/lib/api";
import {
  FilterDropdown,
  useGenericFilters,
} from "@/components/common/FilterDropdown";
import { CheckSquare, Flame, Folder } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import SortingManager, { SortOrder, SortField } from "@/components/tasks/SortIngManager";




// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

const SprintTasksTable = () => {
  const router = useRouter();
  const { sprintId, projectSlug, workspaceSlug } = router.query;
  const { getTasksBySprint, getTaskKanbanStatus } = useTask();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kanban, setKanban] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "kanban" | "gantt">(
    "list"
  );
  const [searchInput, setSearchInput] = useState("");
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [kabBanSettingModal, setKabBanSettingModal] = useState(false);
  const [ganttViewMode, setGanttViewMode] = useState<ViewMode>("days");

  // New filter states
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);
  const [availablePriorities] = useState([
    { id: "LOW", name: "Low", value: "LOW", color: "#6b7280" },
    { id: "MEDIUM", name: "Medium", value: "MEDIUM", color: "#f59e0b" },
    { id: "HIGH", name: "High", value: "HIGH", color: "#ef4444" },
    { id: "HIGHEST", name: "Highest", value: "HIGHEST", color: "#dc2626" },
  ]);

  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [sortField, setSortField] = useState<SortField>("createdAt");

  const debouncedSearchQuery = useDebounce(searchInput, 500);
  const currentOrganizationId = TokenManager.getCurrentOrgId();
  const { createSection } = useGenericFilters();

  const loadListData = useCallback(async () => {
    if (!sprintId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getTasksBySprint(
        currentOrganizationId,
        sprintId as string
      );
      const mapped = (result || []).map((task: any) => ({
        ...task,
        key: task.key || task.id,
        slug: task.slug || "",
        createdBy: task.createdBy || "",
        updatedBy: task.updatedBy || "",
        project: task.project || { id: task.projectId, name: "", slug: "" },
        assignee: task.assignee || null,
        reporter: task.reporter || {
          id: "",
          firstName: "",
          lastName: "",
          avatar: "",
        },
        status: task.status || {
          id: "",
          name: "",
          color: "",
          category: "TODO",
        },
      }));
      setTasks(mapped);

      // Extract unique statuses from tasks
      const uniqueStatuses = Array.from(
        new Map(
          mapped
            .map((task) => {
              return task.status;
            })
            .filter((status) => status && status.id)
            .map((status) => [status.id, status])
        ).values()
      );
      setAvailableStatuses(uniqueStatuses);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  const loadKanbanData = useCallback(async () => {
    if (!projectSlug) return;
    try {
      const data = await getTaskKanbanStatus({
        type: "project",
        slug: projectSlug as string,
        includeSubtasks: true,
      });
      setKanban(data.data || []);
    } catch (err) {
      console.error("Failed to load kanban data", err);
    }
  }, [projectSlug]);

  useEffect(() => {
    loadListData();
  }, [loadListData]);

  useEffect(() => {
    if (currentView === "kanban") {
      loadKanbanData();
    }
  }, [currentView, loadKanbanData]);

  // Filter functions
  const toggleProject = useCallback((id: string) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

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
    setSelectedProjects([]);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
  }, []);

  // Prepare filter data
  const projectFilters = useMemo(() => {
    const projectsMap = new Map();
    tasks.forEach((task) => {
      if (task.project?.id) {
        projectsMap.set(task.project.id, task.project);
      }
    });

    return Array.from(projectsMap.values()).map((project) => ({
      id: project.id,
      name: project.name,
      value: project.id,
      selected: selectedProjects.includes(project.id),
      count: tasks.filter((task) => task.projectId === project.id).length,
    }));
  }, [tasks, selectedProjects]);

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
      availablePriorities.map((priority) => ({
        id: priority.id,
        name: priority.name,
        value: priority.value,
        selected: selectedPriorities.includes(priority.value),
        count: tasks.filter((task) => task.priority === priority.value).length,
        color: priority.color,
      })),
    [availablePriorities, selectedPriorities, tasks]
  );

  const totalActiveFilters =
    selectedProjects.length +
    selectedStatuses.length +
    selectedPriorities.length;

  const filterSections = useMemo(
    () => [
      createSection({
        id: "status",
        title: "Status",
        icon: CheckSquare,
        data: statusFilters,
        selectedIds: selectedStatuses,
        searchable: false,
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
        onToggle: togglePriority,
        onSelectAll: () =>
          setSelectedPriorities(priorityFilters.map((p) => p.id)),
        onClearAll: () => setSelectedPriorities([]),
      }),
    ],
    [
      projectFilters,
      statusFilters,
      priorityFilters,
      selectedProjects,
      selectedStatuses,
      selectedPriorities,
      toggleProject,
      toggleStatus,
      togglePriority,
    ]
  );

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

  // Prepare filteredTasks before sortedTasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !debouncedSearchQuery.trim() ||
        task.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      const matchesStatus =
        selectedStatuses.length === 0 ||
        (task.status?.id && selectedStatuses.includes(task.status.id));

      const matchesPriority =
        selectedPriorities.length === 0 ||
        (task.priority && selectedPriorities.includes(task.priority));

      const matchesProject =
        selectedProjects.length === 0 ||
        (task.projectId && selectedProjects.includes(task.projectId));

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesProject
      );
    });
  }, [tasks, debouncedSearchQuery, selectedStatuses, selectedPriorities, selectedProjects]);

  // Sorting logic for filtered tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks].sort((a, b) => {
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
  }, [filteredTasks, sortOrder, sortField]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
  }, []);

  const renderContent = () => {
    if (loading) {
      return <Loader text="Fetching sprint tasks..." className="py-20" />;
    }

    if (error) {
      return <div className="text-red-500 py-8">{error}</div>;
    }

    if (filteredTasks?.length === 0) {
      return (
        <EmptyState
          searchQuery={debouncedSearchQuery}
          priorityFilter={selectedPriorities.length > 0 ? "filtered" : "all"}
        />
      );
    }

    switch (currentView) {
      case "kanban":
        return kanban?.length ? (
          <div>
            <KanbanBoard
              kanbanData={kanban}
              projectId={tasks[0]?.project?.id}
              onRefresh={loadKanbanData}
              kabBanSettingModal={kabBanSettingModal}
              setKabBanSettingModal={setKabBanSettingModal}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No workflow found. Create workflow statuses to use the Kanban
              view.
            </p>
          </div>
        );
      case "gantt":
        return (
          <TaskGanttView
            tasks={filteredTasks}
            workspaceSlug={tasks[0]?.project?.workspace?.slug || ""}
            projectSlug={tasks[0]?.project?.slug || ""}
            viewMode={ganttViewMode}
            onViewModeChange={setGanttViewMode}
          />
        );
      default:
        return <TaskListView tasks={sortedTasks} columns={columns} />;
    }
  };

  return (
    <div className="dashboard-container h-[86vh] flex flex-col space-y-3">
      {/* Sticky PageHeader */}
      <div className="sticky top-0 z-50">
        <PageHeader
          icon={<HiClipboardDocumentList className="size-20px" />} 
          title="Sprint Tasks"
          description={`Manage and track all tasks in this sprint. ${filteredTasks.length} of ${tasks.length} tasks`}
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
                  />
                )}
              </div>
            </div>
          }
        />
      </div>

      {/* Sticky TabView */}
      <div className="sticky top-[64px] z-40 bg-background">
        <TabView
          currentView={currentView}
          onViewChange={(v) => setCurrentView(v)}
          viewKanban={true}
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
                  <SortingManager
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
                    setKabBanSettingModal={setKabBanSettingModal}
                  />
                </div>
              )}
            </>
          }
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto rounded-md">
        {renderContent()}
      </div>
    </div>
  );
};

export default SprintTasksTable;
