'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  HiFolder, 
  HiDotsVertical,
  HiPencil,
  HiTrash,
  HiUsers,
  HiCog,
  HiClock,
} from 'react-icons/hi';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
  memberCount?: number;
  projectCount?: number;
  color?: string;
  lastActivity?: string;
}

interface WorkspaceCardProps {
  workspace: Workspace;
  className?: string;
  variant?: 'simple' | 'detailed'; // New prop to control complexity
  onEdit?: (workspace: Workspace) => void;
  onDelete?: (id: string) => void;
  onShowMembers?: (workspace: Workspace) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ 
  workspace, 
  className,
  variant = 'simple',
  onEdit,
  onDelete,
  onShowMembers,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const cardColors = [
    "bg-amber-50 dark:bg-amber-950/20",
    "bg-orange-50 dark:bg-orange-950/20", 
    "bg-yellow-50 dark:bg-yellow-950/20",
    "bg-stone-50 dark:bg-stone-950/20",
    "bg-neutral-50 dark:bg-neutral-950/20",
  ];

  const colorIndex = workspace.id.length % cardColors.length;
  const cardColor = workspace.color || cardColors[colorIndex];

  // Simple variant (original design for dashboard/sidebar)
  if (variant === 'simple') {
    return (
      <Link href={`/${workspace.slug}`}>
        <Card className={`group hover:shadow-md transition-all duration-200 border-[var(--border)] bg-[var(--card)] ${className}`}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center text-white">
                <HiFolder size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                  {workspace.name}
                </h3>
                {workspace.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-1">
                    {workspace.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Detailed variant using shadcn components
  return (
    <Card className={`relative group border-[var(--border)] bg-[var(--card)] hover:shadow-lg transition-all duration-200 hover:scale-105 ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Link href={`/${workspace.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25 flex-shrink-0">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                {workspace.name}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] truncate">
                /{workspace.slug}
              </p>
            </div>
          </Link>
          
          {/* Actions Menu */}
          {(onEdit || onDelete || onShowMembers) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HiDotsVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(workspace);
                    }}
                  >
                    <HiPencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onShowMembers && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowMembers(workspace);
                    }}
                  >
                    <HiUsers className="w-4 h-4 mr-2" />
                    Members
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${workspace.slug}/settings`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HiCog className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(workspace.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <HiTrash className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        {workspace.description && (
          <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
            {workspace.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1">
            <HiUsers className="w-3 h-3" />
            <span className="font-medium">{workspace.memberCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <HiFolder className="w-3 h-3" />
            <span className="font-medium">{workspace.projectCount || 0}</span>  
          </div>
          {workspace.lastActivity && (
            <div className="flex items-center gap-1">
              <HiClock className="w-3 h-3" />
              <span className="font-medium">{workspace.lastActivity}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
