'use client';

import React from 'react';
import { Sprint } from '@/types/tasks';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  
} from '@/components/ui/dropdown-menu';
import {
  HiPlay,
  HiClock,
  HiCheck,
  HiChevronDown,
  HiCalendar,
} from 'react-icons/hi2';
import { HiLightningBolt } from "react-icons/hi";
import { Button } from '@/components/ui/button';
interface SprintSelectorProps {
  currentSprint: Sprint | null;
  sprints: Sprint[];
  onSprintChange: (sprint: Sprint) => void;
}

const getSprintStatusConfig = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-none',
        icon: HiPlay,
        color: 'text-green-600 dark:text-green-400'
      };
    case 'PLANNED':
      return { 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-none',
        icon: HiClock,
        color: 'text-blue-600 dark:text-blue-400'
      };
    case 'COMPLETED':
      return { 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-none',
        icon: HiCheck,
        color: 'text-gray-600 dark:text-gray-400'
      };
    default:
      return { 
        className: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-none',
        icon: HiClock,
        color: 'text-[var(--muted-foreground)]'
      };
  }
};

export default function SprintSelector({ currentSprint, sprints, onSprintChange }: SprintSelectorProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const currentSprintConfig = currentSprint ? getSprintStatusConfig(currentSprint.status) : null;
  const CurrentIcon = currentSprintConfig?.icon || HiClock;

  return (
    <div className="w-full max-w-xs">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            
            className="w-full h-9 flex items-center gap-3 px-4 py-2 rounded-lg  bg-[var(--gray-100)] hover:bg-[var(--accent)] text-left min-w-[220px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
            aria-haspopup="true"
          >
            <div className={`size-6 rounded-lg flex items-center justify-center ${currentSprint ? 'bg-[var(--primary)]/10' : 'bg-[var(--muted)]'}`}>
              <CurrentIcon className={`size-3 ${currentSprintConfig?.color || 'text-[var(--muted-foreground)]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[var(--foreground)] truncate">
                {currentSprint?.name || 'No Active Sprint'}
              </div>
              
            </div>
            <HiChevronDown className="w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 flex-shrink-0 group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[220px] max-h-64 overflow-y-auto bg-[var(--card)] border-none rounded-lg shadow-xl p-0"
          align="start"
          sideOffset={8}
        >
          {sprints.length === 0 ? (
            <div className="text-center py-6 px-3">
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                <HiLightningBolt className="w-4 h-4 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-xs font-medium text-[var(--foreground)] mb-1">
                No sprints available
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Create your first sprint
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sprints.map((sprint) => {
                const sprintConfig = getSprintStatusConfig(sprint.status);
                const SprintIcon = sprintConfig.icon;
                const isSelected = currentSprint?.id === sprint.id;
                
                return (
                  <DropdownMenuItem
                    key={sprint.id}
                    className={`p-0 cursor-pointer focus:bg-transparent ${
                      isSelected ? '' : ''
                    }`}
                    onClick={() => onSprintChange(sprint)}
                  >
                    <div className={`w-full p-3 rounded-lg  transition-all duration-200 ${
                      isSelected
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20 shadow-sm'
                        : 'bg-[var(--card)]  hover:bg-[var(--accent)] hover:border-[var(--primary)]/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[var(--primary)]/20' : 'bg-[var(--muted)]'
                        }`}>
                          <SprintIcon className={`w-3 h-3 ${sprintConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--foreground)] truncate">
                              {sprint.name}
                            </span>
                            {isSelected && (
                              <div className="w-3 h-3 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                                <HiCheck className="w-2 h-2 text-[var(--primary-foreground)]" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[10px] px-1.5 py-0.5 ${sprintConfig.className}`}>
                              {sprint.status}
                            </Badge>
                            <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                              <HiCalendar className="w-2.5 h-2.5" />
                              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {sprint.goal && (
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-2 line-clamp-1">
                          {sprint.goal}
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}