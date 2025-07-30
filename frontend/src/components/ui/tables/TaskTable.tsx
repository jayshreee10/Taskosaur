'use client';
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { HiCalendar, HiUser, HiFlag, HiClipboardDocumentList } from 'react-icons/hi2';
import { Task } from '@/types/tasks';

interface TaskTableProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  onTaskSelect?: (taskId: string) => void;
  selectedTasks?: string[];
  projects?: any[];
  showProject?: boolean;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  workspaceSlug,
  projectSlug,
  onTaskSelect,
  selectedTasks = [],
  projects,
  showProject = false
}) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGHEST':
        return { variant: 'destructive', color: 'bg-red-500/10 text-red-700 border-red-500/20' };
      case 'HIGH':
        return { variant: 'default', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' };
      case 'MEDIUM':
        return { variant: 'secondary', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' };
      case 'LOW':
        return { variant: 'outline', color: 'bg-green-500/10 text-green-700 border-green-500/20' };
      default:
        return { variant: 'secondary', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
    }
  };
  
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'completed':
        return { color: 'bg-green-500/10 text-green-700 border-green-500/20' };
      case 'in progress':
      case 'in_progress':
        return { color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' };
      case 'blocked':
        return { color: 'bg-red-500/10 text-red-700 border-red-500/20' };
      case 'review':
        return { color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' };
      default:
        return { color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
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
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[var(--border)] hover:bg-[var(--accent)] bg-[var(--muted)]/30">
            {onTaskSelect && (
              <TableHead className="w-12">
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
            <TableHead className="text-[var(--muted-foreground)] font-medium">Task</TableHead>
            {showProject && <TableHead className="text-[var(--muted-foreground)] font-medium">Project</TableHead>}
            <TableHead className="text-[var(--muted-foreground)] font-medium">Priority</TableHead>
            <TableHead className="text-[var(--muted-foreground)] font-medium">Status</TableHead>
            <TableHead className="text-[var(--muted-foreground)] font-medium">Assignee</TableHead>
            <TableHead className="text-[var(--muted-foreground)] font-medium">Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-[var(--card)]">
          {tasks.map((task) => (
            <TableRow key={task.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)] transition-colors bg-[var(--card)]">
              {onTaskSelect && (
                <TableCell className="bg-transparent">
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => onTaskSelect(task.id)}
                  />
                </TableCell>
              )}
              <TableCell className="bg-transparent">
                {workspaceSlug && projectSlug ? (
                  <Link
                    href={`/${workspaceSlug}/${projectSlug}/tasks/${task.id}`}
                    className="block hover:text-[var(--primary)] transition-colors"
                  >
                    <div className="font-medium text-[var(--foreground)]">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-[var(--muted-foreground)] truncate max-w-md">
                        {task.description}
                      </div>
                    )}
                  </Link>
                ) : (
                  <div>
                    <div className="font-medium text-[var(--foreground)]">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-[var(--muted-foreground)] truncate max-w-md">
                        {task.description}
                      </div>
                    )}
                  </div>
                )}
              </TableCell>
              {showProject && (
                <TableCell className="bg-transparent">
                  <span className="text-[var(--foreground)]">
                    {projects?.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                  </span>
                </TableCell>
              )}
              <TableCell className="bg-transparent">
                <Badge  
                // variant={getPriorityVariant(task.priority) as any}
                className="flex items-center gap-1 w-fit">
                  <HiFlag size={12} />
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell className="bg-transparent">
                <Badge variant="secondary" className="bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                  {task.status?.name || 'No Status'}
                </Badge>
              </TableCell>
              <TableCell className="bg-transparent">
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs">
                        {getInitials(task.assignee.firstName, task.assignee.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[var(--foreground)] text-sm">
                      {task.assignee.firstName} {task.assignee.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-[var(--muted-foreground)] text-sm">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="bg-transparent">
                {task.dueDate ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                    <HiCalendar size={16} className="text-[var(--muted-foreground)]" />
                    {formatDate(task.dueDate)}
                  </div>
                ) : (
                  <span className="text-sm text-[var(--muted-foreground)]">No due date</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskTable;