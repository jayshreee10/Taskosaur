'use client';

import React, { useState } from 'react';
import { TaskStatus, StatusCategory } from '@/types/tasks';
import { Button } from '@/components/ui';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  statuses: TaskStatus[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowEditorProps {
  workflow: Workflow;
  onUpdate: (workflow: Workflow) => void;
}

export default function WorkflowEditor({ workflow, onUpdate }: WorkflowEditorProps) {
  const [draggedStatus, setDraggedStatus] = useState<TaskStatus | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, status: TaskStatus) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedStatus(status);
  };

  const handleDragEnd = () => {
    setDraggedStatus(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedStatus) return;

    const currentIndex = workflow.statuses.findIndex(s => s.id === draggedStatus.id);
    if (currentIndex === targetIndex) return;

    const newStatuses = [...workflow.statuses];
    const [movedStatus] = newStatuses.splice(currentIndex, 1);
    newStatuses.splice(targetIndex, 0, movedStatus);

    // Update order values
    const updatedStatuses = newStatuses.map((status, index) => ({
      ...status,
      order: index + 1
    }));

    onUpdate({
      ...workflow,
      statuses: updatedStatuses
    });

    setDragOverIndex(null);
  };

  const getCategoryColor = (category: StatusCategory) => {
    switch (category) {
      case StatusCategory.TODO:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case StatusCategory.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case StatusCategory.DONE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (category: StatusCategory) => {
    switch (category) {
      case StatusCategory.TODO:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case StatusCategory.IN_PROGRESS:
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case StatusCategory.DONE:
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const sortedStatuses = [...workflow.statuses].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Visual Workflow Editor
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Drag and drop statuses to reorder them. The order defines the typical flow of tasks through your workflow.
        </p>
        
        {/* Legend */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">To Do</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Done</span>
          </div>
        </div>
      </div>

      {/* Workflow Visual */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto">
          {sortedStatuses.map((status, index) => (
            <React.Fragment key={status.id}>
              <div
                className={`flex-shrink-0 w-64 p-4 border-2 border-dashed rounded-lg cursor-move transition-all ${
                  dragOverIndex === index 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                } ${
                  draggedStatus?.id === status.id 
                    ? 'opacity-50 rotate-1' 
                    : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, status)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Status Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {status.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status.category)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      #{status.order}
                    </span>
                  </div>
                </div>

                {/* Status Details */}
                <div className="space-y-2">
                  <div className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(status.category)}`}>
                    {status.category}
                  </div>
                  
                  {status.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {status.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {status.isDefault ? 'Default' : 'Custom'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      <span>Drag to reorder</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              {index < sortedStatuses.length - 1 && (
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-full">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Workflow Rules */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workflow Rules
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Transition Rules
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Tasks can move forward to any subsequent status</li>
              <li>• Tasks can move backward to previous statuses</li>
              <li>• Some transitions may require specific permissions</li>
              <li>• Automated transitions can be configured for certain conditions</li>
            </ul>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Status Requirements
            </h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• At least one status must be marked as default</li>
              <li>• Each workflow must have at least one status in each category</li>
              <li>• Status names must be unique within a workflow</li>
              <li>• Default status cannot be deleted</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline">
          Reset to Default
        </Button>
        <Button>
          Save Workflow
        </Button>
      </div>
    </div>
  );
}