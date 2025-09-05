;

import React from "react";
import { useTask } from "@/contexts/task-context";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import StatusColumn from "../kanban/StatusColumn";
import StatusSettingsModal from "../kanban/StatusSettingsModal";

interface TasksByStatus {
  statusId: string;
  statusName: string;
  statusColor: string;
  statusCategory: "TODO" | "IN_PROGRESS" | "DONE";
  tasks: KanbanTask[];
  _count: number;
}

interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  taskNumber: number;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
  subtaskCount?: number;
  labels?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface KanbanBoardProps {
  kanbanData: TasksByStatus[];
  projectId: string;
  onTaskMove?: (taskId: string, newStatusId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  kabBanSettingModal?: boolean;
  setKabBanSettingModal?: (open: boolean) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  kanbanData,
  projectId,
  onTaskMove,
  onRefresh,
  isLoading = false,
  kabBanSettingModal,
  setKabBanSettingModal,
}) => {
  const { updateTaskStatus, createTask } = useTask();

  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop({
    onDrop: async (
      task: KanbanTask,
      fromStatusId: string,
      toStatusId: string
    ) => {
      try {
        await updateTaskStatus(task.id, toStatusId);
        onTaskMove?.(task.id, toStatusId);
        onRefresh?.();
      } catch (err) {
        console.error("Failed to move task:", err);
      }
    },
  });

  const handleCreateTask = async (
    statusId: string,
    data: {
      title: string;
      dueDate: string;
      reporterId: string;
    }
  ) => {
    try {
      await createTask({
        title: data.title.trim(),
        projectId: projectId,
        statusId,
        reporterId: data.reporterId,
        dueDate: data.dueDate
          ? new Date(data.dueDate + "T17:00:00.000Z").toISOString()
          : undefined,
      });
      onRefresh?.();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleStatusUpdated = () => {
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-80 bg-[var(--muted)]/30 rounded-lg p-4 animate-pulse"
          >
            <div className="h-6 bg-[var(--muted)] rounded mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((__, j) => (
                <div key={j} className="h-20 bg-[var(--muted)] rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-nowrap gap-4 overflow-x-auto">
        {kanbanData.map((status) => (
          <StatusColumn
            key={status.statusId}
            status={status}
            projectId={projectId}
            dragState={dragState}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onTaskDragStart={handleDragStart}
            onTaskDragEnd={handleDragEnd}
            onCreateTask={handleCreateTask}
          />
        ))}
      </div>

      <StatusSettingsModal
        isOpen={kabBanSettingModal}
        onClose={() => setKabBanSettingModal(false)}
        projectId={projectId}
        onStatusUpdated={handleStatusUpdated}
      />
    </>
  );
};

export { KanbanBoard };
