'use client';

import { useState } from 'react';
import { TaskFilter, TaskPriority, TaskType } from '@/types/tasks';
import { Button } from '@/components/ui';

interface TaskFilterPanelProps {
  filters: TaskFilter;
  onFiltersChange: (filters: TaskFilter) => void;
  projectId: string;
}

export default function TaskFilterPanel({ filters, onFiltersChange, projectId }: TaskFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<TaskFilter>(filters);

  const handleFilterChange = (key: keyof TaskFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    }).length;
  };

  const mockUsers = [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
    { id: 'user-3', name: 'Bob Johnson' }
  ];

  const mockLabels = [
    { id: 'label-1', name: 'Frontend', color: '#3b82f6' },
    { id: 'label-2', name: 'Backend', color: '#10b981' },
    { id: 'label-3', name: 'Bug', color: '#ef4444' },
    { id: 'label-4', name: 'Enhancement', color: '#8b5cf6' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="ml-2 text-sm text-indigo-600 dark:text-indigo-400">
              ({getActiveFilterCount()} active)
            </span>
          )}
        </h3>
        {getActiveFilterCount() > 0 && (
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Search tasks..."
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assignee
          </label>
          <select
            multiple
            value={localFilters.assigneeIds || []}
            onChange={(e) => handleFilterChange('assigneeIds', Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            size={3}
          >
            {mockUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Hold Ctrl/Cmd to select multiple
          </p>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority
          </label>
          <div className="space-y-2">
            {Object.values(TaskPriority).map(priority => (
              <label key={priority} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.priorities?.includes(priority) || false}
                  onChange={(e) => {
                    const priorities = localFilters.priorities || [];
                    if (e.target.checked) {
                      handleFilterChange('priorities', [...priorities, priority]);
                    } else {
                      handleFilterChange('priorities', priorities.filter(p => p !== priority));
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {priority}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <div className="space-y-2">
            {Object.values(TaskType).map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.types?.includes(type) || false}
                  onChange={(e) => {
                    const types = localFilters.types || [];
                    if (e.target.checked) {
                      handleFilterChange('types', [...types, type]);
                    } else {
                      handleFilterChange('types', types.filter(t => t !== type));
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Labels
          </label>
          <div className="space-y-2">
            {mockLabels.map(label => (
              <label key={label.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.labelIds?.includes(label.id) || false}
                  onChange={(e) => {
                    const labelIds = localFilters.labelIds || [];
                    if (e.target.checked) {
                      handleFilterChange('labelIds', [...labelIds, label.id]);
                    } else {
                      handleFilterChange('labelIds', labelIds.filter(id => id !== label.id));
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                />
                <span className="ml-2 flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {label.name}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Due Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Due Date Range
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={localFilters.dueDateFrom || ''}
              onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="From"
            />
            <input
              type="date"
              value={localFilters.dueDateTo || ''}
              onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="To"
            />
          </div>
        </div>

        {/* Additional Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.hasAttachments || false}
                onChange={(e) => handleFilterChange('hasAttachments', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Has attachments
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.hasComments || false}
                onChange={(e) => handleFilterChange('hasComments', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Has comments
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Filters
        </h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleFilterChange('assigneeIds', ['user-1'])} // Current user
          >
            My Tasks
          </Button>
          <Button
            variant="outline"
            onClick={() => handleFilterChange('priorities', [TaskPriority.HIGH, TaskPriority.HIGHEST])}
          >
            High Priority
          </Button>
          <Button
            variant="outline"
            onClick={() => handleFilterChange('dueDateFrom', new Date().toISOString().split('T')[0])}
          >
            Due Today
          </Button>
          <Button
            variant="outline"
            onClick={() => handleFilterChange('types', [TaskType.BUG])}
          >
            Bugs Only
          </Button>
        </div>
      </div>
    </div>
  );
}