'use client';

import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  HiFlag,
  HiUser,
  HiCalendar,
  HiPlus,
  HiClipboardDocumentList,
  HiEllipsisVertical,
  HiChatBubbleLeftRight,
  HiPaperClip,
  HiClock,
} from 'react-icons/hi2';

interface TaskBoardViewProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
  onTaskStatusChange?: (taskId: string, newStatus: string) => void;
  onAddTask?: (status: string) => void;
}

const TaskCard = ({ 
  task, 
  workspaceSlug, 
  projectSlug, 
  projects,
  onStatusChange
}: { 
  task: Task; 
  workspaceSlug?: string; 
  projectSlug?: string; 
  projects?: any[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
}) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGHEST':
        return { color: 'bg-red-500/10 text-red-700 border-red-500/20' };
      case 'HIGH':
        return { color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' };
      case 'MEDIUM':
        return { color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' };
      case 'LOW':
        return { color: 'bg-green-500/10 text-green-700 border-green-500/20' };
      default:
        return { color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
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
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const TaskContent = (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.setData('application/json', JSON.stringify(task));
      }}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header with Priority and Actions */}
        <div className="flex items-start justify-between">
          <Badge 
            variant="secondary" 
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border transition-all duration-200 shadow-sm ${getPriorityConfig(task.priority).color}`}
          >
            <HiFlag className="w-3 h-3" />
            <span className="uppercase tracking-wider">{task.priority}</span>
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 p-0 hover:bg-[var(--accent)]"
          >
            <HiEllipsisVertical className="w-3 h-3" />
          </Button>
        </div>

        {/* Task ID and Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--muted)]/30 px-2 py-0.5 rounded">
              {task.key || `T-${task.id.slice(-4).toUpperCase()}`}
            </span>
          </div>
          <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors duration-200 leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-3 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Project Info (if showing) */}
        {projects && !projectSlug && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--muted)]/20 border border-[var(--border)]/30">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-xs font-bold">
                {(projects?.find(p => p.id === task.projectId)?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-[var(--muted-foreground)] text-xs font-medium">
              {projects?.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
            </span>
          </div>
        )}

        {/* Task Metadata */}
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <HiChatBubbleLeftRight className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <HiPaperClip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}
          {task.timeEntries && task.timeEntries.length > 0 && (
            <div className="flex items-center gap-1">
              <HiClock className="w-3 h-3" />
              <span>{Math.floor((task.timeEntries.reduce((acc, entry) => acc + entry.timeSpent, 0)) / 60)}h</span>
            </div>
          )}
        </div>

        {/* Footer with Assignee and Due Date */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/30">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <>
                <Avatar className="h-6 w-6 ring-2 ring-[var(--background)] shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] text-xs font-bold">
                    {getInitials(task.assignee.firstName, task.assignee.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-[var(--foreground)] font-medium">
                  {task.assignee.firstName} {task.assignee.lastName}
                </span>
              </>
            ) : (
              <>
                <div className="h-6 w-6 rounded-full bg-[var(--muted)]/30 flex items-center justify-center border border-[var(--border)]/30">
                  <HiUser className="w-3 h-3 text-[var(--muted-foreground)]" />
                </div>
                <span className="text-xs text-[var(--muted-foreground)] font-medium">Unassigned</span>
              </>
            )}
          </div>
          
          {task.dueDate && (
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
              new Date(task.dueDate) < new Date() 
                ? 'bg-red-500/10 text-red-700 border border-red-500/20' 
                : 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
            }`}>
              <HiCalendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (workspaceSlug && projectSlug) {
    return (
      <Link href={`/${workspaceSlug}/${projectSlug}/tasks/${task.id}`}>
        {TaskContent}
      </Link>
    );
  }

  return TaskContent;
};

