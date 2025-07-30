'use client';
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { HiCalendar, HiUser, HiFlag } from 'react-icons/hi';
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
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'HIGHEST':
        return 'destructive';
      case 'HIGH':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'outline';
      default:
        return 'secondary';
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
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-lg mb-2">No tasks found</div>
        <div className="text-sm">Create your first task to get started</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {onTaskSelect && (
            <TableHead className="w-12">
              <Checkbox
                onCheckedChange={(checked) => {
                  // Handle select all logic here
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
          <TableHead>Task</TableHead>
          {showProject && <TableHead>Project</TableHead>}
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id} className="hover:bg-muted/50">
            {onTaskSelect && (
              <TableCell>
                <Checkbox
                  checked={selectedTasks.includes(task.id)}
                  onCheckedChange={() => onTaskSelect(task.id)}
                />
              </TableCell>
            )}
            <TableCell>
              {workspaceSlug && projectSlug ? (
                <Link
                  href={`/${workspaceSlug}/${projectSlug}/tasks/${task.id}`}
                  className="block hover:text-primary transition-colors"
                >
                  <div className="font-medium text-foreground">
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground truncate max-w-md">
                      {task.description}
                    </div>
                  )}
                </Link>
              ) : (
                <div>
                  <div className="font-medium text-foreground">
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground truncate max-w-md">
                      {task.description}
                    </div>
                  )}
                </div>
              )}
            </TableCell>
            {showProject && (
              <TableCell>
                <span className="text-foreground">
                  {projects?.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                </span>
              </TableCell>
            )}
            <TableCell>
              <Badge variant={getPriorityVariant(task.priority) as any} className="flex items-center gap-1 w-fit">
                <HiFlag size={12} />
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {task.status?.name || 'No Status'}
              </Badge>
            </TableCell>
            <TableCell>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {getInitials(task.assignee.firstName, task.assignee.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground text-sm">
                    {task.assignee.firstName} {task.assignee.lastName}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Unassigned</span>
              )}
            </TableCell>
            <TableCell>
              {task.dueDate ? (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <HiCalendar size={16} className="text-muted-foreground" />
                  {formatDate(task.dueDate)}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No due date</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TaskTable;