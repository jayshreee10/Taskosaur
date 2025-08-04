'use client';

import React, { useState, useEffect } from 'react';
import { Task, Sprint, SprintStatus } from '@/types/tasks';

interface SprintProgressProps {
  selectedSprint?: string | null;
}

export default function SprintProgress({ selectedSprint }: SprintProgressProps) {
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      projectId: 'project-1',
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
      projectId: 'project-1',
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z'
    }
  ];

  // Mock tasks data
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Setup JWT authentication',
      description: 'Implement JWT token-based authentication system',
      type: 'STORY' as any,
      priority: 'HIGH' as any,
      taskNumber: 1,
      key: 'PROJ-1',
      projectId: 'project-1',
      reporterId: 'user-1',
      reporter: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-2',
      status: {
        id: 'status-2',
        name: 'In Progress',
        color: '#f59e0b',
        category: 'IN_PROGRESS' as any,
        order: 1,
        isDefault: false,
        workflowId: 'workflow-1'
      },
      storyPoints: 8,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'task-2',
      title: 'Create login form',
      description: 'Design and implement user login form',
      type: 'STORY' as any,
      priority: 'MEDIUM' as any,
      taskNumber: 2,
      key: 'PROJ-2',
      projectId: 'project-1',
      reporterId: 'user-1',
      reporter: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-5',
      status: {
        id: 'status-5',
        name: 'Done',
        color: '#10b981',
        category: 'DONE' as any,
        order: 4,
        isDefault: false,
        workflowId: 'workflow-1'
      },
      storyPoints: 5,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Find the current sprint
        const sprint = selectedSprint ? mockSprints.find(s => s.id === selectedSprint) : mockSprints[0];
        setCurrentSprint(sprint || null);
        
        // Filter tasks for current sprint
        const sprintTasks = mockTasks.filter(task => task.sprintId === selectedSprint);
        setTasks(sprintTasks);
      } catch (error) {
        console.error('Error loading sprint progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedSprint]);

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

  const getTotalStoryPoints = () => {
    return tasks.reduce((total, task) => total + (task.storyPoints || 0), 0);
  };

  const getCompletedStoryPoints = () => {
    return tasks
      .filter(task => task.status.category === 'DONE')
      .reduce((total, task) => total + (task.storyPoints || 0), 0);
  };

  const getTotalTimeSpent = () => {
    return tasks.reduce((total, task) => {
      const timeSpent = task.timeEntries?.reduce((taskTotal, entry) => taskTotal + entry.timeSpent, 0) || 0;
      return total + timeSpent;
    }, 0);
  };

  const getTotalOriginalEstimate = () => {
    return tasks.reduce((total, task) => total + (task.originalEstimate || 0), 0);
  };

  const getRemainingEstimate = () => {
    return tasks.reduce((total, task) => total + (task.remainingEstimate || 0), 0);
  };

  const getCompletionPercentage = () => {
    const total = getTotalStoryPoints();
    const completed = getCompletedStoryPoints();
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getTimePercentage = () => {
    const estimate = getTotalOriginalEstimate();
    const spent = getTotalTimeSpent();
    return estimate > 0 ? (spent / estimate) * 100 : 0;
  };

  const getTasksByStatus = () => {
    const statusCounts = {
      'TODO': 0,
      'IN_PROGRESS': 0,
      'DONE': 0
    };

    tasks.forEach(task => {
      statusCounts[task.status.category]++;
    });

    return statusCounts;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getDaysRemaining = () => {
    if (!currentSprint || !currentDate) return 0;
    const endDate = new Date(currentSprint.endDate);
    const diffTime = endDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSprintDuration = () => {
    if (!currentSprint) return 0;
    const startDate = new Date(currentSprint.startDate);
    const endDate = new Date(currentSprint.endDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSprintProgress = () => {
    if (!currentSprint || !currentDate) return 0;
    const startDate = new Date(currentSprint.startDate);
    const endDate = new Date(currentSprint.endDate);
    
    if (currentDate < startDate) return 0;
    if (currentDate > endDate) return 100;
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();
    return (elapsed / totalDuration) * 100;
  };

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
            Please select a sprint from the dropdown above to view progress.
          </p>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();
  const timePercentage = getTimePercentage();
  const statusCounts = getTasksByStatus();
  const daysRemaining = getDaysRemaining();
  // const sprintDuration = getSprintDuration();
  const sprintProgress = getSprintProgress();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Sprint Progress
      </h3>

      {/* Sprint Timeline */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sprint Timeline
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Sprint ended'}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, sprintProgress)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDate(currentSprint.startDate)}</span>
          <span>{formatDate(currentSprint.endDate)}</span>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Story Points */}
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {getCompletedStoryPoints()}/{getTotalStoryPoints()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Story Points
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round(completionPercentage)}% complete
          </div>
        </div>

        {/* Time Tracking */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatTime(getTotalTimeSpent())}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Time Spent
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                timePercentage > 100 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, timePercentage)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTime(getTotalOriginalEstimate())} estimated
          </div>
        </div>

        {/* Tasks */}
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {statusCounts.DONE}/{tasks.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tasks Complete
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${tasks.length > 0 ? (statusCounts.DONE / tasks.length) * 100 : 0}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {statusCounts.IN_PROGRESS} in progress
          </div>
        </div>

        {/* Velocity */}
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {(currentSprint as any)?.velocity || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Velocity
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Story points per day
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Capacity: {(currentSprint as any)?.capacity || 0}h
          </div>
        </div>
      </div>

      {/* Burndown Chart Placeholder */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Sprint Burndown
        </h4>
        <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Burndown chart will be implemented here
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Actions
          </h4>
          <div className="flex space-x-2">
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
              View Sprint Report
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}