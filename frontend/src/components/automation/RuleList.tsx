'use client';

import React, { useState } from 'react';
import { AutomationRule } from './AutomationRules';
import { Button } from '@/components/ui';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

interface RuleListProps {
  rules: AutomationRule[];
  onEdit: (rule: AutomationRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string) => void;
}

export default function RuleList({ rules, onEdit, onDelete, onToggle }: RuleListProps) {
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null);

  const getTriggerLabel = (trigger: AutomationRule['trigger']) => {
    switch (trigger.type) {
      case 'task_created':
        return 'Task Created';
      case 'task_updated':
        return 'Task Updated';
      case 'status_changed':
        return 'Status Changed';
      case 'due_date_approaching':
        return 'Due Date Approaching';
      case 'schedule':
        return 'Scheduled';
      default:
        return trigger.type;
    }
  };

  const getTriggerIcon = (trigger: AutomationRule['trigger']) => {
    switch (trigger.type) {
      case 'task_created':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'task_updated':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'status_changed':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'due_date_approaching':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'schedule':
        return (
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getActionSummary = (actions: AutomationRule['actions']) => {
    if (actions.length === 0) return 'No actions';
    if (actions.length === 1) {
      const action = actions[0];
      switch (action.type) {
        case 'assign_user':
          return 'Assign to user';
        case 'change_status':
          return 'Change status';
        case 'add_label':
          return 'Add label';
        case 'remove_label':
          return 'Remove label';
        case 'set_priority':
          return 'Set priority';
        case 'add_comment':
          return 'Add comment';
        case 'send_notification':
          return 'Send notification';
        case 'create_subtask':
          return 'Create subtask';
        default:
          return action.type;
      }
    }
    return `${actions.length} actions`;
  };

  const formatLastRun = (lastRunAt?: string) => {
    if (!lastRunAt) return 'Never';
    
    const date = new Date(lastRunAt);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const handleDelete = (rule: AutomationRule) => {
    onDelete(rule.id);
    setRuleToDelete(null);
  };

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
            !rule.isActive ? 'opacity-75' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center space-x-2">
                  {getTriggerIcon(rule.trigger)}
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {getTriggerLabel(rule.trigger)}
                  </span>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  rule.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {rule.name}
              </h3>
              
              {rule.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {rule.description}
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Conditions:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {rule.conditions.length || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Actions:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {getActionSummary(rule.actions)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Last run:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {formatLastRun(rule.lastRunAt)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <UserAvatar
                user={rule.createdBy}
                size="sm"
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggle(rule.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    rule.isActive
                      ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                      : 'text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800'
                  }`}
                  title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                >
                  {rule.isActive ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M12 5v14m7-7H5" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => onEdit(rule)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="Edit rule"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setRuleToDelete(rule)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete rule"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Rule Details */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-500 dark:text-gray-400">
                  Created {new Date(rule.createdAt).toLocaleDateString()}
                </span>
                {rule.trigger.type === 'schedule' && rule.trigger.schedule && (
                  <span className="text-gray-500 dark:text-gray-400">
                    Schedule: {rule.trigger.schedule}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => onEdit(rule)}
                  className="text-xs"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      {ruleToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setRuleToDelete(null)}
          onConfirm={() => handleDelete(ruleToDelete)}
          title="Delete Automation Rule"
          message={`Are you sure you want to delete "${ruleToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
}