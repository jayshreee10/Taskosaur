"use client";

import React, { useState, useEffect } from 'react';
import { useTask } from '../../contexts/task-context';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  HiPlus,
  HiPencilSquare,
  HiXMark,
  HiCheck,
  HiListBullet,
  HiExclamationTriangle
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
        markFetchComplete(fetchKey, statuses);
      } catch (error) {
        console.error('Failed to fetch task statuses:', error);
        markFetchError(fetchKey);
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
        setSubtasks(cachedData);
        return;
      }
    }

    const fetchSubtasks = async () => {
      markFetchStart(fetchKey);
      
      try {
        const taskSubtasks = await getSubtasksByParent(taskId);
        setSubtasks(taskSubtasks);
        markFetchComplete(fetchKey, taskSubtasks);
      } catch (error) {
        console.error('Failed to fetch subtasks:', error);
        markFetchError(fetchKey);
      }
    };

    fetchSubtasks();
  }, [taskId]);

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

  // Helper function to get priority colors
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGHEST':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-none';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-none';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-none';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-none';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border-none';
    }
  };

  const completedCount = subtasks.filter(s => isSubtaskCompleted(s)).length;

  if (!currentUser) {
    return (
      <div className="mb-8">
        <Alert className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]">
          <HiExclamationTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to manage subtasks.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <HiListBullet className="w-5 h-5 text-[var(--primary)]" />
        <h3 className="text-md font-semibold text-[var(--foreground)]">
          Subtasks ({completedCount}/{subtasks.length})
        </h3>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-6 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-[var(--muted-foreground)]">Loading subtasks...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
          <HiExclamationTriangle className="h-4 w-4" />
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      )}
      
      {/* Subtasks List */}
      {subtasks.length > 0 && (
        <div className="space-y-3 mb-6">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center justify-between group p-4 rounded-lg hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
            >
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id={`subtask-${subtask.id}`}
                  checked={isSubtaskCompleted(subtask)}
                  onChange={() => handleToggleSubtaskStatus(subtask.id)}
                  className="h-4 w-4 text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 border-[var(--border)] rounded cursor-pointer accent-[var(--primary)]"
                  disabled={loading}
                />
                {editingSubtaskId === subtask.id ? (
                  <div className="ml-3 flex-1 flex items-center gap-2">
                    <Input
                      type="text"
                      value={editingTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTitle(e.target.value)}
                      className="flex-1 h-9 border-input bg-background text-[var(--foreground)]"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleSaveEdit(subtask.id)}
                      disabled={loading}
                      size="sm"
                      className="h-8 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] flex items-center gap-1"
                    >
                      <HiCheck className="w-3 h-3" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="h-8 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
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
                          ? "text-[var(--muted-foreground)] line-through"
                          : "text-[var(--foreground)]"
                      }`}
                    >
                      {subtask.title}
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getPriorityConfig(subtask.priority)}>
                        {subtask.priority}
                      </Badge>
                      <Badge className="bg-[var(--muted)] text-[var(--muted-foreground)] border-none">
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
                    className="text-[var(--muted-foreground)] hover:text-[var(--primary)] p-2 rounded-lg transition-colors"
                    title="Edit subtask"
                    disabled={loading}
                  >
                    <HiPencilSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] p-2 rounded-lg transition-colors"
                    title="Delete subtask"
                    disabled={loading}
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && subtasks.length === 0 && (
        <div className="text-center py-8 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
          <HiListBullet className="w-8 h-8 mx-auto mb-3 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No subtasks yet. Add one to break down this task.</p>
        </div>
      )}

      {/* Add Subtask Form/Button */}
      {isAddingSubtask ? (
        <form onSubmit={handleAddSubtask} className="mt-4">
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={newSubtaskTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubtaskTitle(e.target.value)}
              placeholder="Enter subtask title..."
              className="flex-1 h-9 border-input bg-background text-[var(--foreground)]"
              autoFocus
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!newSubtaskTitle.trim() || loading}
              size="sm"
              className="h-9 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] flex items-center gap-1"
            >
              <HiPlus className="w-3 h-3" />
              {loading ? 'Adding...' : 'Add'}
            </Button>
            <Button
              type="button"
              onClick={handleCancelAddSubtask}
              variant="outline"
              size="sm"
              disabled={loading}
              className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4">
          <Button
            onClick={() => setIsAddingSubtask(true)}
                className="relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2 text-sm"
            disabled={loading}
          >
            <HiPlus className="w-4 h-4" />
            Add subtask
          </Button>
        </div>
      )}
    </div>
  );
}