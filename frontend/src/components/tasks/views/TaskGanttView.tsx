'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { statusColors } from '../TaskViewSelector';

interface TaskGanttViewProps {
  tasks: Task[];
  workspaceSlug: string;
  projectSlug: string;
}

const parseDate = (dateString: string | undefined): Date => {
  if (!dateString) return new Date();
  return new Date(dateString);
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

export default function TaskGanttView({ tasks, workspaceSlug, projectSlug }: TaskGanttViewProps) {
  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  // Prepare task data with start and end dates
  const [ganttTasks, setGanttTasks] = useState<Task[]>([]);
  const [timeRange, setTimeRange] = useState<{ start: Date, end: Date, days: Date[] }>({
    start: new Date(),
    end: new Date(),
    days: []
  });

  useEffect(() => {
    // Process tasks to ensure they all have start and end dates
    const processedTasks = safeTasks.filter(task => task.dueDate || task.startDate);

    // Find the earliest and latest dates across all tasks
    let earliest = new Date();
    let latest = new Date();

    if (processedTasks.length > 0) {
      earliest = processedTasks.reduce((min, task) => {
        const taskStart = parseDate(task.startDate);
        return taskStart < min ? taskStart : min;
      }, parseDate(processedTasks[0].startDate));

      latest = processedTasks.reduce((max, task) => {
        const taskEnd = parseDate(task.dueDate);
        return taskEnd > max ? taskEnd : max;
      }, parseDate(processedTasks[0].dueDate));
    }

    // Extend range by a few days on each side
    earliest = new Date(earliest.setDate(earliest.getDate() - 2));
    latest = new Date(latest.setDate(latest.getDate() + 2));

    // Generate array of days for the time range
    const days: Date[] = [];
    let current = new Date(earliest);
    while (current <= latest) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }

    setGanttTasks(processedTasks);
    setTimeRange({ start: earliest, end: latest, days });
  }, [safeTasks]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  // Get day of week (0 = Sunday, 6 = Saturday)
  const getDayOfWeek = (date: Date): number => {
    return date.getDay();
  };

  // Check if a date is a weekend
  const isWeekend = (date: Date): boolean => {
    const day = getDayOfWeek(date);
    return day === 0 || day === 6; // Sunday or Saturday
  };

  // Safe status colors fallback
  const getStatusColor = (statusName: string): string => {
    const safeStatusColors = statusColors || {};
    return safeStatusColors[statusName as keyof typeof statusColors] || 'bg-gray-400';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="overflow-x-auto">
        {/* Time scale */}
        <div className="flex flex-col mb-4">
          <div className="flex">
            <div className="w-64"></div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${timeRange.days.length}, minmax(40px, 1fr))` }}>
              {timeRange.days.map((day, index) => (
                <div 
                  key={index} 
                  className={`text-xs text-center py-2 border-b border-gray-200 dark:border-gray-700 ${isWeekend(day) ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300'}`}
                >
                  {formatDate(day)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="flex flex-col gap-2">
          {ganttTasks.length > 0 ? ganttTasks.map((task) => {
            const taskStart = parseDate(task.startDate);
            const taskEnd = parseDate(task.dueDate);

            // Calculate position and width
            const startOffset = daysBetween(timeRange.start, taskStart);
            const duration = daysBetween(taskStart, taskEnd) + 1;

            let statusColor;
            switch(task.status.name) {
              case 'Done': 
                statusColor = 'bg-green-500';
                break;
              case 'Review':
                statusColor = 'bg-yellow-500';
                break;
              case 'In Progress':
                statusColor = 'bg-blue-500';
                break;
              default:
                statusColor = 'bg-gray-400';
            }

            return (
              <div key={task.id} className="flex items-center gap-2 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="w-64 flex flex-col gap-1">
                  <Link 
                    href={`/${workspaceSlug}/${projectSlug}/tasks/${task.id}`}
                    className="font-medium text-sm text-blue-700 dark:text-blue-300 truncate hover:underline"
                  >
                    {task.title || 'Untitled Task'}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(task.status.name)} text-white`}> 
                      {task.status.name}
                    </span>
                    {task.assignee && (
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
                          {task.assignee.avatar || `${task.assignee.firstName.charAt(0)}${task.assignee.lastName.charAt(0)}`.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  className="relative flex-1 h-8"
                  style={{ minWidth: `${timeRange.days.length * 40}px` }}
                >
                  {/* Render task bar */}
                  <div 
                    className={`absolute h-6 rounded ${statusColor} opacity-80 cursor-pointer transition-all duration-200`}
                    style={{ 
                      left: `${(startOffset / timeRange.days.length) * 100}%`, 
                      width: `${(duration / timeRange.days.length) * 100}%`,
                      top: '0.25rem'
                    }}
                    title={`${task.title || 'Untitled Task'} (${task.startDate || 'No start date'} - ${task.dueDate || 'No due date'})`}
                  >
                    {duration > 3 && (task.title || 'Untitled')}
                  </div>

                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {timeRange.days.map((day, index) => (
                      <div 
                        key={index} 
                        className={`flex-1 border-l border-gray-200 dark:border-gray-700 ${isWeekend(day) ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No tasks to display in Gantt view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}