const StatusColumn = ({ 
  title, 
  tasks, 
  statusColor, 
  statusValue,
  workspaceSlug, 
  projectSlug, 
  projects,
  onStatusChange,
  onAddTask
}: {
  title: string;
  tasks: Task[];
  statusColor: string;
  statusValue: string;
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onAddTask?: (status: string) => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('text/plain');
    const taskData = JSON.parse(e.dataTransfer.getData('application/json'));
    
    if (taskData.status?.name?.toLowerCase() !== statusValue.toLowerCase()) {
      onStatusChange?.(taskId, statusValue);
    }
  };

  return (
    <div className="flex-1 min-w-[280px] sm:min-w-[320px] max-w-[380px]">
      <Card 
        className={`h-full border-2 bg-[var(--card)] shadow-lg transition-all duration-300 ${
          isDragOver 
            ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-xl transform scale-[1.02]' 
            : 'border-[var(--border)] hover:shadow-xl'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardHeader className="pb-4 border-b border-[var(--border)]/30">
          <CardTitle className="flex items-center justify-between text-sm font-bold text-[var(--foreground)]">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${statusColor} shadow-sm`} />
              <span className="uppercase tracking-wider text-[var(--foreground)]">{title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[var(--muted)]/40 text-[var(--muted-foreground)] px-2.5 py-1 text-xs font-semibold border border-[var(--border)]/30">
                {tasks.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask?.(statusValue)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[var(--accent)]"
              >
                <HiPlus className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[calc(100vh-320px)] sm:h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
            <div className="p-3 sm:p-4 space-y-3">
              {tasks.length === 0 ? (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  isDragOver 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5' 
                    : 'border-[var(--border)]/30 bg-[var(--muted)]/10'
                }`}>
                  <div className="w-12 h-12 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mx-auto mb-3">
                    <HiClipboardDocumentList className="w-6 h-6 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] font-medium">
                    {isDragOver ? 'Drop task here' : 'No tasks'}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {isDragOver ? '' : 'Drag tasks here or add new ones'}
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    workspaceSlug={workspaceSlug}
                    projectSlug={projectSlug}
                    projects={projects}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
              
              {/* Add Task Button for Column */}
              <Button 
                variant="ghost" 
                onClick={() => onAddTask?.(statusValue)}
                className="w-full border-2 border-dashed border-[var(--border)]/50 hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/30 transition-all duration-200 py-6 mt-4"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Add Task</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function TaskBoardView({ 
  tasks, 
  workspaceSlug, 
  projectSlug, 
  projects,
  onTaskStatusChange,
  onAddTask
}: TaskBoardViewProps) {
  const [localTasks, setLocalTasks] = useState(tasks);

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleStatusChange = (taskId: string, newStatus: string) => {
    // Update local state immediately for smooth UX
    setLocalTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: { ...task.status, name: newStatus } }
          : task
      )
    );

    // Call parent callback
    onTaskStatusChange?.(taskId, newStatus);
  };

  const handleAddTask = (status: string) => {
    onAddTask?.(status);
  };

  // Group tasks by status
  const groupedTasks = {
    todo: localTasks.filter(task => !task.status?.name || task.status?.name.toLowerCase() === 'todo' || task.status?.name.toLowerCase() === 'to do'),
    in_progress: localTasks.filter(task => task.status?.name?.toLowerCase() === 'in progress' || task.status?.name?.toLowerCase() === 'in_progress'),
    review: localTasks.filter(task => task.status?.name?.toLowerCase() === 'review'),
    done: localTasks.filter(task => task.status?.name?.toLowerCase() === 'done' || task.status?.name?.toLowerCase() === 'completed'),
  };

  if (tasks.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mx-auto mb-6">
            <HiClipboardDocumentList className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <div className="text-lg font-semibold text-[var(--foreground)] mb-2">No tasks found</div>
          <div className="text-sm text-[var(--muted-foreground)]">Create your first task to get started</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[var(--background)] to-[var(--muted)]/20 rounded-xl p-3 sm:p-6 shadow-inner">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center">
            <HiClipboardDocumentList className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Task Board</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {localTasks.length} tasks across {Object.values(groupedTasks).filter(tasks => tasks.length > 0).length} columns
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span>To Do ({groupedTasks.todo.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>In Progress ({groupedTasks.in_progress.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Review ({groupedTasks.review.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Done ({groupedTasks.done.length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-4 min-h-[600px] scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
        <StatusColumn
          title="To Do"
          tasks={groupedTasks.todo}
          statusColor="bg-gray-500"
          statusValue="todo"
          workspaceSlug={workspaceSlug}
          projectSlug={projectSlug}
          projects={projects}
          onStatusChange={handleStatusChange}
          onAddTask={handleAddTask}
        />
        <StatusColumn
          title="In Progress"
          tasks={groupedTasks.in_progress}
          statusColor="bg-blue-500"
          statusValue="in_progress"
          workspaceSlug={workspaceSlug}
          projectSlug={projectSlug}
          projects={projects}
          onStatusChange={handleStatusChange}
          onAddTask={handleAddTask}
        />
        <StatusColumn
          title="Review"
          tasks={groupedTasks.review}
          statusColor="bg-purple-500"
          statusValue="review"
          workspaceSlug={workspaceSlug}
          projectSlug={projectSlug}
          projects={projects}
          onStatusChange={handleStatusChange}
          onAddTask={handleAddTask}
        />
        <StatusColumn
          title="Done"
          tasks={groupedTasks.done}
          statusColor="bg-green-500"
          statusValue="done"
          workspaceSlug={workspaceSlug}
          projectSlug={projectSlug}
          projects={projects}
          onStatusChange={handleStatusChange}
          onAddTask={handleAddTask}
        />
      </div>
    </div>
  );
}