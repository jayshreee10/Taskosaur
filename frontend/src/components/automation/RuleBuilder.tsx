'use client';

import React, { useState } from 'react';
import { AutomationRule, RuleTrigger, RuleCondition, RuleAction } from './AutomationRules';
import { TaskType, TaskPriority, StatusCategory } from '@/types/tasks';
import { Button } from '@/components/ui';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import '@/app/globals.css';

interface RuleBuilderProps {
  rule: AutomationRule | null;
  projectId: string;
  onSave: (rule: Partial<AutomationRule>) => void;
  onCancel: () => void;
}

export default function RuleBuilder({ rule, projectId, onSave, onCancel }: RuleBuilderProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    isActive: rule?.isActive ?? true,
    trigger: rule?.trigger || { type: 'task_created' as const },
    conditions: rule?.conditions || [],
    actions: rule?.actions || []
  });

  const [currentStep, setCurrentStep] = useState(1);

  const triggerOptions = [
    { value: 'task_created', label: 'Task Created', description: 'When a new task is created' },
    { value: 'task_updated', label: 'Task Updated', description: 'When a task is updated' },
    { value: 'status_changed', label: 'Status Changed', description: 'When task status changes' },
    { value: 'due_date_approaching', label: 'Due Date Approaching', description: 'When task due date is near' },
    { value: 'schedule', label: 'Schedule', description: 'Run on a scheduled basis' }
  ];

  const conditionFields = [
    { value: 'assignee', label: 'Assignee' },
    { value: 'reporter', label: 'Reporter' },
    { value: 'priority', label: 'Priority' },
    { value: 'type', label: 'Type' },
    { value: 'status', label: 'Status' },
    { value: 'labels', label: 'Labels' },
    { value: 'due_date', label: 'Due Date' }
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' }
  ];

  const actionTypes = [
    { value: 'assign_user', label: 'Assign User', description: 'Assign task to a specific user' },
    { value: 'change_status', label: 'Change Status', description: 'Change task status' },
    { value: 'add_label', label: 'Add Label', description: 'Add a label to the task' },
    { value: 'remove_label', label: 'Remove Label', description: 'Remove a label from the task' },
    { value: 'set_priority', label: 'Set Priority', description: 'Set task priority' },
    { value: 'add_comment', label: 'Add Comment', description: 'Add a comment to the task' },
    { value: 'send_notification', label: 'Send Notification', description: 'Send notification to users' },
    { value: 'create_subtask', label: 'Create Subtask', description: 'Create a subtask' }
  ];

  const handleAddCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        field: 'priority',
        operator: 'equals',
        value: ''
      }]
    }));
  };

  const handleUpdateCondition = (index: number, condition: Partial<RuleCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) => 
        i === index ? { ...cond, ...condition } : cond
      )
    }));
  };

  const handleRemoveCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const handleAddAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, {
        type: 'assign_user',
        value: ''
      }]
    }));
  };

  const handleUpdateAction = (index: number, action: Partial<RuleAction>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((act, i) => 
        i === index ? { ...act, ...action } : act
      )
    }));
  };

  const handleRemoveAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const renderConditionValue = (condition: RuleCondition, index: number) => {
    if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
      return null;
    }

    switch (condition.field) {
      case 'priority':
        return (
          <div className="w-full">
            <Select value={condition.value as string} onValueChange={(value) => handleUpdateCondition(index, { value })}>
              <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground">
                <SelectItem value="LOWEST">Lowest</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="HIGHEST">Highest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'type':
        return (
          <div className="w-full">
            <Select value={condition.value as string} onValueChange={(value) => handleUpdateCondition(index, { value })}>
              <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground">
                <SelectItem value="TASK">Task</SelectItem>
                <SelectItem value="BUG">Bug</SelectItem>
                <SelectItem value="EPIC">Epic</SelectItem>
                <SelectItem value="STORY">Story</SelectItem>
                <SelectItem value="SUBTASK">Subtask</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'due_date':
        return (
          <Input
            type="number"
            value={condition.value as string}
            onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
            placeholder="Days"
            className="w-full bg-background text-foreground border border-border rounded-md"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={condition.value as string}
            onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
            placeholder="Value"
            className="w-full bg-background text-foreground border border-border rounded-md"
          />
        );
    }
  };

  const renderActionValue = (action: RuleAction, index: number) => {
    switch (action.type) {
      case 'assign_user':
        return (
          <div className="w-full">
            <Select value={action.value as string} onValueChange={(value) => handleUpdateAction(index, { value })}>
              <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground">
                <SelectItem value="user-1">John Doe</SelectItem>
                <SelectItem value="user-2">Jane Smith</SelectItem>
                <SelectItem value="user-3">Alice Johnson</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'set_priority':
        return (
          <div className="w-full">
            <Select value={action.value as string} onValueChange={(value) => handleUpdateAction(index, { value })}>
              <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground">
                <SelectItem value="LOWEST">Lowest</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="HIGHEST">Highest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'change_status':
        return (
          <div className="w-full">
            <Select value={action.value as string} onValueChange={(value) => handleUpdateAction(index, { value })}>
              <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground">
                <SelectItem value="status-1">To Do</SelectItem>
                <SelectItem value="status-2">In Progress</SelectItem>
                <SelectItem value="status-3">Review</SelectItem>
                <SelectItem value="status-4">Testing</SelectItem>
                <SelectItem value="status-5">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'send_notification':
        return (
          <div className="space-y-2 w-full">
            <Select value={action.value as string} onValueChange={(value) => handleUpdateAction(index, { value })}>
              <SelectTrigger className="w-full bg-background text-foreground border border-border rounded-md">
                <SelectValue placeholder="Select Recipient" />
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground">
                <SelectItem value="assignee">Assignee</SelectItem>
                <SelectItem value="reporter">Reporter</SelectItem>
                <SelectItem value="user-1">John Doe</SelectItem>
                <SelectItem value="user-2">Jane Smith</SelectItem>
                <SelectItem value="user-3">Alice Johnson</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              value={action.message || ''}
              onChange={(e) => handleUpdateAction(index, { message: e.target.value })}
              placeholder="Notification message"
              className="w-full bg-background text-foreground border border-border rounded-md"
            />
          </div>
        );
      case 'add_comment':
        return (
          <Textarea
            value={action.value as string}
            onChange={(e) => handleUpdateAction(index, { value: e.target.value })}
            placeholder="Comment text"
            rows={3}
            className="w-full bg-background text-foreground border border-border rounded-md"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={action.value as string}
            onChange={(e) => handleUpdateAction(index, { value: e.target.value })}
            placeholder="Value"
            className="w-full bg-background text-foreground border border-border rounded-md"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {rule ? 'Edit Rule' : 'Create New Rule'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Set up automation to streamline your workflow
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`w-16 h-0.5 ${
                step < currentStep ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-center space-x-16 mb-8">
        <div className="text-center">
          <div className={`text-sm font-medium ${currentStep >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Basic Info
          </div>
        </div>
        <div className="text-center">
          <div className={`text-sm font-medium ${currentStep >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Trigger
          </div>
        </div>
        <div className="text-center">
          <div className={`text-sm font-medium ${currentStep >= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Conditions
          </div>
        </div>
        <div className="text-center">
          <div className={`text-sm font-medium ${currentStep >= 4 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Actions
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter rule name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe what this rule does"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enable this rule immediately
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Trigger */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Trigger
            </h3>
            
            <div className="space-y-3">
              {triggerOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.trigger.type === option.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    trigger: { type: option.value } as RuleTrigger 
                  }))}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.trigger.type === option.value}
                      onChange={() => {}}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.trigger.type === 'schedule' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={formData.trigger.schedule || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    trigger: { ...prev.trigger, schedule: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0 9 * * * (Daily at 9 AM)"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Use cron syntax to define when the rule should run
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Conditions */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conditions
              </h3>
              <Button variant="outline" onClick={handleAddCondition}>
                Add Condition
              </Button>
            </div>
            
            {formData.conditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No conditions added. The rule will trigger for all events.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="flex items-end space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Field
                      </label>
                      <select
                        value={condition.field}
                        onChange={(e) => handleUpdateCondition(index, { field: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {conditionFields.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Operator
                      </label>
                      <select
                        value={condition.operator}
                        onChange={(e) => handleUpdateCondition(index, { operator: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Value
                      </label>
                      {renderConditionValue(condition, index)}
                    </div>
                    
                    <button
                      onClick={() => handleRemoveCondition(index)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Actions */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Actions
              </h3>
              <Button variant="outline" onClick={handleAddAction}>
                Add Action
              </Button>
            </div>
            
            {formData.actions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No actions added. Add at least one action to make the rule functional.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.actions.map((action, index) => (
                  <div key={index} className="flex items-end space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Action Type
                      </label>
                      <select
                        value={action.type}
                        onChange={(e) => handleUpdateAction(index, { type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {actionTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Configuration
                      </label>
                      {renderActionValue(action, index)}
                    </div>
                    
                    <button
                      onClick={() => handleRemoveAction(index)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={currentStep === 4}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}