'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, IconButton } from '@/components/ui';
import { 
  HiFolder, 
  HiDotsVertical,
  HiPencil,
  HiTrash,
  HiUsers,
  HiCog,
  HiExternalLink,
} from 'react-icons/hi';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
  memberCount?: number;
  projectCount?: number;
  isStarred?: boolean;
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

  // Detailed variant (for workspaces list page)
  return (
    <Card className={`relative p-4 group ${className}`}>
      {/* Menu */}
      {(onEdit || onDelete || onShowMembers) && (
        <div className="absolute top-3 right-3 z-20">
          <div className="relative">
            <IconButton
              icon={<HiDotsVertical size={12} />}
              size="xs"
              onClick={() => setShowMenu(!showMenu)}
            />

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 py-1 z-20 shadow-lg">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(workspace);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <HiPencil size={12} />
                      Edit Workspace
                    </button>
                  )}
                  {onShowMembers && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onShowMembers(workspace);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <HiUsers size={12} />
                      Manage Members
                    </button>
                  )}
                  <Link
                    href={`/${workspace.slug}/settings`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  >
                    <HiCog size={12} />
                    Settings
                  </Link>
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(workspace.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <HiTrash size={12} />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Card Content */}
      <Link href={`/${workspace.slug}`} className="block">
        {/* Workspace Icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
              {workspace.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              /{workspace.slug}
            </p>
          </div>
        </div>

        {/* Description */}
        {workspace.description && (
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 line-clamp-2">
            {workspace.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 mb-3">
          <div className="flex items-center gap-1">
            <HiUsers size={12} />
            <span>{workspace.memberCount || 0} members</span>
          </div>
          <div className="flex items-center gap-1">
            <HiFolder size={12} />
            <span>{workspace.projectCount || 0} projects</span>
          </div>
        </div>

        {/* Last Activity */}
        {workspace.lastActivity && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Last activity: {workspace.lastActivity}
          </p>
        )}

        {/* External Link Icon */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <HiExternalLink size={12} />
        </div>
      </Link>
    </Card>
  );
};
