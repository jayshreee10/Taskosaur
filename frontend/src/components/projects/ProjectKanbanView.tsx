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
      <Card className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-4 hover:shadow-md hover:border-[var(--primary)] dark:hover:border-[var(--primary)]/80 transition-all cursor-pointer">
        <CardHeader className="pb-0">
          <CardTitle>
            <span className="text-xs font-medium text-[var(--foreground)] dark:text-[var(--foreground)] mb-2 line-clamp-2">
              {task.title}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-between items-center mb-2">
            <PriorityBadge priority={task.priority} />
          </div>
          {task.dueDate && (
            <div className="text-xs text-[var(--gray-500)] dark:text-[var(--gray-400)] flex items-center gap-1">
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
    <Card className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-4 flex flex-col justify-between">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center mb-4">
          <CardTitle>
            <span className="text-sm font-semibold text-[var(--foreground)] dark:text-[var(--foreground)]">
              {statusName}
            </span>
          </CardTitle>
          <span className="text-xs text-[var(--gray-500)] dark:text-[var(--gray-400)] bg-[var(--gray-100)] dark:bg-[var(--gray-800)] px-2 py-1 rounded-full">
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
            <div className="py-8 text-center text-[var(--gray-400)] dark:text-[var(--gray-500)] text-xs">
              No tasks
            </div>
          )}
          <Link 
            href={`/${workspaceSlug}/${projectSlug}/tasks/new?status=${statusName}`}
            className="block w-full text-center text-xs font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors py-3 border-2 border-dashed border-[var(--border)] rounded-[var(--card-radius)] hover:border-[var(--primary)] dark:hover:border-[var(--primary)]/80"
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
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-4 ${className || ''}`}>
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
