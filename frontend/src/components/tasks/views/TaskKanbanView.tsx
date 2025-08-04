'use client';

import { useState, useCallback, useMemo, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import { 
  HiChatBubbleLeft, 
  HiUser,
  HiPaperClip,
} from 'react-icons/hi2';

interface TaskKanbanViewProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
  onTaskMove?: (taskId: string, newStatus: string) => Promise<void>;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export default function TaskKanbanView({ 
  tasks, 
  workspaceSlug, 
  projectSlug, 
  projects,
  onTaskMove,
  onTaskUpdate 
}: TaskKanbanViewProps) {
  const router = useRouter();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draggedItemRef = useRef<HTMLDivElement | null>(null);

  // Ensure tasks is always an array and memoize
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);

  // Memoized task grouping logic
  const { tasksByStatus, statusesToUse } = useMemo(() => {
    const tasksByStatus: Record<string, Task[]> = {};
    
    // Get all unique statuses from tasks
    const allStatuses = Array.from(new Set(safeTasks.map(task => task.status?.name).filter(Boolean)));
    
    // If no statuses found, use default statuses
    const statusesToUse = allStatuses.length > 0 ? allStatuses : ['Todo', 'In Progress', 'Review', 'Done'];
    
    // Initialize status groups
    statusesToUse.forEach(status => {
      tasksByStatus[status] = [];
    });
    
    // Group tasks by status
    safeTasks.forEach(task => {
      const statusName = task.status?.name || 'Todo';
      if (tasksByStatus[statusName]) {
        tasksByStatus[statusName].push(task);
      } else {
        // If status not in our list, add it
        if (!tasksByStatus[statusName]) {
          tasksByStatus[statusName] = [];
        }
        tasksByStatus[statusName].push(task);
      }
    });

    return { tasksByStatus, statusesToUse };
  }, [safeTasks]);

  // Memoized priority badge styling function
  const getPriorityBadgeStyle = useCallback((priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'highest':
      case 'high':
        return 'bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded';
      case 'medium':
      case 'mid':
        return 'bg-pink-400 text-white text-xs font-bold px-2 py-1 rounded';
      case 'low':
      case 'lowest':
        return 'bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded';
      default:
        return 'bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded';
    }
  }, []);

  // Enhanced drag and drop handlers with error handling
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    setError(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Set custom drag image
    if (draggedItemRef.current) {
      e.dataTransfer.setDragImage(draggedItemRef.current, 20, 20);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
    setIsLoading(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((status: string) => {
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear drag over if we're leaving the column entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status?.name === targetStatus) {
      setDraggedTask(null);
      setDragOverColumn(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (onTaskMove) {
        await onTaskMove(draggedTask.id, targetStatus);
      } else {
        // Fallback: just log the action
        console.log(`Moving task "${draggedTask.title}" from "${draggedTask.status?.name}" to "${targetStatus}"`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to move task');
      console.error('Error moving task:', error);
    } finally {
      setDraggedTask(null);
      setDragOverColumn(null);
      setIsLoading(false);
    }
  }, [draggedTask, onTaskMove]);

  // Keyboard navigation support
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, task: Task) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const href = workspaceSlug && projectSlug 
        ? `/${workspaceSlug}/${projectSlug}/tasks/${task.id}` 
        : workspaceSlug 
          ? `/${workspaceSlug}/tasks/${task.id}` 
          : `/tasks/${task.id}`;
      router.push(href);
    }
  }, [workspaceSlug, projectSlug, router]);

  // Navigation handler with proper router usage
  const handleNavigation = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // Subtask toggle handler
  const handleSubtaskToggle = useCallback(async (taskId: string, subtaskIndex: number, completed: boolean) => {
    if (onTaskUpdate) {
      try {
        setIsLoading(true);
        // This would update the subtask completion status
        await onTaskUpdate(taskId, { 
          childTasks: tasks.find(t => t.id === taskId)?.childTasks?.map((st, idx) => 
            idx === subtaskIndex ? { ...st, completed } : st
          ) 
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update subtask');
      } finally {
        setIsLoading(false);
      }
    }
  }, [onTaskUpdate, tasks]);

  const formatDueDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-600' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, color: 'text-yellow-600' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-muted-foreground' };
    }
  }, []);

  return (
    <div 
      className="flex-1 min-h-0 bg-[var(--background)] overflow-hidden flex flex-col"
      role="main"
      aria-label="Kanban board"
    >
      {/* Error Display */}
      {error && (
        <div 
          className=" bg-[var(--destructive-bg)] border-none rounded-lg text-[var(--destructive)] text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-black/10 dark:bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center"
          role="status"
          aria-label="Loading"
        >
          <div className="bg-[var(--card)] rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Moving task...</span>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Kanban Board */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto flex flex-col">
        <div 
          className="flex gap-4 md:gap-6 flex-1 min-w-fit pt-0"
          style={{ minWidth: 'max-content', height: '100%' }}
          role="application"
          aria-label="Task board with drag and drop functionality"
        >
        {statusesToUse.map((status) => {
          const isDropTarget = dragOverColumn === status;
          const taskCount = tasksByStatus[status].length;
          
          return (
            <div
              key={status}
              className={`flex-shrink-0 w-72 sm:w-80 transition-all duration-200 ${
                isDropTarget ? 'bg-[var(--primary-bg)]/10 rounded-lg ring-2 ring-[var(--primary)]/30' : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(status)}
              onDragLeave={handleDragLeave}
              onDrop={(e: React.DragEvent) => handleDrop(e, status)}
              role="region"
              aria-label={`${status} column with ${taskCount} tasks`}
            >
              {/* Column Container - dashboard style */}
              <div className="h-full bg-[var(--card)] rounded-lg shadow-sm border-none flex flex-col">
                {/* Column Header - dashboard style */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--muted)] rounded-t-lg mb-1">
                  <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                  <h3
                    className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide"
                    id={`column-${status.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {status.replace('_', ' ')}
                  </h3>
                  <span className="ml-2 text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">{taskCount} tasks</span>
                </div>

                {/* Tasks Container - dashboard style */}
                <div
                  className="p-4 space-y-2 overflow-y-auto flex-1 min-h-0"
                  role="list"
                  aria-labelledby={`column-${status.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {tasksByStatus[status].map((task, index) => {
                    // Find the project for this task if we have projects data
                    const taskProject = projects ? projects.find(p => p.id === task.projectId) : null;
                    // Use provided workspace/project slugs or get them from the project data
                    const wsSlug = workspaceSlug || (taskProject?.workspace?.slug || '');
                    const projSlug = projectSlug || (taskProject?.slug || '');
                    
                    const isDragging = draggedTask?.id === task.id;
                    
                    return (
                      <div
                        key={task.id}
                        ref={isDragging ? draggedItemRef : null}
                        className={`group cursor-move transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 rounded-lg ${
                          isDragging ? 'opacity-60 scale-105 rotate-2 z-50' : 'hover:scale-[1.01]'
                        }`}
                        draggable
                        onDragStart={(e: React.DragEvent) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, task)}
                        tabIndex={0}
                        role="listitem"
                        aria-label={`Task: ${task.title || 'Untitled Task'}, Status: ${status}, Priority: ${task.priority || 'None'}`}
                        aria-describedby={`task-details-${task.id}`}
                      >
                        {/* Task Card - dashboard style */}
                        <div className="bg-[var(--card)] rounded-lg border-none p-4 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none flex items-start gap-3 h-[9rem]">
                          {/* Priority Dot - dashboard style */}
                          <div
                            className={`w-2 h-2  rounded-full flex-shrink-0 mt-1 transition-all duration-200 cursor-pointer group/priority-dot hover:scale-125 hover:ring-2 hover:ring-offset-2 hover:ring-[var(--primary)] ${
                              task.priority?.toLowerCase() === 'high' ? 'bg-red-500' :
                              task.priority?.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                              task.priority?.toLowerCase() === 'low' ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span className="absolute z-10 hidden group-hover/priority-dot:inline-block bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg -mt-8 ml-2 whitespace-nowrap pointer-events-none lowercase">
                              priority:{task.priority}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--accent-foreground)]">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                {task.description}
                              </p>
                            )}
                            {/* Subtasks, comments, attachments - minimal, dashboard style */}
                            <div className="flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
                              {task.childTasks && task.childTasks.length > 0 && (
                                <span>{task.childTasks.length} subtasks</span>
                              )}
                              {task.comments && task.comments.length > 0 && (
                                <span>{task.comments.length} comments</span>
                              )}
                              {task.attachments && task.attachments.length > 0 && (
                                <span>{task.attachments.length} files</span>
                              )}
                            </div>
                          </div>
                          {/* Status and Due Date - dashboard style */}
                          <div className="flex flex-col items-end gap-1">
                            {task.status?.category && (
                              <span
                                className={`inline-block min-w-[80px] text-center px-2 py-0.5 rounded text-[12px] font-semibold ${
                                  task.status.category === 'DONE' ? 'bg-green-100 text-green-700' :
                                  task.status.category === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                  task.status.category === 'TODO' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {task.status.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                            )}
                            {task.dueDate && (
                              <div className="text-xs text-[var(--muted-foreground)] px-2 py-1 rounded-md whitespace-nowrap">
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Add Task Button - improved accessibility and responsive */}
                  <div className="mt-4 pt-2 flex justify-center">
                    <button
                      className="relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-1 text-xs mx-auto"
                      onClick={() => {
                        const href = workspaceSlug && projectSlug
                          ? `/${workspaceSlug}/${projectSlug}/tasks/new?status=${status}`
                          : workspaceSlug
                            ? `/${workspaceSlug}/tasks/new?status=${status}`
                            : `/tasks/new?status=${status}`;
                        handleNavigation(href);
                      }}
                      aria-label={`Add new task to ${status} column`}
                    >
                      + Create Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Add Column Button - improved accessibility and responsive */}
        <div className="flex-shrink-0 w-64 sm:w-80">
          <div className="h-full flex items-start pt-16">
            <button
              className="text-[var(--primary)] hover:text-[var(--primary)]/90 text-sm font-medium py-2 px-4 rounded-md hover:bg-[var(--primary)]/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              aria-label="Add new column to board"
              onClick={() => {
                // This would typically open a modal or form to create a new column
                console.log('Add new column clicked');
              }}
            >
              + ADD COLUMN
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}