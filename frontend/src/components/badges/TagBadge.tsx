'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TagBadgeProps {
  tag: string;
  color?: string;
  className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  color,
  className,
}) => {
  if (color) {
    return (
      <span 
        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full text-white ${className}`}
        style={{ backgroundColor: color }}
      >
        {tag}
      </span>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={className}
    >
      {tag}
    </Badge>
  );
};
