import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import TaskDetailClient from "./TaskDetailClient";
import { useTask } from "../../contexts/task-context";
import { useGlobalFetchPrevention } from "@/hooks/useGlobalFetchPrevention";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ActionButton from "@/components/common/ActionButton";
import { DynamicBadge } from "@/components/common/DynamicBadge";
import {
  HiPencilSquare,
  HiXMark,
  HiListBullet,
  HiExclamationTriangle,
} from "react-icons/hi2";
import Tooltip from "../common/ToolTip";
import { HiCalendar } from "react-icons/hi";
import { Role } from "@/utils/roles";
import { useAuth } from "@/contexts/auth-context";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  startDate: string;
  dueDate: string;
  projectId: string;
  assigneeId?: string;
  reporterId?: string;
  statusId: string;
  remainingEstimate?: number;
  parentTaskId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

interface SubtasksProps {
  taskId: string;
  projectId: string;
  onSubtaskAdded?: (subtask: Task) => void;
  onSubtaskUpdated?: (subtaskId: string, updates: any) => void;
  onSubtaskDeleted?: (subtaskId: string) => void;
  showConfirmModal?: (
    title: string,
    message: string,
    onConfirm: () => void,
    type?: "danger" | "warning" | "info"
  ) => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-[var(--primary)]" />
    <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
  </div>
);

export default function Subtasks({
  taskId,
  projectId,
  onSubtaskAdded,
  onSubtaskUpdated,
  onSubtaskDeleted,
  showConfirmModal,
}: SubtasksProps) {
  const {
    getSubtasksByParent,
    createSubtask,
    updateTask,
    deleteTask,
    getAllTaskStatuses,
    isLoading,
  } = useTask();

  // Global fetch prevention hook
  const {
    shouldPreventFetch,
    markFetchStart,
    markFetchComplete,
    markFetchError,
    getCachedData,
  } = useGlobalFetchPrevention();
  const { getUserAccess } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<any[]>([]);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectSlug } = router.query;

  // Helper to normalize API Task to local Task type
  function normalizeTask(apiTask: any): Task {
    return {
      ...apiTask,
      description: apiTask.description ?? "",
    };
  }

  function normalizeTasks(apiTasks: any[]): Task[] {
    return apiTasks.map(normalizeTask);
  }

  // Get current user from localStorage
  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const userString = localStorage.getItem("user");
        if (userString) {
          const user: User = JSON.parse(userString);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    };

    getUserFromStorage();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    getUserAccess({ name: "project", id: projectId })
      .then((data) => {
        setHasAccess(data?.canChange);
      })
      .catch((error) => {
        console.error("Error fetching user access:", error);
      });
  }, []);

  // Fetch task statuses
  useEffect(() => {
    const fetchKey = "all-task-statuses";

    if (shouldPreventFetch(fetchKey)) {
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setTaskStatuses(cachedData as any[]);
        return;
      }
    }

    const fetchStatuses = async () => {
      markFetchStart(fetchKey);

      try {
        const statuses = await getAllTaskStatuses();
        setTaskStatuses(statuses);
        markFetchComplete(fetchKey, statuses);
      } catch (error) {
        console.error("Failed to fetch task statuses:", error);
        markFetchError(fetchKey, error as Error);
      }
    };

    fetchStatuses();
  }, []);

  // Fetch subtasks when component mounts or taskId changes
  useEffect(() => {
    if (!taskId) return;

    const fetchKey = `subtasks-${taskId}`;

    if (shouldPreventFetch(fetchKey)) {
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setSubtasks(normalizeTasks(cachedData as any[]));
        return;
      }
    }

    const fetchSubtasks = async () => {
      markFetchStart(fetchKey);
      try {
        const taskSubtasks = await getSubtasksByParent(taskId);
        setSubtasks(normalizeTasks(taskSubtasks));
        markFetchComplete(fetchKey, taskSubtasks);
      } catch (error) {
        console.error("Failed to fetch subtasks:", error);
        markFetchError(fetchKey, error as Error);
      }
    };

    fetchSubtasks();
  }, [taskId]);

  // Refresh subtasks function for real-time updates
  const refreshSubtasks = async () => {
    try {
      const taskSubtasks = await getSubtasksByParent(taskId);
      setSubtasks(normalizeTasks(taskSubtasks));
    } catch (error) {
      console.error("Failed to refresh subtasks:", error);
    }
  };


