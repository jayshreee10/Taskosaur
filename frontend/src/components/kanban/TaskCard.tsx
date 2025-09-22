import React from "react";
import { CardContent } from "@/components/ui/card";
import { HiChatBubbleLeft, HiCalendarDays, HiPaperClip } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

interface TaskCardProps {
  task: KanbanTask;
  statusId: string;
  isDragging: boolean;
  onDragStart: (task: KanbanTask, statusId: string) => void;
  onDragEnd: () => void;
  onClick?: (task: KanbanTask) => void; // ✅ Added onClick prop
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "HIGHEST":
      return "#ef4444";
    case "HIGH":
      return "#f97316";
    case "MEDIUM":
      return "#eab308";
    case "LOW":
      return "#22c55e";
    case "LOWEST":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

const getCategoryFromDescription = (description?: string) => {
  if (!description) return { name: "Task", color: "#6b7280" };
  
  const desc = description.toLowerCase();
  if (desc.includes("development") || desc.includes("code") || desc.includes("api")) {
    return { name: "Development", color: "#3b82f6" };
  }
  if (desc.includes("design") || desc.includes("ui") || desc.includes("ux")) {
    return { name: "Design", color: "#10b981" };
  }
  if (desc.includes("writing") || desc.includes("content")) {
    return { name: "UX Writing", color: "#f59e0b" };
  }
  return { name: "Task", color: "#6b7280" };
};

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusId,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick // ✅ Destructure onClick prop
}) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const category = getCategoryFromDescription(task.description);
  const priorityColor = getPriorityColor(task.priority);

  // ✅ Handle click with proper event handling
  const handleClick = () => {
    // Prevent click during drag operations
    if (isDragging) return;
    
    // Call onClick if provided
    if (onClick) {
      onClick(task);
    }
  };

  // ✅ Handle drag start with click prevention
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
    onDragStart(task, statusId);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick} // ✅ Added onClick handler
      className={cn(
        "rounded-lg border mb-3 cursor-move transition-all duration-200 hover:shadow-md h-[150px]",
        isDragging && "opacity-50 rotate-1 shadow-lg",
        onClick && "hover:cursor-pointer" // ✅ Show pointer cursor when clickable
      )}
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <CardContent className="p-4">
        {/* Task Title */}
        <h4
          className="text-sm font-medium mb-2 line-clamp-1"
          style={{ color: 'var(--foreground)' }}
        >
          {task.title}
        </h4>

        {/* Category Tag */}
        <div className="mb-3">
          <span 
            className="inline-block px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: 'var(--muted)',
              color: 'var(--muted-foreground)'
            }}
          >
            {category.name}
          </span>
        </div>

        {/* Bottom Section */}
        <div className="flex items-center justify-between">
          {/* Left side - Meta info */}
          <div className="flex items-center gap-3 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {task.commentCount && task.commentCount > 0 && (
              <div className="flex items-center gap-1">
                <HiChatBubbleLeft size={12} />
                <span>{task.commentCount}</span>
              </div>
            )}
            
            {task.subtaskCount && task.subtaskCount > 0 && (
              <div className="flex items-center gap-1">
                <HiPaperClip size={12} />
                <span>{task.subtaskCount}</span>
              </div>
            )}
            
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-500"
              )} style={isOverdue ? { color: 'var(--destructive)' } : {}}>
                <HiCalendarDays size={12} />
                <span>Tomorrow</span>
              </div>
            )}
          </div>

          {/* Right side - Assignee Avatar */}
          <div className="flex items-center">
            {task.assignee && (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: priorityColor, color: 'var(--primary-foreground)' }}
                title={`${task.assignee.firstName} ${task.assignee.lastName}`}
              >
                {task.assignee.avatar ? (
                  <Image 
                    src={task.assignee.avatar} 
                    alt={`${task.assignee.firstName} ${task.assignee.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                    height={100}
                    width={100}
                  />
                ) : (
                  getInitials(task.assignee.firstName, task.assignee.lastName)
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default TaskCard;
