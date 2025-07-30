import { ReactNode } from 'react';
import { cn } from '@/utils/classNames';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="w-16 h-16 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-6 text-[var(--muted-foreground)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}
