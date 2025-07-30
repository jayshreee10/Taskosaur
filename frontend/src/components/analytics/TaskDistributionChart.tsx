'use client';

import React, { useState } from 'react';
import { TaskType, TaskPriority } from '@/types/tasks';

interface TaskDistributionChartProps {
  tasksByType: Record<TaskType, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByStatus: Record<string, number>;
}

export default function TaskDistributionChart({ 
  tasksByType, 
  tasksByPriority, 
  tasksByStatus 
}: TaskDistributionChartProps) {
  const [activeView, setActiveView] = useState<'type' | 'priority' | 'status'>('type');

  const getTypeColor = (type: TaskType) => {
    switch (type) {
      case TaskType.BUG:
        return '#ef4444';
      case TaskType.STORY:
        return '#10b981';
      case TaskType.EPIC:
        return '#8b5cf6';
      case TaskType.TASK:
        return '#3b82f6';
      case TaskType.SUBTASK:
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGHEST:
        return '#dc2626';
      case TaskPriority.HIGH:
        return '#ea580c';
      case TaskPriority.MEDIUM:
        return '#ca8a04';
      case TaskPriority.LOW:
        return '#16a34a';
      case TaskPriority.LOWEST:
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return '#64748b';
      case 'In Progress':
        return '#f59e0b';
      case 'Review':
        return '#3b82f6';
      case 'Testing':
        return '#8b5cf6';
      case 'Done':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const renderChart = () => {
    let data: Array<{ label: string; value: number; color: string }> = [];
    
    switch (activeView) {
      case 'type':
        data = Object.entries(tasksByType).map(([type, count]) => ({
          label: type,
          value: count,
          color: getTypeColor(type as TaskType)
        }));
        break;
      case 'priority':
        data = Object.entries(tasksByPriority).map(([priority, count]) => ({
          label: priority,
          value: count,
          color: getPriorityColor(priority as TaskPriority)
        }));
        break;
      case 'status':
        data = Object.entries(tasksByStatus).map(([status, count]) => ({
          label: status,
          value: count,
          color: getStatusColor(status)
        }));
        break;
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Create simple donut chart using CSS
    let cumulativePercentage = 0;
    
    return (
      <div className="space-y-4">
        {/* Donut Chart */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const strokeDashoffset = -cumulativePercentage;
                
                cumulativePercentage += percentage;
                
                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {total}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Percentages */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Task Distribution
        </h3>
        <div className="flex items-center space-x-1">
          {[
            { id: 'type', label: 'Type' },
            { id: 'priority', label: 'Priority' },
            { id: 'status', label: 'Status' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderChart()}
    </div>
  );
}