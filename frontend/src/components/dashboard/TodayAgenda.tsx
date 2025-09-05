import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  HiCalendar,
  HiClock,
  HiCheckCircle,
  HiSparkles,
} from 'react-icons/hi2';
import { HiX } from "react-icons/hi";
import { Task } from '@/types';

interface TodayAgendaProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  upcomingTasks?: Task[];
}

const getPriorityConfig = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
    case 'URGENT':
      return {
        color: 'bg-red-500',
        bgClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        iconClass: 'text-red-500',
        label: 'High Priority'
      };
    case 'MEDIUM':
      return {
        color: 'bg-amber-500',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        iconClass: 'text-amber-500',
        label: 'Medium Priority'
      };
    case 'LOW':
      return {
        color: 'bg-green-500',
        bgClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        iconClass: 'text-green-500',
        label: 'Low Priority'
      };
    default:
      return {
        color: 'bg-gray-400',
        bgClass: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700',
        iconClass: 'text-gray-400',
        label: 'Normal'
      };
  }
};

const formatDueDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'Overdue';
    if (diffHours < 24) return `${diffHours}h left`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export function TodayAgenda({ 
  isOpen, 
  onClose, 
  currentDate, 
  upcomingTasks = []
}: TodayAgendaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <Card className="relative bg-[var(--card)] rounded-[var(--card-radius)] shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden border-none transform transition-all duration-200 scale-100 animate-in slide-in-from-bottom-4">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[var(--primary)]/5 via-[var(--primary)]/8 to-[var(--primary)]/5 px-4 py-4 border-b border-[var(--border)]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center shadow-lg">
                  <HiCalendar className="w-5 h-5 text-[var(--primary-foreground)]" />
                </div>
                {upcomingTasks.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{upcomingTasks.length}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  Today's Agenda
                  <HiSparkles className="w-4 h-4 text-[var(--primary)]" />
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">{currentDate}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200"
            >
              <HiX className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <CardContent className="p-0 max-h-[50vh] overflow-y-auto">
          <div className="p-4 space-y-3">
            
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {/* Single Task List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <HiCheckCircle className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--foreground)]">Today's Tasks</h4>
                        <p className="text-xs text-[var(--muted-foreground)]">Scheduled for completion</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-none">
                      {upcomingTasks.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {upcomingTasks.map((task) => {
                      const priorityConfig = getPriorityConfig(task.priority);
                      const isUrgent = task.priority === 'HIGH';
                      return (
                        <div
                          key={task.id}
                          className={`group p-3 rounded-lg border transition-all duration-200 ${
                            isUrgent 
                              ? 'border-red-200 bg-red-50/30 dark:border-red-800/30 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10' 
                              : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)]/30 hover:border-[var(--primary)]/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${priorityConfig.color} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    isUrgent 
                                      ? 'text-red-900 dark:text-red-100 group-hover:text-red-700 dark:group-hover:text-red-200' 
                                      : 'text-[var(--foreground)] group-hover:text-[var(--primary)]'
                                  }`}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge className={`text-[10px] px-1.5 py-0.5 ${priorityConfig.bgClass} border-none`}>
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--muted-foreground)]">
                                  <HiClock className="w-2.5 h-2.5" />
                                  Due: {formatDueDate(task.dueDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
                  <HiCheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="text-base font-semibold text-[var(--foreground)] mb-1">All clear for today!</h4>
                <p className="text-sm text-[var(--muted-foreground)] mb-3 max-w-xs mx-auto">
                  No tasks scheduled. You're all caught up!
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <HiSparkles className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Great job staying organized!
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-[var(--muted)]/30 border-t border-[var(--border)]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiSparkles className="w-3 h-3 text-[var(--primary)]" />
              <p className="text-xs text-[var(--muted-foreground)]">
                {upcomingTasks.length > 0 
                  ? "Stay focused and productive!"
                  : "Enjoy your free time!"
                }
              </p>
            </div>
            <Button
              onClick={onClose}
              size="sm"
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 text-xs px-3 py-1.5"
            >
              Got it!
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}