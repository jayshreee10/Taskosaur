'use client';

import React, { useState, useEffect } from 'react';
import { Task, Sprint, TaskPriority, TaskType, SprintStatus } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import {
  HiPlay,
  HiBookmark,
  HiClock,
  HiCalendar,
  HiFlag,
  HiPlus,
  HiClipboardDocumentList,
  HiArrowRight,
  HiChartBar,
  HiUsers,
  HiExclamationTriangle,
  HiDocumentText,
  HiPencilSquare
} from 'react-icons/hi2';

interface SprintPlanningProps {
  projectId: string;
  sprintId?: string | null;
  onSprintUpdate?: (sprint: Sprint) => void;
}

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-[var(--muted)] rounded w-1/3 mb-4"></div>
      <div className="h-6 bg-[var(--muted)] rounded w-1/2 mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[var(--card)] rounded-[var(--card-radius)] border-none p-6">
            <div className="h-6 bg-[var(--muted)] rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-24 bg-[var(--muted)] rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const getTaskTypeIcon = (type: TaskType) => {
  switch (type) {
    case TaskType.BUG: return <HiExclamationTriangle className="w-4 h-4" />;
    case TaskType.STORY: return <HiDocumentText className="w-4 h-4" />;
    case TaskType.EPIC: return <HiFlag className="w-4 h-4" />;
    case TaskType.SUBTASK: return <HiPencilSquare className="w-4 h-4" />;
    default: return <HiClipboardDocumentList className="w-4 h-4" />;
  }
};

const getPriorityConfig = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.HIGHEST:
      return { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-none' };
    case TaskPriority.HIGH:
      return { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-none' };
    case TaskPriority.MEDIUM:
      return { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-none' };
    case TaskPriority.LOW:
      return { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-none' };
    case TaskPriority.LOWEST:
      return { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-none' };
    default:
      return { className: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-none' };
  }
};

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
      sprintId: 'sprint-1',
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
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
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
    <Card
      key={task.id}
      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-none ${
        draggedTask?.id === task.id ? 'opacity-50' : ''
      } ${inSprint ? 'bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10' : 'bg-[var(--card)] hover:bg-[var(--accent)]'}`}
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      onDragEnd={handleDragEnd}
      onClick={() => handleTaskClick(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-[var(--primary)]">
              {getTaskTypeIcon(task.type)}
            </div>
            <span className="text-sm text-[var(--muted-foreground)] font-medium">
              {task.key}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const config = getPriorityConfig(task.priority);
              return (
                <Badge className={`text-xs ${config.className}`}>
                  {task.priority}
                </Badge>
              );
            })()}
            {task.storyPoints && (
              <Badge variant="secondary" className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] border-none">
                {task.storyPoints} SP
              </Badge>
            )}
          </div>
        </div>

        <h4 className="text-sm font-medium text-[var(--foreground)] mb-2 line-clamp-2">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-xs text-[var(--muted-foreground)] mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {task.labels?.slice(0, 2).map(label => (
              <Badge 
                key={label.id}
                variant="secondary"
                className="text-xs border-none"
                style={{ 
                  backgroundColor: `${label.color}20`, 
                  color: label.color 
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <HiClock className="w-3 h-3" />
              {formatTime(task.originalEstimate || 0)}
            </div>
            {task.assignee && (
              <UserAvatar
                user={task.assignee}
                size="xs"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!currentSprint) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-4">
          <HiCalendar className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          No Sprint Selected
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Please select a sprint from the dropdown above to start planning.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <HiCalendar className="w-5 h-5 text-[var(--primary)]" />
            Sprint Planning
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {currentSprint?.name || 'Select a sprint'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="h-9 px-4 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
          >
            <HiBookmark className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button className="h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg">
            <HiPlay className="w-4 h-4 mr-2" />
            Start Sprint
          </Button>
        </div>
      </div>

      {/* Sprint Info */}
      <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                <HiFlag className="w-4 h-4 text-[var(--primary)]" />
                Sprint Goal
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {currentSprint?.goal || 'No goal set'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                <HiCalendar className="w-4 h-4 text-[var(--primary)]" />
                Duration
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {currentSprint ? `${formatDate(currentSprint.startDate)} - ${formatDate(currentSprint.endDate)}` : 'No dates set'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                <HiUsers className="w-4 h-4 text-[var(--primary)]" />
                Capacity
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {(currentSprint as any)?.capacity || 0} hours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backlog */}
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                <HiClipboardDocumentList className="w-5 h-5 text-[var(--muted-foreground)]" />
                Product Backlog
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                <span>{backlogTasks.length} tasks</span>
                <span>{getTotalStoryPoints(backlogTasks)} SP</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-3 min-h-[500px] p-4 bg-[var(--muted)]/30 rounded-lg border-2 border-dashed border-[var(--border)] transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleBacklogDrop}
            >
              {backlogTasks.map(task => renderTask(task, false))}
              {backlogTasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                    <HiClipboardDocumentList className="w-6 h-6 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No tasks in backlog
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sprint */}
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                <HiFlag className="w-5 h-5 text-[var(--primary)]" />
                Sprint Backlog
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                <span>{sprintTasks.length} tasks</span>
                <span>{getTotalStoryPoints(sprintTasks)} SP</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-3 min-h-[500px] p-4 bg-[var(--primary)]/5 rounded-lg border-2 border-dashed border-[var(--primary)]/20 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleSprintDrop}
            >
              {sprintTasks.map(task => renderTask(task, true))}
              {sprintTasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <HiPlus className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <p className="text-sm text-[var(--primary)] font-medium mb-1">
                    Drag tasks here to add to sprint
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Click tasks to move them between backlog and sprint
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sprint Summary */}
      <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <HiChartBar className="w-5 h-5 text-[var(--primary)]" />
            Sprint Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <HiClipboardDocumentList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
                {sprintTasks.length}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Tasks
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <HiFlag className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
                {getTotalStoryPoints(sprintTasks)}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Story Points
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <HiClock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
                {formatTime(getTotalEstimate(sprintTasks))}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Estimated Time
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <HiUsers className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
                {(currentSprint as any)?.capacity || 0}h
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Capacity
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}