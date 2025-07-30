'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TaskListView from './views/TaskListView';
import TaskKanbanView from './views/TaskKanbanView';
import TaskGanttView from './views/TaskGanttView';
import TaskCalendarView from './views/TaskCalendarView';
import { Task } from '@/types';

// Define view types and icons
const viewTypes = [
  { 
    id: 'list', 
    name: 'List',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
    )
  },
  { 
    id: 'kanban', 
    name: 'Kanban',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="16" width="7" height="5"></rect>
      </svg>
    )
  },
  { 
    id: 'gantt', 
    name: 'Gantt',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <line x1="7" y1="14" x2="12" y2="14"></line>
        <line x1="10" y1="18" x2="17" y2="18"></line>
      </svg>
    )
  },
  { 
    id: 'calendar', 
    name: 'Calendar',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    )
  }
];

// Define color mappings
export const statusColors = {
  'Todo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
};

export const priorityColors = {
  'Low': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'LOW': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'MEDIUM': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'High': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'HIGH': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'HIGHEST': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

// Add these type exports for compatibility
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'HIGHEST';

interface TaskViewSelectorProps {
  tasks: Task[];
  baseUrl: string;
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
}

export default function TaskViewSelector({ tasks, baseUrl, workspaceSlug, projectSlug, projects }: TaskViewSelectorProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<string>('list');

  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  // Ensure workspace and project slugs are strings
  const safeWorkspaceSlug = workspaceSlug || '';
  const safeProjectSlug = projectSlug || '';
  
  // Ensure projects is always an array
  const safeProjects = Array.isArray(projects) ? projects : [];

  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
    
    if (viewId === 'list') {
      router.push(baseUrl);
    } else {
      router.push(`${baseUrl}/${viewId}`);
    }
  };

  // Determine which view to render
  let currentView;
  switch (activeView) {
    case 'kanban':
      currentView = (
        <TaskKanbanView 
          tasks={safeTasks} 
          workspaceSlug={safeWorkspaceSlug} 
          projectSlug={safeProjectSlug} 
          projects={safeProjects}
        />
      );
      break;
    case 'gantt':
      currentView = (
        <TaskGanttView 
          tasks={safeTasks} 
          workspaceSlug={safeWorkspaceSlug} 
          projectSlug={safeProjectSlug} 
        />
      );
      break;
    case 'calendar':
      currentView = (
        <TaskCalendarView 
          tasks={safeTasks} 
          workspaceSlug={safeWorkspaceSlug} 
          projectSlug={safeProjectSlug} 
        />
      );
      break;
    default:
      currentView = (
        <TaskListView 
          tasks={safeTasks} 
          workspaceSlug={safeWorkspaceSlug} 
          projectSlug={safeProjectSlug} 
          projects={safeProjects} 
        />
      );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-2 flex">
        <div className="flex justify-start space-x-1">
          {viewTypes.map((viewType) => (
            <button
              key={viewType.id}
              onClick={() => handleViewChange(viewType.id)}
              className={`flex items-center px-3 py-2 rounded-md ${
                activeView === viewType.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{viewType.icon}</span>
              <span>{viewType.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {currentView}
      </div>
    </div>
  );
}