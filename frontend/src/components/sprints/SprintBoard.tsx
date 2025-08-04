'use client';

import React, { useState, useEffect } from 'react';
import { Task, Sprint, TaskStatus } from '@/types/tasks';
import TaskColumn from '@/components/tasks/TaskColumn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SprintSelector from './SprintSelector';
import SprintProgress from './SprintProgress';
import {
  HiPlay,
  HiCheck,
  HiClock,
  HiCalendar,
  HiFlag,
  HiChartBar,
  HiUsers,
  HiClipboardDocumentList
} from 'react-icons/hi2';
import { HiLightningBolt } from "react-icons/hi";
interface SprintBoardProps {
  projectId: string;
  sprintId?: string;
}

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-[var(--muted)] rounded w-1/3 mb-4"></div>
      <div className="h-6 bg-[var(--muted)] rounded w-1/2 mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--card)] rounded-[var(--card-radius)] border-none p-4">
            <div className="h-6 bg-[var(--muted)] rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-20 bg-[var(--muted)] rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const getSprintStatusConfig = (status: string) => {
  switch (status) {
    case 'PLANNED':
      return { 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-none',
        icon: HiClock 
      };
    case 'ACTIVE':
      return { 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-none',
        icon: HiPlay 
      };
    case 'COMPLETED':
      return { 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-none',
        icon: HiCheck 
      };
    default:
      return { 
        className: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-none',
        icon: HiClock 
      };
  }
};

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
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
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
    return <LoadingSkeleton />;
  }

  if (!currentSprint) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-4">
          <HiLightningBolt className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          No Sprint Selected
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Please select a sprint to view the board
        </p>
      </div>
    );
  }

  const sprintStatusConfig = getSprintStatusConfig(currentSprint.status);
  const StatusIcon = sprintStatusConfig.icon;

  // Calculate sprint statistics
  const completedTasks = tasks.filter(task => task.status?.category === 'DONE').length;
  const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
  const completedStoryPoints = tasks
    .filter(task => task.status?.category === 'DONE')
    .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

  return (
    <div className="space-y-6">
      {/* Sprint Header Card */}
      <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Sprint Info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-semibold flex-shrink-0">
                <HiLightningBolt className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    {currentSprint.name}
                  </h2>
                  <Badge className={sprintStatusConfig.className}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {currentSprint.status}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  {currentSprint.goal}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-1">
                    <HiCalendar className="w-4 h-4" />
                    {formatDate(currentSprint.startDate)} - {formatDate(currentSprint.endDate)}
                  </div>
                  <div className="flex items-center gap-1">
                    <HiClipboardDocumentList className="w-4 h-4" />
                    {completedTasks}/{tasks.length} tasks
                  </div>
                  <div className="flex items-center gap-1">
                    <HiFlag className="w-4 h-4" />
                    {completedStoryPoints}/{totalStoryPoints} points
                  </div>
                </div>
              </div>
            </div>

            {/* Sprint Actions */}
            <div className="flex items-center gap-3">
              <SprintSelector
                currentSprint={currentSprint}
                sprints={sprints}
                onSprintChange={handleSprintChange}
              />
              
              {currentSprint.status === 'PLANNED' && (
                <Button 
                  onClick={handleStartSprint}
                  className="h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
                >
                  <HiPlay className="w-4 h-4" />
                  Start Sprint
                </Button>
              )}
              
              {currentSprint.status === 'ACTIVE' && (
                <Button 
                  onClick={handleCompleteSprint} 
                  variant="outline"
                  className="h-9 px-4 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center gap-2"
                >
                  <HiCheck className="w-4 h-4" />
                  Complete Sprint
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint Progress */}
      <SprintProgress selectedSprint={currentSprint.id} />

      {/* Sprint Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
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

      {/* Sprint Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <HiClipboardDocumentList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {completedTasks}/{tasks.length}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Tasks Completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <HiFlag className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {completedStoryPoints}/{totalStoryPoints}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Story Points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <HiChartBar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Completion Rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}