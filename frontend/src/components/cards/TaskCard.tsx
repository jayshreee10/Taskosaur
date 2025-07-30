'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { IconButton } from '@/components/ui/IconButton';
import { PriorityBadge } from '@/components/badges/PriorityBadge';
import { HiClock, HiDotsVertical } from 'react-icons/hi';

interface Task {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
  statusId: string;
  dueDate: string;
  projectId: string;
}

interface TaskCardProps {
  task: Task;
  workspaceSlug: string;
  projectSlug: string;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  workspaceSlug,
  projectSlug,
  className,
}) => {
  return (
    <Link href={`/${workspaceSlug}/${projectSlug}/tasks/${task.id}`}>
      <Card className={`group ${className}`}>
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>
                <span className="text-xs font-medium text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors mb-2 line-clamp-2">
                  {task.title}
                </span>
              </CardTitle>
              <PriorityBadge priority={task.priority} />
            </div>
            <IconButton icon={<HiDotsVertical size={12} />} size="xs" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-2 flex items-center text-xs text-stone-600 dark:text-stone-400">
            <HiClock size={12} className="mr-1" />
            Due {new Date(task.dueDate).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
