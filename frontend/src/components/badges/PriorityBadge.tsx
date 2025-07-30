'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityVariantMap: Record<Priority, 'default' | 'secondary' | 'destructive'> = {
  LOW: 'default',
  MEDIUM: 'secondary',
  HIGH: 'destructive',
  HIGHEST: 'destructive',
};

const priorityLabels: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  HIGHEST: 'Highest',
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className,
}) => {
  return (
    <Badge 
      variant={priorityVariantMap[priority]} 
      className={className}
    >
      {priorityLabels[priority]}
    </Badge>
  );
};
