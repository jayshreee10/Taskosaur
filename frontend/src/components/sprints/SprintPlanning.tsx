'use client';

import React, { useState, useEffect } from 'react';
import { Task, Sprint, TaskPriority, TaskType, SprintStatus } from '@/types/tasks';
import { Button } from '@/components/ui';
import UserAvatar from '@/components/ui/avatars/UserAvatar';

interface SprintPlanningProps {
  projectId: string;
  sprintId?: string | null;
  onSprintUpdate?: (sprint: Sprint) => void;
}

export default function SprintPlanning({ projectId, sprintId, onSprintUpdate }: SprintPlanningProps) {
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Mock sprint data
  const mockSprints: Sprint[] = [
    {
      id: 'sprint-1',
      name: 'Sprint 1 - Authentication',
      goal: 'Implement user authentication and basic security',
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-01-29T00:00:00Z',
      status: SprintStatus.ACTIVE,
      projectId,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z'
    },
    {
      id: 'sprint-2',
      name: 'Sprint 2 - Dashboard',
      goal: 'Build the main dashboard and navigation',
      startDate: '2024-01-30T00:00:00Z',
      endDate: '2024-02-13T00:00:00Z',
      status: SprintStatus.PLANNED,
      projectId,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z'
    }
  ];

  // Mock backlog tasks
  const mockBacklogTasks: Task[] = [
    {
      id: 'task-5',
      title: 'Implement OAuth login',
      description: 'Add social login options (Google, GitHub, etc.)',
      type: TaskType.STORY,
      priority: TaskPriority.HIGH,
      taskNumber: 5,
      key: 'PROJ-5',
      projectId,
      reporterId: 'user-1',
      reporter: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-1',
      status: {
        id: 'status-1',
        name: 'Backlog',
        color: '#6b7280',
        category: 'TODO' as any,
        order: 0,
        isDefault: false,
        workflowId: 'workflow-1'
      },
      storyPoints: 13,
      originalEstimate: 780,
      remainingEstimate: 780,
      labels: [
        { id: 'label-1', name: 'Authentication', color: '#3b82f6', projectId },
        { id: 'label-2', name: 'Backend', color: '#10b981', projectId }
      ],
      createdAt: '2024-01-18T10:00:00Z',
      updatedAt: '2024-01-18T10:00:00Z'
    },
    {
      id: 'task-6',
      title: 'Create user profile page',
      description: 'Design and implement user profile management',
      type: TaskType.STORY,
      priority: TaskPriority.MEDIUM,
      taskNumber: 6,
      key: 'PROJ-6',
      projectId,
      reporterId: 'user-2',
      reporter: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-1',
      status: {
        id: 'status-1',
        name: 'Backlog',
        color: '#6b7280',
        category: 'TODO' as any,
        order: 0,
        isDefault: false,
        workflowId: 'workflow-1'
      },
      storyPoints: 5,
      originalEstimate: 300,
      remainingEstimate: 300,
      labels: [
        { id: 'label-3', name: 'Frontend', color: '#f59e0b', projectId },
        { id: 'label-4', name: 'Profile', color: '#8b5cf6', projectId }
      ],
      createdAt: '2024-01-19T09:00:00Z',
      updatedAt: '2024-01-19T09:00:00Z'
    },
    {
      id: 'task-7',
      title: 'Add email notifications',
      description: 'Send email notifications for important events',
      type: TaskType.TASK,
      priority: TaskPriority.LOW,
      taskNumber: 7,
      key: 'PROJ-7',
      projectId,
      reporterId: 'user-3',
      reporter: {
        id: 'user-3',
        firstName: 'Alice',
        lastName: 'Johnson',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-1',
      status: {
        id: 'status-1',
        name: 'Backlog',
        color: '#6b7280',
        category: 'TODO' as any,
        order: 0,
        isDefault: false,
        workflowId: 'workflow-1'
      },
      storyPoints: 8,
      originalEstimate: 480,
      remainingEstimate: 480,
      labels: [
        { id: 'label-2', name: 'Backend', color: '#10b981', projectId },
        { id: 'label-5', name: 'Notifications', color: '#ef4444', projectId }
      ],
      createdAt: '2024-01-20T11:00:00Z',
      updatedAt: '2024-01-20T11:00:00Z'
    }
  ];

  const mockSprintTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Setup JWT authentication',
      description: 'Implement JWT token-based authentication system',
      type: TaskType.STORY,
      priority: TaskPriority.HIGH,
      taskNumber: 1,
      key: 'PROJ-1',
      projectId,
      sprintId: currentSprint?.id,
      reporterId: 'user-1',
      reporter: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-1',
      status: {
        id: 'status-1',
        name: 'Sprint Backlog',
        color: '#64748b',
        category: 'TODO' as any,
        order: 1,
        isDefault: true,
        workflowId: 'workflow-1'
      },
      storyPoints: 8,
      originalEstimate: 480,
      remainingEstimate: 480,
      labels: [
        { id: 'label-1', name: 'Authentication', color: '#3b82f6', projectId },
        { id: 'label-2', name: 'Backend', color: '#10b981', projectId }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the current sprint
        const sprint = sprintId ? mockSprints.find(s => s.id === sprintId) : mockSprints[0];
        setCurrentSprint(sprint || null);
        
        setBacklogTasks(mockBacklogTasks);
        setSprintTasks(mockSprintTasks);
      } catch (error) {
        console.error('Error loading sprint planning data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId, sprintId]);

  // Client-side only date initialization to prevent hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Helper function for consistent date formatting to prevent hydration issues
  const formatDate = (dateString: string) => {
    if (!currentDate) return 'Loading...';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getTaskTypeIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.BUG: return '🐛';
      case TaskType.STORY: return '📖';
      case TaskType.EPIC: return '🎯';
      case TaskType.SUBTASK: return '📝';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGHEST: return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case TaskPriority.HIGH: return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case TaskPriority.MEDIUM: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case TaskPriority.LOW: return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case TaskPriority.LOWEST: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getTotalStoryPoints = (tasks: Task[]) => {
    return tasks.reduce((total, task) => total + (task.storyPoints || 0), 0);
  };

  const getTotalEstimate = (tasks: Task[]) => {
    return tasks.reduce((total, task) => total + (task.originalEstimate || 0), 0);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBacklogDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTask && draggedTask.sprintId === currentSprint?.id) {
      // Move task from sprint to backlog
      setSprintTasks(prev => prev.filter(task => task.id !== draggedTask.id));
      setBacklogTasks(prev => [...prev, { ...draggedTask, sprintId: undefined }]);
      console.log('Moving task to backlog:', draggedTask.id);
    }
  };

  const handleSprintDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTask && !draggedTask.sprintId) {
      // Move task from backlog to sprint
      setBacklogTasks(prev => prev.filter(task => task.id !== draggedTask.id));
      setSprintTasks(prev => [...prev, { ...draggedTask, sprintId: currentSprint?.id }]);
      console.log('Moving task to sprint:', draggedTask.id);
    }
  };

  const handleTaskClick = (task: Task) => {
    if (task.sprintId) {
      // Move from sprint to backlog
      setSprintTasks(prev => prev.filter(t => t.id !== task.id));
      setBacklogTasks(prev => [...prev, { ...task, sprintId: undefined }]);
    } else {
      // Move from backlog to sprint
      setBacklogTasks(prev => prev.filter(t => t.id !== task.id));
      setSprintTasks(prev => [...prev, { ...task, sprintId: currentSprint?.id }]);
    }
  };

  const renderTask = (task: Task, inSprint: boolean) => (
    <div
      key={task.id}
      className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
        draggedTask?.id === task.id ? 'opacity-50' : ''
      } ${inSprint ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900'}`}
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      onDragEnd={handleDragEnd}
      onClick={() => handleTaskClick(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {task.key}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {task.storyPoints && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {task.storyPoints} SP
            </span>
          )}
        </div>
      </div>

      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {task.labels?.slice(0, 2).map(label => (
            <span 
              key={label.id}
              className="inline-flex items-center px-2 py-1 text-xs rounded-full"
              style={{ 
                backgroundColor: `${label.color}20`, 
                color: label.color 
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(task.originalEstimate || 0)}
          </span>
          {task.assignee && (
            <UserAvatar
              user={task.assignee}
              size="xs"
            />
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentSprint) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Sprint Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a sprint from the dropdown above to start planning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sprint Planning
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {currentSprint?.name || 'Select a sprint'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            Save Changes
          </Button>
          <Button>
            Start Sprint
          </Button>
        </div>
      </div>

      {/* Sprint Info */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sprint Goal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentSprint?.goal || 'No goal set'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentSprint ? `${formatDate(currentSprint.startDate)} - ${formatDate(currentSprint.endDate)}` : 'No dates set'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capacity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {(currentSprint as any)?.capacity || 0} hours
            </p>
          </div>
        </div>
      </div>

      {/* Planning Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backlog */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Product Backlog
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{backlogTasks.length} tasks</span>
              <span>{getTotalStoryPoints(backlogTasks)} story points</span>
              <span>{formatTime(getTotalEstimate(backlogTasks))}</span>
            </div>
          </div>
          
          <div
            className="space-y-3 min-h-[500px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
            onDragOver={handleDragOver}
            onDrop={handleBacklogDrop}
          >
            {backlogTasks.map(task => renderTask(task, false))}
            {backlogTasks.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  No tasks in backlog
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sprint */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sprint Backlog
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{sprintTasks.length} tasks</span>
              <span>{getTotalStoryPoints(sprintTasks)} story points</span>
              <span>{formatTime(getTotalEstimate(sprintTasks))}</span>
            </div>
          </div>
          
          <div
            className="space-y-3 min-h-[500px] p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600"
            onDragOver={handleDragOver}
            onDrop={handleSprintDrop}
          >
            {sprintTasks.map(task => renderTask(task, true))}
            {sprintTasks.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-blue-500 dark:text-blue-400 mt-2">
                  Drag tasks here to add to sprint
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sprint Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sprint Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {sprintTasks.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tasks
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {getTotalStoryPoints(sprintTasks)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Story Points
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatTime(getTotalEstimate(sprintTasks))}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Estimated Time
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {currentSprint.capacity || 0}h
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Capacity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}