'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, TaskType, TaskFilter } from '@/types/tasks';
import TaskColumn from './TaskColumn';
import TaskCreateModal from './TaskCreateModal';
import TaskFilterPanel from './TaskFilterPanel';
import { Button } from '@/components/ui';

interface TaskBoardProps {
  projectId: string;
  sprintId?: string;
}

export default function TaskBoard({ projectId, sprintId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskFilter>({});
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Mock data - in real app, this would come from API
  const mockStatuses: TaskStatus[] = [
    {
      id: 'status-1',
      name: 'To Do',
      description: 'Tasks that need to be started',
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
      name: 'Review',
      description: 'Tasks awaiting review',
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

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Implement user authentication',
      description: 'Add login and registration functionality',
      type: TaskType.STORY,
      priority: TaskPriority.HIGH,
      taskNumber: 1,
      key: 'PROJ-1',
      projectId,
      reporterId: 'user-1',
      reporter: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-1',
      status: mockStatuses[0],
      assigneeId: 'user-2',
      assignee: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: '/api/placeholder/40/40'
      },
      dueDate: '2024-12-31',
      storyPoints: 8,
      originalEstimate: 480,
      remainingEstimate: 480,
      labels: [
        { id: 'label-1', name: 'Frontend', color: '#3b82f6', projectId }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'task-2',
      title: 'Fix login redirect bug',
      description: 'Users are not redirected after successful login',
      type: TaskType.BUG,
      priority: TaskPriority.HIGHEST,
      taskNumber: 2,
      key: 'PROJ-2',
      projectId,
      reporterId: 'user-3',
      reporter: {
        id: 'user-3',
        firstName: 'Bob',
        lastName: 'Johnson',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-2',
      status: mockStatuses[1],
      assigneeId: 'user-1',
      assignee: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      dueDate: '2024-12-25',
      storyPoints: 3,
      originalEstimate: 120,
      remainingEstimate: 60,
      labels: [
        { id: 'label-2', name: 'Bug', color: '#ef4444', projectId },
        { id: 'label-1', name: 'Frontend', color: '#3b82f6', projectId }
      ],
      timeEntries: [
        {
          id: 'time-1',
          taskId: 'task-2',
          userId: 'user-1',
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            avatar: '/api/placeholder/32/32'
          },
          timeSpent: 30,
          description: 'Initial investigation of the redirect issue',
          date: '2024-01-16',
          createdAt: '2024-01-16T15:00:00Z',
          updatedAt: '2024-01-16T15:00:00Z'
        },
        {
          id: 'time-2',
          taskId: 'task-2',
          userId: 'user-1',
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            avatar: '/api/placeholder/32/32'
          },
          timeSpent: 45,
          description: 'Fixed the redirect logic and tested',
          date: '2024-01-17',
          createdAt: '2024-01-17T10:00:00Z',
          updatedAt: '2024-01-17T10:00:00Z'
        }
      ],
      createdAt: '2024-01-16T14:30:00Z',
      updatedAt: '2024-01-16T14:30:00Z'
    },
    {
      id: 'task-3',
      title: 'Add dark mode support',
      description: 'Implement dark mode toggle and theme switching',
      type: TaskType.TASK,
      priority: TaskPriority.MEDIUM,
      taskNumber: 3,
      key: 'PROJ-3',
      projectId,
      reporterId: 'user-2',
      reporter: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-3',
      status: mockStatuses[2],
      assigneeId: 'user-3',
      assignee: {
        id: 'user-3',
        firstName: 'Bob',
        lastName: 'Johnson',
        avatar: '/api/placeholder/40/40'
      },
      dueDate: '2024-12-30',
      storyPoints: 5,
      originalEstimate: 240,
      remainingEstimate: 0,
      labels: [
        { id: 'label-3', name: 'Enhancement', color: '#8b5cf6', projectId },
        { id: 'label-1', name: 'Frontend', color: '#3b82f6', projectId }
      ],
      createdAt: '2024-01-17T09:15:00Z',
      updatedAt: '2024-01-17T09:15:00Z'
    },
    {
      id: 'task-4',
      title: 'Setup CI/CD pipeline',
      description: 'Configure automated testing and deployment',
      type: TaskType.TASK,
      priority: TaskPriority.LOW,
      taskNumber: 4,
      key: 'PROJ-4',
      projectId,
      reporterId: 'user-1',
      reporter: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      statusId: 'status-4',
      status: mockStatuses[3],
      assigneeId: 'user-2',
      assignee: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: '/api/placeholder/40/40'
      },
      completedAt: '2024-01-18T16:45:00Z',
      storyPoints: 13,
      originalEstimate: 720,
      remainingEstimate: 0,
      labels: [
        { id: 'label-4', name: 'DevOps', color: '#f59e0b', projectId }
      ],
      createdAt: '2024-01-12T11:20:00Z',
      updatedAt: '2024-01-18T16:45:00Z'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setStatuses(mockStatuses);
        setTasks(mockTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId, sprintId]);

  const getFilteredTasks = (statusId: string) => {
    return tasks.filter(task => {
      if (task.statusId !== statusId) return false;
      
      // Apply filters
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      if (filters.assigneeIds?.length && (!task.assigneeId || !filters.assigneeIds.includes(task.assigneeId))) {
        return false;
      }
      
      if (filters.priorities?.length && !filters.priorities.includes(task.priority)) {
        return false;
      }
      
      if (filters.types?.length && !filters.types.includes(task.type)) {
        return false;
      }
      
      return true;
    });
  };

  const handleTaskMove = async (taskId: string, newStatusId: string) => {
    try {
      // Update task status locally
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                statusId: newStatusId, 
                status: statuses.find(s => s.id === newStatusId) || task.status,
                completedAt: statuses.find(s => s.id === newStatusId)?.category === 'DONE' ? new Date().toISOString() : undefined
              }
            : task
        )
      );

      // In real app, make API call to update task status

    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const handleTaskCreate = async (taskData: any) => {
    try {
      // Create new task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        taskNumber: tasks.length + 1,
        key: `PROJ-${tasks.length + 1}`,
        projectId,
        reporterId: 'user-1', // Current user
        reporter: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          avatar: '/api/placeholder/40/40'
        },
        status: statuses.find(s => s.id === taskData.statusId) || statuses[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTasks(prev => [...prev, newTask]);
      setShowCreateModal(false);
      
      // In real app, make API call to create task

    } catch (error) {
      console.error('Error creating task:', error);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Task Board
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {sprintId ? 'Sprint Tasks' : 'All Tasks'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <TaskFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          projectId={projectId}
        />
      )}

      {/* Task Board */}
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

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskCreateModal
          projectId={projectId}
          statuses={statuses}
          sprintId={sprintId}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleTaskCreate}
        />
      )}
    </div>
  );
}