'use client';

import { useState, useEffect, useRef, useMemo, useCallback, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';
import { HiUser, HiClock, HiCalendarDays, HiChevronLeft, HiChevronRight, HiViewColumns } from 'react-icons/hi2';

interface TaskGanttViewProps {
  tasks: Task[];
  workspaceSlug: string;
  projectSlug?: string;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

// Memoized utility functions moved outside component
const parseDate = (dateString: string | undefined): Date => {
  if (!dateString) return new Date();
  try {
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return new Date();
    }
    return parsed;
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error);
    return new Date();
  }
};

const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; 
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export default function TaskGanttView({ tasks, workspaceSlug, projectSlug, onTaskUpdate }: TaskGanttViewProps) {
  const router = useRouter();
  
  // Ensure tasks is always an array and memoize
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);
  
  // State management with error handling
  const [ganttTasks, setGanttTasks] = useState<Task[]>([]);
  const [timeRange, setTimeRange] = useState<{ start: Date, end: Date, days: Date[] }>({
    start: new Date(),
    end: new Date(),
    days: []
  });
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [focusedTask, setFocusedTask] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('days');
  const [isCompact, setIsCompact] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Memoized task processing with error handling
  const processedTasksData = useMemo(() => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('Gantt - Processing tasks:', safeTasks.length);
      
      // Process tasks and assign dates for visualization if missing
      const processedTasks = safeTasks.map((task, index) => {
        let startDate = task.startDate;
        let dueDate = task.dueDate;
        
        // If no dates, generate them based on creation date or index
        if (!startDate && !dueDate) {
          if (task.createdAt) {
            const createdDate = parseDate(task.createdAt);
            startDate = createdDate.toISOString();
            dueDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString();
          } else {
            // Fallback to distributed dates
            const today = new Date();
            startDate = new Date(today.getTime() + (index * 24 * 60 * 60 * 1000)).toISOString();
            dueDate = new Date(today.getTime() + ((index + 7) * 24 * 60 * 60 * 1000)).toISOString();
          }
        } else if (!startDate && dueDate) {
          const due = parseDate(dueDate);
          startDate = new Date(due.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
        } else if (startDate && !dueDate) {
          const start = parseDate(startDate);
          dueDate = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString();
        }
        
        return {
          ...task,
          startDate,
          dueDate
        };
      });

      // Find date range
      let earliest = new Date();
      let latest = new Date();

      if (processedTasks.length > 0) {
        const allDates = processedTasks.flatMap(task => [
          parseDate(task.startDate),
          parseDate(task.dueDate)
        ]);
        
        earliest = new Date(Math.min(...allDates.map(d => d.getTime())));
        latest = new Date(Math.max(...allDates.map(d => d.getTime())));
        
        // Extend range
        earliest.setDate(earliest.getDate() - 2);
        latest.setDate(latest.getDate() + 2);
      }

      return { processedTasks, earliest, latest };
    } catch (error) {
      console.error('Error processing Gantt tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to process tasks');
      return { processedTasks: [], earliest: new Date(), latest: new Date() };
    } finally {
      setIsLoading(false);
    }
  }, [safeTasks]);

  // Update state when processed data changes
  useEffect(() => {
    const { processedTasks, earliest, latest } = processedTasksData;
    const days = generateTimeScale(earliest, latest, viewMode);
    
    setGanttTasks(processedTasks);
    setTimeRange({ start: earliest, end: latest, days });
  }, [processedTasksData, viewMode]);

  // Memoized utility functions
  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }, []);

  const getDayOfWeek = useCallback((date: Date): number => {
    return date.getDay();
  }, []);

  const isWeekend = useCallback((date: Date): boolean => {
    const day = getDayOfWeek(date);
    return day === 0 || day === 6;
  }, [getDayOfWeek]);

  // Theme-consistent status colors using your CSS variables
  const getStatusColor = useCallback((statusName: string | undefined): { bg: string, border: string, text: string } => {
    switch (statusName?.toLowerCase()) {
      case 'done':
      case 'completed':
        return { 
          bg: 'bg-green-500', 
          border: 'border-green-400', 
          text: 'text-white' 
        };
      case 'in progress':
      case 'in_progress':
        return { 
          bg: 'bg-blue-500', 
          border: 'border-blue-400', 
          text: 'text-white' 
        };
      case 'review':
        return { 
          bg: 'bg-[var(--primary)]', 
          border: 'border-[var(--primary)]', 
          text: 'text-[var(--primary-foreground)]' 
        };
      case 'todo':
        return { 
          bg: 'bg-gray-500', 
          border: 'border-gray-400', 
          text: 'text-white' 
        };
      default:
        return { 
          bg: 'bg-[var(--muted)]', 
          border: 'border-[var(--border)]', 
          text: 'text-[var(--muted-foreground)]' 
        };
    }
  }, []);

  // Theme-consistent priority colors
  const getPriorityColor = useCallback((priority: string | undefined): string => {
    switch (priority?.toLowerCase()) {
      case 'highest':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'lowest':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
      default:
        return 'text-[var(--muted-foreground)] bg-[var(--muted)] border-[var(--border)]';
    }
  }, []);

  // Navigation and interaction handlers
  const handleNavigation = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, task: Task) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const href = workspaceSlug && projectSlug 
        ? `/${workspaceSlug}/${projectSlug}/tasks/${task.id}` 
        : workspaceSlug 
          ? `/${workspaceSlug}/tasks/${task.id}` 
          : `/tasks/${task.id}`;
      handleNavigation(href);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Navigate between tasks
      const currentIndex = ganttTasks.findIndex(t => t.id === task.id);
      const nextIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < ganttTasks.length) {
        const nextTaskId = ganttTasks[nextIndex].id;
        const nextElement = taskRefs.current.get(nextTaskId);
        if (nextElement) {
          nextElement.focus();
          setFocusedTask(nextTaskId);
        }
      }
    }
  }, [workspaceSlug, projectSlug, ganttTasks, handleNavigation]);

  // Memoized time scale generation
  const generateTimeScale = useCallback((start: Date, end: Date, mode: 'days' | 'weeks' | 'months') => {
    const scale: Date[] = [];
    const current = new Date(start);
    
    try {
      switch (mode) {
        case 'days':
          while (current <= end && scale.length < 1000) { // Safety limit
            scale.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }
          break;
        case 'weeks':
          current.setDate(current.getDate() - current.getDay());
          while (current <= end && scale.length < 200) { // Safety limit
            scale.push(new Date(current));
            current.setDate(current.getDate() + 7);
          }
          break;
        case 'months':
          current.setDate(1);
          while (current <= end && scale.length < 60) { // Safety limit
            scale.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
          }
          break;
      }
    } catch (error) {
      console.error('Error generating time scale:', error);
      return [new Date()]; // Fallback
    }
    
    return scale;
  }, []);

  // Memoized date formatting
  const formatDateForView = useCallback((date: Date, mode: 'days' | 'weeks' | 'months'): string => {
    try {
      switch (mode) {
        case 'days':
          return new Intl.DateTimeFormat('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }).format(date);
        case 'weeks':
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(weekEnd)}`;
        case 'months':
          return new Intl.DateTimeFormat('en-US', { 
            month: 'long', 
            year: 'numeric' 
          }).format(date);
        default:
          return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toString();
    }
  }, []);

  // Memoized scroll to today function
  const scrollToToday = useCallback(() => {
    if (scrollContainerRef.current && timeRange.days.length > 0) {
      try {
        const today = new Date();
        const todayIndex = timeRange.days.findIndex(day => 
          day.toDateString() === today.toDateString()
        );
        if (todayIndex !== -1) {
          const cellWidth = viewMode === 'days' ? 60 : viewMode === 'weeks' ? 120 : 200;
          const scrollPosition = todayIndex * cellWidth;
          const containerWidth = scrollContainerRef.current.clientWidth;
          const targetPosition = Math.max(0, scrollPosition - containerWidth / 2);
          
          scrollContainerRef.current.scrollTo({
            left: targetPosition,
            behavior: 'smooth'
          });
        }
      } catch (error) {
        console.error('Error scrolling to today:', error);
      }
    }
  }, [timeRange.days, viewMode]);

  // Show empty state if no tasks - Using your theme
  if (safeTasks.length === 0) {
    return (
      <div className="w-full bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none">
        <div className="text-center py-16">
          <div className="text-[var(--muted-foreground)] mb-6">
            <div className="relative">
              <svg className="w-20 h-20 mx-auto mb-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
                <HiCalendarDays className="w-4 h-4 text-[var(--primary)]/60" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">No tasks to display</h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto leading-relaxed">
              Tasks with timeline information will appear on the Gantt chart when available. Create tasks with start and due dates to visualize your project timeline.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none overflow-hidden"
      role="main"
      aria-label="Gantt chart timeline view"
    >
      {/* Error Display - Theme consistent */}
      {error && (
        <div 
          className="mx-6 mt-4 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg text-[var(--destructive)] text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Loading Overlay - Theme consistent */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-black/10 dark:bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center"
          role="status"
          aria-label="Loading timeline"
        >
          <div className="bg-[var(--card)] rounded-lg p-4 shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--primary)] border-t-transparent"></div>
              <span className="text-sm font-medium text-[var(--foreground)]">Loading timeline...</span>
            </div>
          </div>
        </div>
      )}

      {/* Header - Theme consistent */}
      <div className="p-4 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
              <HiViewColumns className="w-5 h-5" aria-hidden="true" />
              Project Timeline
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {ganttTasks.length} task{ganttTasks.length !== 1 ? 's' : ''} across your timeline
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle - Theme consistent */}
            <div 
              className="flex items-center bg-[var(--muted)] rounded-lg p-1"
              role="radiogroup"
              aria-label="Timeline view mode"
            >
              {(['days', 'weeks', 'months'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={viewMode === mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 capitalize focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
                    viewMode === mode 
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' 
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                  }`}
                  aria-label={`Switch to ${mode} view`}
                >
                  {mode}
                </button>
              ))}
            </div>
            
            {/* Compact Toggle - Theme consistent */}
            <button
              type="button"
              onClick={() => setIsCompact(!isCompact)}
              className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-lg border-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
                isCompact 
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' 
                  : 'bg-[var(--primary)]/5 text-[var(--foreground)] hover:bg-[var(--primary)]/10'
              }`}
              aria-pressed={isCompact}
              aria-label={`${isCompact ? 'Disable' : 'Enable'} compact view`}
            >
              Compact
            </button>
            
            {/* Scroll to Today - Theme consistent */}
            <button
              type="button"
              onClick={scrollToToday}
              className="px-2 sm:px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors duration-200 flex items-center gap-1 sm:gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              aria-label="Scroll timeline to today"
            >
              <HiCalendarDays className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Today</span>
            </button>
          </div>
        </div>
      </div>

      <div 
        className="overflow-x-auto" 
        ref={scrollContainerRef}
        role="application"
        aria-label="Interactive Gantt chart timeline"
        tabIndex={0}
      >
        {/* Time scale - Theme consistent */}
        <div className="flex flex-col min-w-fit">
          <div className="flex sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--border)] shadow-sm">
            <div 
              className={`${isCompact ? 'w-40 sm:w-48' : 'w-64 sm:w-80'} bg-[var(--muted)]/50 border-r border-[var(--border)] flex items-center px-3 sm:px-4 py-3 shrink-0`}
              role="columnheader"
              aria-label="Task information column"
            >
              <span className="text-sm font-semibold text-[var(--foreground)]">Tasks</span>
            </div>
            <div 
              className="flex flex-1"
              role="row"
              aria-label="Timeline header"
            >
              {timeRange.days.map((day, index) => {
                const isToday = new Date().toDateString() === day.toDateString();
                const cellWidth = viewMode === 'days' ? 60 : viewMode === 'weeks' ? 120 : 200;
                return (
                  <div 
                    key={index} 
                    className={`text-xs text-center py-2 sm:py-3 border-r border-[var(--border)]/50 transition-colors duration-200 shrink-0 ${
                      isWeekend(day) 
                        ? 'bg-[var(--muted)]/80 text-[var(--muted-foreground)]' 
                        : isToday 
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                          : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50'
                    }`}
                    style={{ width: `${cellWidth}px` }}
                    role="columnheader"
                    aria-label={`${formatDateForView(day, viewMode)}${isToday ? ' (today)' : ''}${isWeekend(day) ? ' (weekend)' : ''}`}
                  >
                    <div className={`${isToday ? 'text-[var(--primary)] font-bold' : ''} break-words`}>
                      {viewMode === 'days' ? formatDateForView(day, viewMode).split(' ')[1] || formatDateForView(day, viewMode) : formatDateForView(day, viewMode)}
                    </div>
                    {isToday && viewMode === 'days' && (
                      <div className="w-2 h-2 bg-[var(--primary)] rounded-full mx-auto mt-1" aria-hidden="true"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks - Theme consistent */}
        <div className="flex flex-col" role="rowgroup" aria-label="Task timeline rows">
          {ganttTasks.length > 0 ? ganttTasks.map((task, taskIndex) => {
            const taskStart = parseDate(task.startDate);
            const taskEnd = parseDate(task.dueDate);

            // Calculate position and width
            const startOffset = daysBetween(timeRange.start, taskStart);
            const duration = daysBetween(taskStart, taskEnd) + 1;
            const statusColors = getStatusColor(task.status.name);
            const priorityColors = getPriorityColor(task.priority);
            const isHovered = hoveredTask === task.id;
            const isFocused = focusedTask === task.id;
            const isOverdue = taskEnd < new Date() && task.status.name.toLowerCase() !== 'done';

            return (
              <div 
                key={task.id} 
                ref={(el) => {
                  if (el) {
                    taskRefs.current.set(task.id, el);
                  } else {
                    taskRefs.current.delete(task.id);
                  }
                }}
                className={`flex items-center transition-all duration-200 border-b border-[var(--border)]/50 hover:bg-[var(--primary)]/5 focus-within:bg-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:ring-offset-2 ${
                  isCompact ? 'py-2' : 'py-3'
                } ${isHovered ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20' : ''} ${
                  isFocused ? 'bg-[var(--primary)]/10 ring-2 ring-[var(--primary)] ring-offset-2' : ''
                } ${isOverdue ? 'bg-[var(--destructive)]/5 border-[var(--destructive)]/20' : ''}`}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
                onKeyDown={(e) => handleKeyDown(e, task)}
                tabIndex={0}
                role="row"
                aria-label={`Task: ${task.title}, Status: ${task.status.name}, ${isOverdue ? 'Overdue' : `Due ${new Date(task.dueDate!).toLocaleDateString()}`}`}
                aria-describedby={`task-timeline-${task.id}`}
              >
                {/* Task Info - Theme consistent */}
                <div 
                  className={`${isCompact ? 'w-40 sm:w-48' : 'w-64 sm:w-80'} px-2 sm:px-4 border-r border-[var(--border)]/50`}
                  role="cell"
                  aria-label="Task information"
                >
                  <div className="space-y-1 sm:space-y-1.5" id={`task-timeline-${task.id}`}>
                    {/* Row 1: Task Name + Priority Badge */}
                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                      <Link 
                        href={workspaceSlug && projectSlug ? `/${workspaceSlug}/${projectSlug}/tasks/${task.id}` : workspaceSlug ? `/${workspaceSlug}/tasks/${task.id}` : `/tasks/${task.id}`}
                        className={`font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors duration-200 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded-sm ${
                          isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                        } ${isOverdue ? 'text-[var(--destructive)]' : ''}`}
                        title={task.title || 'Untitled Task'}
                        aria-label={`Open task: ${task.title || 'Untitled Task'}`}
                        onClick={(e) => {
                          setFocusedTask(task.id);
                        }}
                      >
                        <span className="line-clamp-1 break-words">
                          {task.title || 'Untitled Task'}
                        </span>
                      </Link>
                      
                      {/* Priority Badge */}
                      {task.priority && (
                        <span 
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-medium border-none shrink-0 transition-colors ${priorityColors}`}
                          aria-label={`Priority: ${task.priority}`}
                          title={`Priority: ${task.priority}`}
                        >
                          <span className="hidden sm:inline">{task.priority}</span>
                          <span className="sm:hidden">{task.priority.charAt(0)}</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Row 2: Status + Date */}
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      {/* Status Badge */}
                      <span 
                        className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-medium border-none min-w-0 ${statusColors.text} ${statusColors.bg} bg-opacity-20 dark:bg-opacity-30`}
                        aria-label={`Status: ${task.status.name}`}
                        title={`Status: ${task.status.name}`}
                      >
                        <span className="truncate">
                          {task.status.name}
                        </span>
                      </span>
                      
                      {/* Date Info */}
                      <div 
                        className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] shrink-0"
                        aria-label={`Due date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}`}
                        title={`Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}`}
                      >
                        <HiCalendarDays className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span className="hidden sm:inline">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'No date'}
                        </span>
                        <span className="sm:hidden">
                          {task.dueDate ? new Date(task.dueDate).getDate() : '--'}
                        </span>
                        {isOverdue && (
                          <span className="text-[var(--destructive)] font-bold ml-1" aria-label="Overdue">!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Timeline Bar - Theme consistent */}
                <div 
                  className="relative h-10 sm:h-12 group"
                  style={{ 
                    minWidth: `${timeRange.days.length * (viewMode === 'days' ? 60 : viewMode === 'weeks' ? 120 : 200)}px` 
                  }}
                  role="cell"
                  aria-label={`Timeline for ${task.title}: ${duration} days from ${new Date(task.startDate!).toLocaleDateString()} to ${new Date(task.dueDate!).toLocaleDateString()}`}
                >
                  {/* Background Grid */}
                  <div className="absolute inset-0 flex" role="presentation" aria-hidden="true">
                    {timeRange.days.map((day, index) => {
                      const isToday = new Date().toDateString() === day.toDateString();
                      const cellWidth = viewMode === 'days' ? 60 : viewMode === 'weeks' ? 120 : 200;
                      return (
                        <div 
                          key={index} 
                          className={`border-r border-[var(--border)]/30 transition-colors duration-200 shrink-0 ${
                            isWeekend(day) 
                              ? 'bg-[var(--muted)]/30' 
                              : isToday 
                                ? 'bg-[var(--primary)]/5 border-[var(--primary)]/30' 
                                : 'hover:bg-[var(--muted)]/20'
                          }`}
                          style={{ 
                            width: `${cellWidth}px` 
                          }}
                        >
                          {isToday && (
                            <div className="w-full h-full bg-[var(--primary)]/10 border-l-1 sm:border-l-2 border-[var(--primary)]"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Task Bar - Theme consistent */}
                  <div 
                    className={`absolute rounded-md sm:rounded-lg shadow-sm border-2 cursor-pointer transition-all duration-300 group-hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
                      statusColors.bg
                    } ${statusColors.border} ${
                      isHovered ? 'scale-105 shadow-lg z-10' : 'hover:scale-102'
                    } ${isFocused ? 'ring-2 ring-[var(--primary)] ring-offset-2 z-10' : ''} ${
                      isOverdue ? 'animate-pulse border-[var(--destructive)] shadow-[var(--destructive)]/20' : ''
                    }`}
                    style={{ 
                      left: `${(startOffset / timeRange.days.length) * 100}%`, 
                      width: `${Math.max((duration / timeRange.days.length) * 100, 1.5)}%`,
                      height: isCompact ? '20px' : '28px',
                      top: isCompact ? '10px' : '8px'
                    }}
                    title={`${task.title || 'Untitled Task'}\nStatus: ${task.status.name}\nDuration: ${duration} days\nStart: ${new Date(task.startDate!).toLocaleDateString()}\nEnd: ${new Date(task.dueDate!).toLocaleDateString()}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`Task timeline bar: ${task.title}, ${duration} days, ${task.status.name} status`}
                    aria-describedby={`task-timeline-${task.id}`}
                    onKeyDown={(e) => handleKeyDown(e, task)}
                    onFocus={() => setFocusedTask(task.id)}
                    onBlur={() => setFocusedTask(null)}
                    onClick={() => {
                      const href = workspaceSlug && projectSlug 
                        ? `/${workspaceSlug}/${projectSlug}/tasks/${task.id}` 
                        : workspaceSlug 
                          ? `/${workspaceSlug}/tasks/${task.id}` 
                          : `/tasks/${task.id}`;
                      handleNavigation(href);
                    }}
                  >
                    {/* Task Bar Content */}
                    <div className="h-full flex items-center justify-between px-1 sm:px-2 text-white">
                      {duration > 2 && !isCompact && (
                        <span className="text-xs font-medium truncate hidden sm:block">
                          {task.title?.substring(0, 15)}{task.title && task.title.length > 15 ? '...' : ''}
                        </span>
                      )}
                      
                      {/* Progress Indicator */}
                      <div className="flex items-center gap-1 ml-auto">
                        {task.status.name.toLowerCase() === 'done' && (
                          <svg 
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                            title="Completed"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isOverdue && (
                          <svg 
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-200 animate-pulse" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                            title="Overdue"
                          >
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {/* Hover Tooltip - Theme consistent */}
                    {(isHovered || isFocused) && (
                      <div className="absolute -top-14 sm:-top-16 left-1/2 transform -translate-x-1/2 bg-[var(--popover)] text-[var(--popover-foreground)] px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-lg border border-[var(--border)] z-30 text-xs whitespace-nowrap max-w-xs">
                        <div className="font-semibold truncate">{task.title || 'Untitled Task'}</div>
                        <div className="text-[var(--muted-foreground)] mt-1 text-xs">
                          <span className="hidden sm:inline">
                            {new Date(task.startDate!).toLocaleDateString()} - {new Date(task.dueDate!).toLocaleDateString()}
                          </span>
                          <span className="sm:hidden">
                            {duration} day{duration !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors.bg} ${statusColors.text}`}>
                            {task.status.name}
                          </span>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--popover)]"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Milestone Markers */}
                  {task.status.name.toLowerCase() === 'done' && (
                    <div 
                      className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-1 sm:border-2 border-white shadow-sm z-10 transition-transform hover:scale-110"
                      style={{ 
                        right: `${100 - ((startOffset + duration) / timeRange.days.length) * 100}%`,
                        top: isCompact ? '14px' : '18px',
                        transform: 'translateX(50%)'
                      }}
                      aria-label="Task completed"
                      title="Task completed"
                    ></div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div 
              className="p-8 sm:p-12 text-center bg-[var(--muted)]/20 rounded-lg mx-4 sm:mx-6"
              role="status"
              aria-label="No tasks available"
            >
              <div className="text-[var(--muted-foreground)]">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--muted)]/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <HiCalendarDays className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" aria-hidden="true" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium mb-2 text-[var(--foreground)]">No tasks to display</h3>
                <p className="text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                  Tasks with timeline information will appear here when available. Create tasks with start and due dates to visualize your project timeline.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}