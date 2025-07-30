'use client';

import React, { useState, useEffect } from 'react';
import { Task, Sprint, TaskStatus } from '@/types/tasks';
import TaskColumn from '@/components/tasks/TaskColumn';
import { Button } from '@/components/ui';
import SprintSelector from './SprintSelector';
import SprintProgress from './SprintProgress';

interface SprintBoardProps {
  projectId: string;
  sprintId?: string;
}

export default function SprintBoard({ projectId, sprintId }: SprintBoardProps) {

  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Mock data - in real app, this would come from API
  const mockStatuses: TaskStatus[] = [
    {
      id: 'status-1',
      name: 'Sprint Backlog',
      description: 'Tasks planned for this sprint',
      color: '#64748b',
      category: 'TODO' as any,
      order: 1,
      isDefault: true,
      workflowId: 'workflow-1'
    },
    {
      id: 'status-2',
      name: 'In Progress',
      description: 'Tasks currently being worked on',
      color: '#f59e0b',
      category: 'IN_PROGRESS' as any,
      order: 2,
      isDefault: false,
      workflowId: 'workflow-1'
    },
    {
      id: 'status-3',
      name: 'Testing',
      description: 'Tasks being tested',
      color: '#3b82f6',
      category: 'IN_PROGRESS' as any,
      order: 3,
      isDefault: false,
      workflowId: 'workflow-1'
    },
    {
      id: 'status-4',
      name: 'Done',
      description: 'Completed tasks',
      color: '#10b981',
      category: 'DONE' as any,
      order: 4,
      isDefault: false,
      workflowId: 'workflow-1'
    }
  ];

  const mockSprints: Sprint[] = [
    {
      id: 'sprint-1',
      name: 'Sprint 1 - Authentication',
      goal: 'Implement user authentication and basic security features',
      startDate: '2024-01-15',
      endDate: '2024-01-29',
      status: 'ACTIVE' as any,
      projectId,
      capacity: 120,
      velocity: 0,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'sprint-2',
      name: 'Sprint 2 - Dashboard',
      goal: 'Build the main dashboard and navigation',
      startDate: '2024-01-30',
      endDate: '2024-02-13',
      status: 'PLANNED' as any,
      projectId,
      capacity: 100,
      velocity: 0,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z'
    }
  ];

  const mockSprintTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Setup JWT authentication',
      description: 'Implement JWT token-based authentication system',
      type: 'STORY' as any,
      priority: 'HIGH' as any,
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
      statusId: 'status-2',
      status: mockStatuses[1],
      assigneeId: 'user-2',
      assignee: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: '/api/placeholder/40/40'
      },
      storyPoints: 8,
      originalEstimate: 480,
      remainingEstimate: 240,
      labels: [
        { id: 'label-1', name: 'Authentication', color: '#3b82f6', projectId },
        { id: 'label-2', name: 'Backend', color: '#10b981', projectId }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-18T14:30:00Z'
    },
    {
      id: 'task-2',
      title: 'Create login/register forms',
      description: 'Design and implement user-friendly login and registration forms',
      type: 'STORY' as any,
      priority: 'HIGH' as any,
      taskNumber: 2,
      key: 'PROJ-2',
      projectId,
      sprintId: 'sprint-1',
      reporterId: 'user-1',
      reporter: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-4',
      status: mockStatuses[3],
      assigneeId: 'user-3',
      assignee: {
        id: 'user-3',
        firstName: 'Alice',
        lastName: 'Johnson',
        avatar: '/api/placeholder/40/40'
      },
      storyPoints: 5,
      originalEstimate: 300,
      remainingEstimate: 0,
      completedAt: '2024-01-20T16:00:00Z',
      labels: [
        { id: 'label-1', name: 'Authentication', color: '#3b82f6', projectId },
        { id: 'label-3', name: 'Frontend', color: '#f59e0b', projectId }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T16:00:00Z'
    },
    {
      id: 'task-3',
      title: 'Implement password reset',
      description: 'Add forgot password and reset password functionality',
      type: 'STORY' as any,
      priority: 'MEDIUM' as any,
      taskNumber: 3,
      key: 'PROJ-3',
      projectId,
      sprintId: 'sprint-1',
      reporterId: 'user-2',
      reporter: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-1',
      status: mockStatuses[0],
      assigneeId: 'user-1',
      assignee: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      storyPoints: 3,
      originalEstimate: 180,
      remainingEstimate: 180,
      labels: [
        { id: 'label-1', name: 'Authentication', color: '#3b82f6', projectId },
        { id: 'label-2', name: 'Backend', color: '#10b981', projectId }
      ],
      createdAt: '2024-01-16T09:00:00Z',
      updatedAt: '2024-01-16T09:00:00Z'
    },
    {
      id: 'task-4',
      title: 'Add email verification',
      description: 'Implement email verification for new user accounts',
      type: 'STORY' as any,
      priority: 'LOW' as any,
      taskNumber: 4,
      key: 'PROJ-4',
      projectId,
      sprintId: 'sprint-1',
      reporterId: 'user-3',
      reporter: {
        id: 'user-3',
        firstName: 'Alice',
        lastName: 'Johnson',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-3',
      status: mockStatuses[2],
      assigneeId: 'user-2',
      assignee: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: '/api/placeholder/40/40'
      },
      storyPoints: 2,
      originalEstimate: 120,
      remainingEstimate: 60,
      labels: [
        { id: 'label-1', name: 'Authentication', color: '#3b82f6', projectId },
        { id: 'label-2', name: 'Backend', color: '#10b981', projectId }
      ],
      createdAt: '2024-01-17T11:00:00Z',
      updatedAt: '2024-01-21T15:30:00Z'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSprints(mockSprints);
        setStatuses(mockStatuses);
        
        // Set current sprint
        const sprint = sprintId 
          ? mockSprints.find(s => s.id === sprintId)
          : mockSprints.find(s => s.status === 'ACTIVE');
        
        if (sprint) {
          setCurrentSprint(sprint);
          // Filter tasks for current sprint
          const sprintTasks = mockSprintTasks.filter(task => task.sprintId === sprint.id);
          setTasks(sprintTasks);
        }
      } catch (error) {
        console.error('Error loading sprint data:', error);
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

  const getFilteredTasks = (statusId: string) => {
    return tasks.filter(task => task.statusId === statusId);
  };

  const handleTaskMove = async (taskId: string, newStatusId: string) => {
    try {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                statusId: newStatusId, 
                status: statuses.find(s => s.id === newStatusId) || task.status,
                completedAt: statuses.find(s => s.id === newStatusId)?.category === 'DONE' ? (currentDate?.toISOString() || new Date().toISOString()) : undefined
              }
            : task
        )
      );
      
      console.log('Moving task', taskId, 'to status', newStatusId);
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (statusId: string) => {
    if (draggedTask && draggedTask.statusId !== statusId) {
      handleTaskMove(draggedTask.id, statusId);
    }
  };

  const handleSprintChange = (sprint: Sprint) => {
    setCurrentSprint(sprint);
    // Filter tasks for selected sprint
    const sprintTasks = mockSprintTasks.filter(task => task.sprintId === sprint.id);
    setTasks(sprintTasks);
  };

  const handleStartSprint = () => {
    if (currentSprint) {
      const updatedSprint = {
        ...currentSprint,
        status: 'ACTIVE' as any,
        startDate: (currentDate || new Date()).toISOString().split('T')[0]
      };
      setCurrentSprint(updatedSprint);
      console.log('Starting sprint:', updatedSprint);
    }
  };

  const handleCompleteSprint = () => {
    if (currentSprint) {
      const updatedSprint = {
        ...currentSprint,
        status: 'COMPLETED' as any,
        endDate: (currentDate || new Date()).toISOString().split('T')[0]
      };
      setCurrentSprint(updatedSprint);
      console.log('Completing sprint:', updatedSprint);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <SprintSelector
            currentSprint={currentSprint}
            sprints={sprints}
            onSprintChange={handleSprintChange}
          />
        </div>
        <div className="flex space-x-3">
          {currentSprint?.status === 'PLANNED' && (
            <Button onClick={handleStartSprint}>
              Start Sprint
            </Button>
          )}
          {currentSprint?.status === 'ACTIVE' && (
            <Button onClick={handleCompleteSprint} variant="secondary">
              Complete Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Sprint Progress */}
      {currentSprint && (
        <SprintProgress
          selectedSprint={currentSprint.id}
        />
      )}

      {/* Sprint Board */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {statuses.map(status => (
          <TaskColumn
            key={status.id}
            status={status}
            tasks={getFilteredTasks(status.id)}
            allTasks={tasks}
            onTaskMove={handleTaskMove}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            draggedTask={draggedTask}
          />
        ))}
      </div>

      {/* Sprint Info */}
      {currentSprint && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sprint Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sprint Goal
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentSprint.goal}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(currentSprint.startDate)} - {formatDate(currentSprint.endDate)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}