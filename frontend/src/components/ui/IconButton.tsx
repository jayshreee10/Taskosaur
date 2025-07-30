'use client';

import React from 'react';
import { cn } from '@/utils/classNames';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  title?: string;
}

const iconButtonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
  secondary: 'bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-700 dark:hover:bg-secondary-600 text-white focus:ring-secondary-500',
  outline: 'border border-border dark:border-border-dark bg-card dark:bg-card-dark hover:bg-secondary-50 dark:hover:bg-secondary-800 text-foreground dark:text-foreground-dark focus:ring-primary-500',
  ghost: 'bg-transparent hover:bg-secondary-100 dark:hover:bg-secondary-800 text-foreground dark:text-foreground-dark focus:ring-primary-500',
};

const iconButtonSizes = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

export function IconButton({
  icon,
  onClick,
  variant = 'ghost',
  size = 'sm',
  disabled = false,
  className,
  title,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        iconButtonVariants[variant],
        iconButtonSizes[size],
        className
      )}
    >
      {icon}
    </button>
  );
}
