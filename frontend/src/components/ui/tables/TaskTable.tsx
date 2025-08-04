'use client';
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { HiCalendar, HiUser, HiFlag, HiClipboardDocumentList } from 'react-icons/hi2';
import { Task } from '@/utils/api';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext
} from "@/components/ui/pagination";
import { useRouter } from 'next/navigation';
interface TaskTableProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  onTaskSelect?: (taskId: string) => void;
  selectedTasks?: string[];
  projects?: any[];
  showProject?: boolean;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
  };
  onPageChange?: (page: number) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  workspaceSlug,
  projectSlug,
  onTaskSelect,
  selectedTasks = [],
  projects,
  showProject = false,
  pagination,
  onPageChange
}) => {
  console.log('Rendering TaskTable with tasks:', tasks);
  
  const columnCount = 3 + 
    (onTaskSelect ? 1 : 0) + 
    (showProject ? 1 : 0) + 
    1 + 
    1;  
const router = useRouter();
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGHEST':
        return { variant: 'destructive' as const, className: 'bg-red-100 text-red-800  dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' };
      case 'HIGH':
        return { variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800  dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' };
      case 'MEDIUM':
        return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800  dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' };
      case 'LOW':
        return { variant: 'secondary' as const, className: 'bg-green-100 text-green-800  dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' };
      case 'LOWEST':
        return { variant: 'outline' as const, className: 'bg-gray-50 text-gray-600  dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700' };
      default:
        return { variant: 'secondary' as const, className: 'bg-[var(--muted)] text-[var(--muted-foreground)]' };
    }
  };
  
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'completed':
        return { className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' };
      case 'in progress':
      case 'in_progress':
        return { className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' };
      case 'blocked':
        return { className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' };
      case 'review':
        return { className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' };
      case 'todo':
        return { className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700' };
      default:
        return { className: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)]">
        <div className="text-lg mb-2">No tasks found</div>
        <div className="text-sm">Create your first task to get started</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border-none bg-[var(--card)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto border-none">
        <Table className="border-none w-full">
          <TableHeader className="border-none">
            <TableRow className="border-none  bg-[var(--muted)]/30">
              {onTaskSelect && (
                <TableHead className="w-12 border-none">
                  <Checkbox
                    onCheckedChange={(checked) => {
                      if (checked) {
                        tasks.forEach(task => onTaskSelect(task.id));
                      } else {
                        tasks.forEach(task => {
                          if (selectedTasks.includes(task.id)) {
                            onTaskSelect(task.id);
                          }
                        });
                      }
                    }}
                  />
                </TableHead>
              )}
              <TableHead className="text-[var(--muted-foreground)] font-medium min-w-[200px] border-none pl-6">Task</TableHead>
              {showProject && <TableHead className="text-[var(--muted-foreground)] font-medium min-w-[120px] hidden sm:table-cell border-none">Project</TableHead>}
              <TableHead className="text-[var(--muted-foreground)] font-medium min-w-[80px] border-none">Priority</TableHead>
              <TableHead className="text-[var(--muted-foreground)] font-medium min-w-[80px] border-none">Status</TableHead>
              <TableHead className="text-[var(--muted-foreground)] font-medium min-w-[120px] hidden md:table-cell border-none">Assignee</TableHead>
              <TableHead className="text-[var(--muted-foreground)] font-medium min-w-[100px] hidden lg:table-cell border-none pr-6">Due Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="bg-[var(--card)] border-none">
            {tasks.map((task, idx) => {
              const detailUrl = workspaceSlug && projectSlug
                ? `/${workspaceSlug}/${projectSlug}/tasks/${task.id}`
                : workspaceSlug
                  ? `/${workspaceSlug}/tasks/${task.id}`
                  : `/tasks/${task.id}`;
              return (
                <TableRow
                  key={task.id}
                  className={`border-none transition-colors bg-[var(--card)] hover:bg-[var(--muted)] cursor-pointer ${idx === 0 ? 'first:!pl-6' : ''}`}
                  onClick={() => router.push(detailUrl)}
                >
                  {onTaskSelect && (
                    <TableCell className="bg-transparent border-none pl-6">
                      <Checkbox
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={() => onTaskSelect(task.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  <TableCell className="bg-transparent border-none pl-6">
                    <div className="font-medium text-[var(--foreground)] truncate">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-[var(--muted-foreground)] truncate max-w-[200px] md:max-w-md">
                        {task.description}
                      </div>
                    )}
                  </TableCell>
                  {showProject && (
                    <TableCell className="bg-transparent border-none hidden sm:table-cell">
                      <span className="text-[var(--foreground)] truncate block max-w-[100px]">
                        {task.project?.name || 'Unknown Project'}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="bg-transparent border-none">
                    {(() => {
                      const config = getPriorityConfig(task.priority);
                      return (
                        <Badge variant={config.variant} className={`flex items-center gap-1 w-fit rounded-md border-none ${config.className}`}>
                          <HiFlag size={12} />
                          {task.priority}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="bg-transparent border-none">
                    {(() => {
                      const config = getStatusConfig(task.status?.name || '');
                      return (
                        <Badge variant="secondary" className={`rounded-md ${config.className} border-none`}>
                          {task.status?.name || 'No Status'}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="bg-transparent border-none hidden md:table-cell">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 rounded-full border-none">
                          <AvatarFallback className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs rounded-full">
                            {getInitials(task.assignee.firstName, task.assignee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[var(--foreground)] text-sm truncate max-w-[80px]">
                          {task.assignee.firstName} {task.assignee.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--muted-foreground)] text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="bg-transparent border-none hidden lg:table-cell pr-6">
                    {task.dueDate ? (
                      <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                        <HiCalendar size={16} className="text-[var(--muted-foreground)]" />
                        <span className="whitespace-nowrap">{formatDate(task.dueDate)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">No due date</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          {pagination && pagination.totalPages > 1 && (
            <tfoot className="bg-[var(--muted)] border-none">
              <tr className="border-none">
                <td 
                  colSpan={columnCount} 
                  className="p-0 border-none bg-[var(--muted)] rounded-md shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} tasks
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={e => {
                              e.preventDefault();
                              if (pagination.hasPrevPage && onPageChange) onPageChange(pagination.currentPage - 1);
                            }}
                            aria-disabled={!pagination.hasPrevPage}
                          />
                        </PaginationItem>
                        {Array.from({ length: pagination.totalPages }, (_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={pagination.currentPage === i + 1}
                              onClick={e => {
                                e.preventDefault();
                                if (onPageChange) onPageChange(i + 1);
                              }}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={e => {
                              e.preventDefault();
                              if (pagination.hasNextPage && onPageChange) onPageChange(pagination.currentPage + 1);
                            }}
                            aria-disabled={!pagination.hasNextPage}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  );
};

export default TaskTable;