const handleAddSubtask = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newSubtaskTitle.trim() || !currentUser) return;

  try {
    const defaultStatus =
      taskStatuses.find((s) => s.category === "TODO") || taskStatuses[0];

    if (!defaultStatus) {
      console.error("No task statuses available");
      return;
    }

    const subtaskData = {
      title: newSubtaskTitle.trim(),
      description: `Subtask for parent task`,
      priority: "MEDIUM" as const,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      projectId,
      assigneeId: currentUser.id,
      reporterId: currentUser.id,
      statusId: defaultStatus.id,
      parentTaskId: taskId,
    };

    const newSubtask = await createSubtask(subtaskData);
    const normalizedSubtask = normalizeTask(newSubtask);
    await refreshSubtasks();
    setNewSubtaskTitle(""); // Only clear the input, don't close the form
    // setIsAddingSubtask(false); // <-- REMOVE or COMMENT OUT this line
    onSubtaskAdded?.(normalizedSubtask);
  } catch (error) {
    console.error("Failed to add subtask:", error);
  }
};


  const handleToggleSubtaskStatus = async (
    subtaskId: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      const subtask = subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return;

      const completedStatus = taskStatuses.find((s) => s.category === "DONE");
      const todoStatus = taskStatuses.find((s) => s.category === "TODO");

      if (!completedStatus || !todoStatus) {
        console.error("Required statuses not found (DONE or TODO categories)");
        return;
      }

      const currentStatus = taskStatuses.find((s) => s.id === subtask.statusId);
      const isCurrentlyCompleted = currentStatus?.category === "DONE";
      const newStatusId = isCurrentlyCompleted
        ? todoStatus.id
        : completedStatus.id;

      await updateTask(subtaskId, {
        statusId: newStatusId,
      });

      await refreshSubtasks();
      onSubtaskUpdated?.(subtaskId, { statusId: newStatusId });
    } catch (error) {
      console.error("Failed to toggle subtask status:", error);
    }
  };

  const handleEditSubtask = (
    subtaskId: string,
    currentTitle: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    setEditingSubtaskId(subtaskId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = async (subtaskId: string) => {
    if (!editingTitle.trim()) return;

    try {
      await updateTask(subtaskId, {
        title: editingTitle.trim(),
      });

      await refreshSubtasks();

      setEditingSubtaskId(null);
      setEditingTitle("");

      onSubtaskUpdated?.(subtaskId, { title: editingTitle.trim() });
    } catch (error) {
      console.error("Failed to update subtask:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditingTitle("");
  };

  const handleDeleteSubtask = async (
    subtaskId: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmDelete = async () => {
      try {
        await deleteTask(subtaskId);
        await refreshSubtasks();
        onSubtaskDeleted?.(subtaskId);
      } catch (error) {
        console.error("Failed to delete subtask:", error);
      }
    };

    if (showConfirmModal) {
      showConfirmModal(
        "Delete Subtask",
        "Are you sure you want to delete this subtask? This action cannot be undone.",
        confirmDelete,
        "danger"
      );
    } else {
      if (
        window.confirm(
          "Are you sure you want to delete this subtask? This action cannot be undone."
        )
      ) {
        await confirmDelete();
      }
    }
  };

  const handleCancelAddSubtask = () => {
    setIsAddingSubtask(false);
    setNewSubtaskTitle("");
  };

  // Helper function to check if subtask is completed
  const isSubtaskCompleted = (subtask: Task) => {
    const currentStatus = taskStatuses.find((s) => s.id === subtask.statusId);
    return currentStatus?.category === "DONE";
  };

  // Helper function to get priority and status colors
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "highest":
        return "#EF4444"; // red
      case "high":
        return "#F97316"; // orange
      case "medium":
        return "#F59E0B"; // yellow
      case "low":
        return "#10B981"; // green
      default:
        return "#6B7280"; // gray
    }
  };

  const getStatusColor = (statusId: string) => {
    const status = taskStatuses.find((s) => s.id === statusId);
    if (!status) return "#6B7280"; // gray

    switch (status.name?.toLowerCase()) {
      case "done":
      case "completed":
        return "#10B981"; // green
      case "in progress":
      case "in_progress":
        return "#3B82F6"; // blue
      case "review":
        return "#8B5CF6"; // purple
      case "todo":
      case "to do":
        return "#6B7280"; // gray
      default:
        return "#6B7280"; // gray
    }
  };

  const completedCount = subtasks.filter((s) => isSubtaskCompleted(s)).length;

  if (!currentUser) {
    return (
      <div className="space-y-4">
        <SectionHeader icon={HiListBullet} title="Subtasks" />
        <Alert className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]">
          <HiExclamationTriangle className="h-4 w-4" />
          <AlertDescription>Please log in to manage subtasks.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {selectedSubtask && router.query.taskId === selectedSubtask.id && (
        <div className="mb-6">
          <TaskDetailClient
            task={selectedSubtask}
            taskId={selectedSubtask.id}
            workspaceSlug={workspaceSlug as string | undefined}
            projectSlug={projectSlug as string | undefined}
            open="modal"
            onTaskRefetch={refreshSubtasks}
          />
        </div>
      )}

      <div className="space-y-4">
        <SectionHeader
          icon={HiListBullet}
          title={`Subtasks (${completedCount}/${subtasks.length})`}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-6 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-[var(--muted-foreground)]">
                Loading subtasks...
              </span>
            </div>
          </div>
        )}

        {/* Subtasks List */}
        {subtasks.length > 0 && (
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-start gap-3 group p-3 rounded-lg hover:bg-[var(--accent)] border-none  transition-colors shadow-sm hover:shadow-md cursor-pointer"
                onClick={(e) => {
                  // Don't show details if clicking on action buttons or checkboxes
                  if (
                    (e.target as HTMLElement).closest("button") ||
                    (e.target as HTMLElement).closest(".action-button") ||
                    (e.target as HTMLElement).closest("svg") ||
                    (e.target as HTMLElement).closest('input[type="checkbox"]')
                  ) {
                    return;
                  }
                  setSelectedSubtask(subtask);
                  const subtaskUrl =
                    workspaceSlug && projectSlug
                      ? `/${workspaceSlug}/${projectSlug}/tasks/${subtask.id}`
                      : `/tasks/${subtask.id}`;

                  if (editingSubtaskId !== subtask.id) {
                    router.push(subtaskUrl);
                  }
                }}
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  {editingSubtaskId === subtask.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={editingTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingTitle(e.target.value)
                        }
                        className="flex-1 h-9 border-input bg-background text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit(subtask.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <div className="flex gap-1">
                        <ActionButton
                          onClick={() => handleSaveEdit(subtask.id)}
                          disabled={isLoading}
                          primary
                          className="h-8 px-3 cursor-pointer"
                        >
                          Save
                        </ActionButton>
                        <ActionButton
                          onClick={handleCancelEdit}
                          variant="outline"
                          secondary
                          className="h-8 px-3 cursor-pointer"
                        >
                          Cancel
                        </ActionButton>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Checkmark/Tick icon inline with title */}
                          <div
                            onClick={(e) =>
                              handleToggleSubtaskStatus(subtask.id, e)
                            }
                            className="cursor-pointer"
                          >
                            {isSubtaskCompleted(subtask) ? (
                              <div className="w-4 h-4 flex items-center justify-center text-green-500">
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-4 h-4 border border-[var(--border)] rounded" />
                            )}
                          </div>
                          <div
                            onClick={(e) =>
                              handleToggleSubtaskStatus(subtask.id, e)
                            }
                            className={`text-sm font-medium cursor-pointer truncate ${
                              isSubtaskCompleted(subtask)
                                ? "text-[var(--muted-foreground)] line-through"
                                : "text-[var(--foreground)]"
                            }`}
                          >
                            {subtask.title}
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
                          <Tooltip
                            content="Edit"
                            position="top"
                            color="primary"
                          >
                            <ActionButton
                              onClick={(e) =>
                                handleEditSubtask(subtask.id, subtask.title, e)
                              }
                              variant="ghost"
                              className="text-[var(--muted-foreground)] hover:text-[var(--primary)] cursor-pointer p-1"
                              disabled={isLoading}
                            >
                              <HiPencilSquare className="w-4 h-4" />
                            </ActionButton>
                          </Tooltip>
                          <Tooltip
                            content="Delete"
                            position="top"
                            color="primary"
                          >
                            <ActionButton
                              onClick={(e) =>
                                handleDeleteSubtask(subtask.id, e)
                              }
                              variant="ghost"
                              className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] cursor-pointer p-1"
                              disabled={isLoading}
                            >
                              <HiXMark className="w-4 h-4" />
                            </ActionButton>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-6">
                        <DynamicBadge
                          label={
                            subtask.priority.charAt(0) +
                            subtask.priority.slice(1).toLowerCase()
                          }
                          bgColor={getPriorityColor(subtask.priority)}
                          size="sm"
                          className="px-2 py-0.5 text-xs"
                        />
                        <DynamicBadge
                          label={
                            taskStatuses.find((s) => s.id === subtask.statusId)
                              ?.name || "Unknown"
                          }
                          bgColor={getStatusColor(subtask.statusId)}
                          size="sm"
                          className="px-2 py-0.5 text-xs"
                        />
                        {subtask.dueDate && (
                          <Tooltip
                            content="Due Date"
                            position="top"
                            color="primary"
                          >
                            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                              <HiCalendar className="w-3 h-3" />
                              {new Date(subtask.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && subtasks.length === 0 && (
          <div className="text-center py-8 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
            <HiListBullet className="w-8 h-8 mx-auto mb-3 text-[var(--muted-foreground)]" />
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">
              No subtasks yet
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Add subtasks to break down this task into smaller, manageable
              pieces
            </p>
          </div>
        )}

        {/* Add Subtask Form/Button */}
        {isAddingSubtask ? (
          <form
            onSubmit={handleAddSubtask}
            className="space-y-3 p-4 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]"
          >
            <Input
              type="text"
              value={newSubtaskTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewSubtaskTitle(e.target.value)
              }
              placeholder="Enter subtask title..."
              className="h-9 border-input bg-background text-[var(--foreground)]"
              autoFocus
              disabled={isLoading}
            />
            <div className="flex items-center gap-2">
              {hasAccess && (
                <ActionButton
                  type="submit"
                  disabled={!newSubtaskTitle.trim() || isLoading}
                  primary
                  className="flex-1 cursor-pointer"
                  showPlusIcon
                >
                  {isLoading ? "Adding..." : "Add Subtask"}
                </ActionButton>
              )}

              <ActionButton
                type="button"
                onClick={handleCancelAddSubtask}
                variant="outline"
                disabled={isLoading}
                secondary
                className="cursor-pointer"
              >
                Cancel
              </ActionButton>
            </div>
          </form>
        ) : hasAccess ? (
          <ActionButton
            onClick={() => setIsAddingSubtask(true)}
            variant="outline"
            disabled={isLoading}
            showPlusIcon
            secondary
            className="min-w-[140px] cursor-pointer"
          >
            Add subtask
          </ActionButton>
        ) : null}
      </div>
    </>
  );
}
