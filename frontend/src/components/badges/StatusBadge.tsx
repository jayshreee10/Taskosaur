'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

export type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'completed' | 'done' | 'backlog' | 'cancelled';
export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled' | 'planning';

interface StatusBadgeProps {
  status: TaskStatus | ProjectStatus | string;
  type?: 'task' | 'project';
  className?: string;
}

const taskStatusVariantMap: Record<TaskStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'todo': 'default',
  'backlog': 'default',
  'in-progress': 'secondary',
  'in-review': 'outline',
  'completed': 'secondary',
  'done': 'secondary',
  'cancelled': 'destructive',
};

const projectStatusVariantMap: Record<ProjectStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'active': 'secondary',
  'completed': 'outline',
  'on-hold': 'default',
  'cancelled': 'destructive',
  'planning': 'default',
};

const taskStatusLabels: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'backlog': 'Backlog',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  'completed': 'Completed',
  'done': 'Done',
  'cancelled': 'Cancelled',
};

const projectStatusLabels: Record<ProjectStatus, string> = {
  'active': 'Active',
  'completed': 'Completed',
  'on-hold': 'On Hold',
  'cancelled': 'Cancelled',
  'planning': 'Planning',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'task',
  className,
}) => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let label = status;
  
  if (type === 'task') {
    const taskStatus = normalizedStatus as TaskStatus;
    variant = taskStatusVariantMap[taskStatus] || 'default';
    label = taskStatusLabels[taskStatus] || status;
  } else if (type === 'project') {
    const projectStatus = normalizedStatus as ProjectStatus;
    variant = projectStatusVariantMap[projectStatus] || 'default';
    label = projectStatusLabels[projectStatus] || status;
  }

  return (
    <Badge 
      variant={variant} 
      className={className}
    >
      {label}
    </Badge>
  );
};
