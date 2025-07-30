'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import { Card, Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/badges';
import { HiCalendar, HiChatBubbleLeft, HiArrowTopRightOnSquare } from 'react-icons/hi2';

interface TaskKanbanViewProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
}

export default function TaskKanbanView({ tasks, workspaceSlug, projectSlug, projects }: TaskKanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Group tasks by status for kanban view
  const tasksByStatus: Record<string, Task[]> = {
    'Todo': [],
    'In Progress': [],
    'Review': [],
    'Done': []
  };
  
  safeTasks.forEach(task => {
    // Use the task's status name
    const statusName = task.status.name;
    
    // Ensure the status exists in our tasksByStatus object
    if (tasksByStatus[statusName]) {
      tasksByStatus[statusName].push(task);
    } else {
      tasksByStatus['Todo'].push(task); // fallback to Todo
    }
  });

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (status: string) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status.name !== targetStatus) {
      // In a real app, this would make an API call to update the task
      console.log(`Moving task "${draggedTask.title}" from "${draggedTask.status.name}" to "${targetStatus}"`);
      
      // In a real app, you'd update the parent component's state or refetch data
      console.log('Task would be moved to:', targetStatus);
    }
    
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Bug':
        return '🐛';
      case 'Story':
        return '📖';
      case 'Epic':
        return '🎯';
      case 'Task':
        return '📋';
      default:
        return '📋';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'HIGH':
        return '🔴';
      case 'Medium':
      case 'MEDIUM':
        return '🟡';
      case 'Low':
      case 'LOW':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-600' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, color: 'text-yellow-600' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-gray-600' };
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '1.5rem', 
      overflowX: 'auto' 
    }}>
      {(Object.keys(tasksByStatus) as string[]).map((status) => {
        const isDropTarget = dragOverColumn === status;
        
        return (
          <div
            key={status} 
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(status)}
            onDragLeave={handleDragLeave}
            onDrop={(e: React.DragEvent) => handleDrop(e, status)}
          >
            <Card className={`p-5 transition-all duration-200 ${isDropTarget ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div 
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: status === 'Todo' ? '#64748b' : 
                                     status === 'In Progress' ? '#f59e0b' : 
                                     status === 'Review' ? '#3b82f6' : '#10b981'
                    }}
                  />
                  <h3 style={{ 
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--foreground)' 
                  }}>
                    {status}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {tasksByStatus[status].length}
                </Badge>
              </div>

              {/* Tasks Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasksByStatus[status].map((task) => {
                // Find the project for this task if we have projects data
                const taskProject = projects ? projects.find(p => p.id === task.projectId) : null;
                
                // Use provided workspace/project slugs or get them from the project data
                const wsSlug = workspaceSlug || (taskProject?.workspace?.slug || '');
                const projSlug = projectSlug || (taskProject?.slug || '');
                
                const isDragging = draggedTask?.id === task.id;
                
                return (
                  <div
                    key={task.id}
                    className={`cursor-move group transition-all duration-200 ${isDragging ? 'opacity-50 rotate-1 shadow-lg' : ''}`}
                    draggable
                    onDragStart={(e: React.DragEvent) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <Card className="p-4">
                      {/* Task Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem' }}>{getTypeIcon(task.type || 'Task')}</span>
                          <Badge variant="secondary" className="text-xs font-medium">
                            {task.key}
                          </Badge>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem' }}>{getPriorityIcon(task.priority)}</span>
                          <Link 
                            href={`/${wsSlug}/${projSlug}/tasks/${task.id}`}
                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <HiArrowTopRightOnSquare className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Task Title */}
                      <h4 style={{ 
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        lineHeight: '1.25',
                        color: 'var(--foreground)'
                      }}>
                        {task.title || 'Untitled Task'}
                      </h4>

                      {/* Task Labels */}
                      {task.labels && task.labels.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                          {task.labels.slice(0, 2).map((label: any) => (
                            <span 
                              key={label.id}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                backgroundColor: `${label.color}20`, 
                                color: label.color,
                                border: `1px solid ${label.color}40`
                              }}
                            >
                              {label.name}
                            </span>
                          ))}
                          {task.labels.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{task.labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          {(() => {
                            const dueDateInfo = formatDueDate(task.dueDate);
                            return (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                fontSize: '0.75rem',
                                color: dueDateInfo.color === 'text-red-600' ? '#dc2626' :
                                       dueDateInfo.color === 'text-orange-600' ? '#ea580c' :
                                       dueDateInfo.color === 'text-yellow-600' ? '#ca8a04' : '#6b7280'
                              }}>
                                <HiCalendar className="w-3 h-3 mr-1" />
                                {dueDateInfo.text}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Task Footer */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-color, #e5e7eb)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Child tasks indicator */}
                          {task.childTasks && task.childTasks.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {task.childTasks.length} subtasks
                            </Badge>
                          )}
                          
                          {/* Comments indicator */}
                          {task.comments && task.comments.length > 0 && (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <HiChatBubbleLeft className="w-3 h-3" />
                              {task.comments.length}
                            </Badge>
                          )}
                        </div>

                        {/* Assignee */}
                        {task.assignee && (
                          <UserAvatar
                            user={task.assignee}
                            size="xs"
                          />
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
              
              {/* Empty State */}
              {tasksByStatus[status].length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem 0',
                  color: 'var(--text-muted, #6b7280)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '0.5rem' 
                  }}>
                    <svg 
                      style={{ width: '2rem', height: '2rem', opacity: 0.5 }} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>No tasks</p>
                  </div>
                </div>
              )}
              
              {/* Add Task Link */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                onClick={() => {
                  const href = workspaceSlug && projectSlug 
                    ? `/${workspaceSlug}/${projectSlug}/tasks/new?status=${status}` 
                    : workspaceSlug 
                      ? `/${workspaceSlug}/tasks/new?status=${status}` 
                      : `/tasks/new?status=${status}`;
                  window.location.href = href;
                }}
              >
                + Add task
              </Button>
            </div>
          </Card>
        </div>
      );
    })}
  </div>
  );
}