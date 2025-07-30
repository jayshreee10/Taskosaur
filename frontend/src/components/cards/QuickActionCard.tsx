'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  className?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  href,
  className,
}) => {
  return (
    <Link href={href}>
      <Card className={`group hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-[var(--border)] bg-[var(--card)] ${className}`}>
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center mx-auto mb-3 shadow-md shadow-[var(--primary)]/20 group-hover:shadow-[var(--primary)]/30 transition-shadow duration-200">
            <div className="text-white">
              {icon}
            </div>
          </div>
          <h3 className="text-xs font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-200 leading-tight">
            {title}
          </h3>
        </CardContent>
      </Card>
    </Link>
  );
};
