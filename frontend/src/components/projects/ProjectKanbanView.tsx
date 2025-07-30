'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PriorityBadge } from '@/components/badges/PriorityBadge';
import { HiPlus, HiCalendar } from 'react-icons/hi';

interface SimpleTask {
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
}

interface TaskStatus {
  id: string;
  name: string;
  color?: string;
  order?: number;
}

interface ProjectKanbanViewProps {
  tasks: SimpleTask[];
  taskStatuses: TaskStatus[];
  workspaceSlug: string;
  projectSlug: string;
  className?: string;
}

interface SimpleTaskCardProps {
  task: SimpleTask;
  workspaceSlug: string;
  projectSlug: string;
}

const SimpleTaskCard: React.FC<SimpleTaskCardProps> = ({ 
  task, 
  workspaceSlug, 
  projectSlug 
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Link 
      href={`/${workspaceSlug}/${projectSlug}/tasks/${task.id}`}
      className="block"
    >
      <Card className="hover:border-primary-300 dark:hover:border-primary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all cursor-pointer">
        <CardHeader className="pb-0">
          <CardTitle>
            <span className="text-xs font-medium text-secondary-900 dark:text-secondary-100 mb-2 line-clamp-2">
              {task.title}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-between items-center mb-2">
            <PriorityBadge priority={task.priority} />
          </div>
          {task.dueDate && (
            <div className="text-xs text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
              <HiCalendar size={10} />
              Due: {formatDate(task.dueDate)}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

interface KanbanColumnProps {
  statusName: string;
  tasks: SimpleTask[];
  workspaceSlug: string;
  projectSlug: string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  statusName,
  tasks,
  workspaceSlug,
  projectSlug,
}) => {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center mb-4">
          <CardTitle>
            <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {statusName}
            </span>
          </CardTitle>
          <span className="text-xs text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <SimpleTaskCard 
              key={task.id} 
              task={task}
              workspaceSlug={workspaceSlug}
              projectSlug={projectSlug}
            />
          ))}
          {tasks.length === 0 && (
            <div className="py-8 text-center text-secondary-400 dark:text-secondary-500 text-xs">
              No tasks
            </div>
          )}
          <Link 
            href={`/${workspaceSlug}/${projectSlug}/tasks/new?status=${statusName}`}
            className="block w-full text-center text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 py-3 border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
          >
            <HiPlus size={12} className="inline mr-1" />
            Add task
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProjectKanbanView: React.FC<ProjectKanbanViewProps> = ({
  tasks,
  taskStatuses,
  workspaceSlug,
  projectSlug,
  className,
}) => {
  // Group tasks by status
  const tasksByStatus: Record<string, SimpleTask[]> = {};
  
  taskStatuses.forEach(status => {
    tasksByStatus[status.name] = [];
  });
  
  // Fallback statuses if none are provided
  if (taskStatuses.length === 0) {
    tasksByStatus['To Do'] = [];
    tasksByStatus['In Progress'] = [];
    tasksByStatus['Review'] = [];
    tasksByStatus['Done'] = [];
  }
  
  tasks.forEach(task => {
    const status = taskStatuses.find(s => s.id === task.statusId);
    const statusName = status?.name || 'To Do';
    if (tasksByStatus[statusName]) {
      tasksByStatus[statusName].push(task);
    }
  });

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`}>
      {Object.entries(tasksByStatus).map(([statusName, statusTasks]) => (
        <KanbanColumn
          key={statusName}
          statusName={statusName}
          tasks={statusTasks}
          workspaceSlug={workspaceSlug}
          projectSlug={projectSlug}
        />
      ))}
    </div>
  );
};
