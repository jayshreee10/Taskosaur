'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { statusColors, priorityColors } from '../TaskViewSelector';

interface TaskCalendarViewProps {
  tasks: Task[];
  workspaceSlug: string;
  projectSlug: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfMonth: number;
  tasks: Task[];
}

export default function TaskCalendarView({ tasks, workspaceSlug, projectSlug }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState('');

  // Function to parse date strings
  const parseDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  // Function to get days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Function to generate calendar days for a month
  const generateCalendarDays = (date: Date, taskList: Task[]) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Set month and year display
    setCurrentMonth(new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date));
    setCurrentYear(year.toString());
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month, getDaysInMonth(year, month));
    
    // Get the first day to display (might be from the previous month)
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - dayOfWeek);
    
    // Get the last day to display (might be from the next month)
    const lastDayOfCalendar = new Date(lastDayOfMonth);
    const remainingDays = 6 - lastDayOfMonth.getDay();
    lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + remainingDays);
    
    // Generate all calendar days
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentDay = new Date(firstDayOfCalendar);
    
    while (currentDay <= lastDayOfCalendar) {
      const currentDayDate = new Date(currentDay);
      const isCurrentMonth = currentDayDate.getMonth() === month;
      const isToday = currentDayDate.getTime() === today.getTime();
      
      // Find tasks due on this day
      const dayTasks = taskList.filter(task => {
        const dueDate = parseDate(task.dueDate);
        if (!dueDate) return false;
        
        return (
          dueDate.getFullYear() === currentDayDate.getFullYear() &&
          dueDate.getMonth() === currentDayDate.getMonth() &&
          dueDate.getDate() === currentDayDate.getDate()
        );
      });
      
      days.push({
        date: new Date(currentDayDate),
        isCurrentMonth,
        isToday,
        dayOfMonth: currentDayDate.getDate(),
        tasks: dayTasks
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  // Handle month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Initialize and update calendar when tasks or current date changes
  useEffect(() => {
    generateCalendarDays(currentDate, tasks);
  }, [currentDate, tasks]);

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{currentMonth} {currentYear}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
            aria-label="Previous Month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium"
          >
            Today
          </button>
          <button 
            onClick={() => navigateMonth('next')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
            aria-label="Next Month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-center font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const dayClasses = [
            'min-h-[80px] flex flex-col border border-gray-200 dark:border-gray-700 p-2',
            day.isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-100 dark:bg-gray-800 opacity-60',
            day.isToday ? 'ring-2 ring-blue-500' : ''
          ].join(' ');

          const numberClasses = [
            'font-bold text-sm',
            day.isToday ? 'text-blue-600 dark:text-blue-400' :
            day.isCurrentMonth ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
          ].join(' ');

          return (
            <div key={index} className={dayClasses}>
              <div className="flex items-center justify-between mb-1">
                <span className={numberClasses}>
                  {day.dayOfMonth}
                </span>
                {day.isCurrentMonth && day.tasks.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    {day.tasks.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {day.isCurrentMonth && day.tasks.map((task) => (
                  <Link 
                    key={task.id}
                    href={`/${workspaceSlug}/${projectSlug}/tasks/${task.id}`}
                    className={`truncate px-2 py-1 rounded text-xs font-medium transition-colors duration-150 ${statusColors[task.status.name as keyof typeof statusColors] || 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'} hover:bg-blue-200 dark:hover:bg-blue-800`}
                    title={task.title}
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}