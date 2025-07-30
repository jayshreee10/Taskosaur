"use client";

import React, { useState, useEffect } from 'react';
import { useTask } from '../../contexts/task-context';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import {
  HiPlus,
  HiPencilSquare,
  HiXMark,
  HiCheck,
  HiListBullet
} from 'react-icons/hi2';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
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

// UI Components matching your theme
const Button = ({ 
  children, 
  variant = "primary", 
  size = "sm",
  className = "",
  disabled = false,
  ...props 
}: { 
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) => {
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white",
    secondary: "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-600",
    danger: "bg-red-600 hover:bg-red-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm"
  };
  
  return (
    <button 
      className={`rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }: { className?: string; [key: string]: any }) => (
  <input
    className={`w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:bg-stone-700 dark:text-white transition-colors text-sm ${className}`}
    {...props}
  />
);

import { Badge } from '@/components/ui/badge';

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
    loading, 
    error 
  } = useTask();

  // Global fetch prevention hook
  const {
    shouldPreventFetch,
    markFetchStart,
    markFetchComplete,
    markFetchError,
    getCachedData
  } = useGlobalFetchPrevention();

  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<any[]>([]);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Get current user from localStorage
  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const userString = localStorage.getItem('user');
        if (userString) {
          const user: User = JSON.parse(userString);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    };

    getUserFromStorage();
  }, []);

  // Fetch task statuses
  useEffect(() => {
    const fetchKey = 'all-task-statuses';
    
    // Check if we should prevent this fetch
    if (shouldPreventFetch(fetchKey)) {
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setTaskStatuses(cachedData);
        return;
      }
    }

    const fetchStatuses = async () => {
      markFetchStart(fetchKey);
      
      try {
        const statuses = await getAllTaskStatuses();
        setTaskStatuses(statuses);
        
        // Cache the successful result
        markFetchComplete(fetchKey, statuses);
      } catch (error) {
        console.error('Failed to fetch task statuses:', error);
        markFetchError(fetchKey);
      }
    };

    fetchStatuses();
  }, []); // No dependencies needed for statuses - they don't change

  // Fetch subtasks when component mounts or taskId changes
  useEffect(() => {
    if (!taskId) return;

    const fetchKey = `subtasks-${taskId}`;
    
    // Check if we should prevent this fetch
    if (shouldPreventFetch(fetchKey)) {
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setSubtasks(cachedData);
        return;
      }
    }

    const fetchSubtasks = async () => {
      markFetchStart(fetchKey);
      
      try {
        const taskSubtasks = await getSubtasksByParent(taskId);
        setSubtasks(taskSubtasks);
        
        // Cache the successful result
        markFetchComplete(fetchKey, taskSubtasks);
      } catch (error) {
        console.error('Failed to fetch subtasks:', error);
        markFetchError(fetchKey);
      }
    };

    fetchSubtasks();
  }, [taskId]); // Only depend on task ID

  // Refresh subtasks function for real-time updates
  const refreshSubtasks = async () => {
    try {
      const taskSubtasks = await getSubtasksByParent(taskId);
      setSubtasks(taskSubtasks);
    } catch (error) {
      console.error('Failed to refresh subtasks:', error);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !currentUser) return;

    try {
      const defaultStatus = taskStatuses.find(s => s.category === 'TODO') || taskStatuses[0];

      if (!defaultStatus) {
        console.error('No task statuses available');
        return;
      }

      const subtaskData = {
        title: newSubtaskTitle.trim(),
        description: `Subtask for parent task`,
        priority: 'MEDIUM' as const,
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        projectId,
        assigneeId: currentUser.id,
        reporterId: currentUser.id,
        statusId: defaultStatus.id,
        parentTaskId: taskId,
      };

      const newSubtask = await createSubtask(subtaskData);
      
      // Refresh subtasks to get the latest data
      await refreshSubtasks();
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      
      onSubtaskAdded?.(newSubtask);
    } catch (error) {
      console.error("Failed to add subtask:", error);
    }
  };

  const handleToggleSubtaskStatus = async (subtaskId: string) => {
    try {
      const subtask = subtasks.find(s => s.id === subtaskId);
      if (!subtask) return;

      const completedStatus = taskStatuses.find(s => s.category === 'DONE');
      const todoStatus = taskStatuses.find(s => s.category === 'TODO');

      if (!completedStatus || !todoStatus) {
        console.error('Required statuses not found (DONE or TODO categories)');
        return;
      }

      const currentStatus = taskStatuses.find(s => s.id === subtask.statusId);
      const isCurrentlyCompleted = currentStatus?.category === 'DONE';
      const newStatusId = isCurrentlyCompleted ? todoStatus.id : completedStatus.id;

      await updateTask(subtaskId, {
        statusId: newStatusId
      });

      // Refresh subtasks to get the latest data
      await refreshSubtasks();

      onSubtaskUpdated?.(subtaskId, { statusId: newStatusId });
    } catch (error) {
      console.error("Failed to toggle subtask status:", error);
    }
  };

  const handleEditSubtask = (subtaskId: string, currentTitle: string) => {
    setEditingSubtaskId(subtaskId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = async (subtaskId: string) => {
    if (!editingTitle.trim()) return;

    try {
      await updateTask(subtaskId, {
        title: editingTitle.trim()
      });

      // Refresh subtasks to get the latest data
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

  const handleDeleteSubtask = async (subtaskId: string) => {
    const confirmDelete = async () => {
      try {
        await deleteTask(subtaskId);
        
        // Refresh subtasks to get the latest data
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
      if (window.confirm("Are you sure you want to delete this subtask? This action cannot be undone.")) {
        confirmDelete();
      }
    }
  };

  const handleCancelAddSubtask = () => {
    setIsAddingSubtask(false);
    setNewSubtaskTitle("");
  };

  // Helper function to check if subtask is completed
  const isSubtaskCompleted = (subtask: Task) => {
    const currentStatus = taskStatuses.find(s => s.id === subtask.statusId);
    return currentStatus?.category === 'DONE';
  };

  // Helper function to get priority variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'HIGHEST':
        return 'destructive';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const completedCount = subtasks.filter(s => isSubtaskCompleted(s)).length;

  if (!currentUser) {
    return (
      <div className="mb-8">
        <div className="text-center text-stone-500 dark:text-stone-400 p-4 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
          Please log in to manage subtasks.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
        <HiListBullet size={16} className="text-amber-600" />
        Subtasks ({completedCount}/{subtasks.length})
      </h2>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-stone-500 dark:text-stone-400 py-6 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-200 border-t-amber-600"></div>
            <span className="text-sm">Loading subtasks...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-600 dark:text-red-400 py-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <span className="text-sm">Error: {error}</span>
        </div>
      )}
      
      {/* Subtasks List */}
      {subtasks.length > 0 && (
        <div className="space-y-2 mb-4">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center justify-between group p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors"
            >
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id={`subtask-${subtask.id}`}
                  checked={isSubtaskCompleted(subtask)}
                  onChange={() => handleToggleSubtaskStatus(subtask.id)}
                  className="h-4 w-4 text-amber-600 focus:ring-2 focus:ring-amber-500/20 border-stone-300 dark:border-stone-600 rounded cursor-pointer"
                  disabled={loading}
                />
                {editingSubtaskId === subtask.id ? (
                  <div className="ml-3 flex-1 flex items-center gap-2">
                    <Input
                      type="text"
                      value={editingTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTitle(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleSaveEdit(subtask.id)}
                      disabled={loading}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <HiCheck size={12} />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="secondary"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="ml-3 flex-1">
                    <label
                      htmlFor={`subtask-${subtask.id}`}
                      className={`text-sm cursor-pointer block font-medium ${
                        isSubtaskCompleted(subtask)
                          ? "text-stone-500 dark:text-stone-400 line-through"
                          : "text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      {subtask.title}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getPriorityVariant(subtask.priority)}>
                        {subtask.priority}
                      </Badge>
                      <Badge variant="default">
                        {taskStatuses.find(s => s.id === subtask.statusId)?.name || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              
              {editingSubtaskId !== subtask.id && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => handleEditSubtask(subtask.id, subtask.title)}
                    className="text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 p-1 rounded transition-colors"
                    title="Edit subtask"
                    disabled={loading}
                  >
                    <HiPencilSquare size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 p-1 rounded transition-colors"
                    title="Delete subtask"
                    disabled={loading}
                  >
                    <HiXMark size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && subtasks.length === 0 && (
        <div className="text-center text-stone-500 dark:text-stone-400 py-8 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
          <HiListBullet size={32} className="mx-auto mb-2 text-stone-400" />
          <p className="text-sm">No subtasks yet. Add one to break down this task.</p>
        </div>
      )}

      {/* Add Subtask Form/Button */}
      {isAddingSubtask ? (
        <form onSubmit={handleAddSubtask} className="mt-4">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newSubtaskTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubtaskTitle(e.target.value)}
              placeholder="Enter subtask title..."
              className="flex-1"
              autoFocus
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!newSubtaskTitle.trim() || loading}
              size="sm"
              className="flex items-center gap-1"
            >
              <HiPlus size={12} />
              {loading ? 'Adding...' : 'Add'}
            </Button>
            <Button
              type="button"
              onClick={handleCancelAddSubtask}
              variant="secondary"
              size="sm"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4">
          <button
            onClick={() => setIsAddingSubtask(true)}
            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 disabled:opacity-50 flex items-center gap-1 transition-colors"
            disabled={loading}
          >
            <HiPlus size={14} />
            Add subtask
          </button>
        </div>
      )}
    </div>
  );
}