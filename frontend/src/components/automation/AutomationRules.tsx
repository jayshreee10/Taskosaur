'use client';

import React, { useState, useEffect } from 'react';

import RuleBuilder from './RuleBuilder';
import RuleList from './RuleList';
import {
  HiCpuChip,
  HiPlus,
  HiArrowDownTray,
  HiCheckCircle,
  HiBolt,
  HiClock,
  HiPlay
} from 'react-icons/hi2';

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
  projectId: string;
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleTrigger {
  type: 'task_created' | 'task_updated' | 'status_changed' | 'due_date_approaching' | 'schedule';
  schedule?: string; // cron expression for scheduled rules
}

export interface RuleCondition {
  field: 'assignee' | 'reporter' | 'priority' | 'type' | 'status' | 'labels' | 'due_date' | 'custom_field';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | string[];
}

export interface RuleAction {
  type: 'assign_user' | 'change_status' | 'add_label' | 'remove_label' | 'set_priority' | 'add_comment' | 'send_notification' | 'create_subtask';
  value: string | string[];
  message?: string;
}

interface AutomationRulesProps {
  projectId: string;
}

// Import shadcn UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  color = "amber" 
}: { 
  icon: any;
  value: number;
  label: string;
  color?: "amber" | "green" | "blue" | "purple" | "orange";
}) => {
  const colorClasses = {
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}> 
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="ml-4">
            <CardTitle className="text-xl font-semibold text-stone-900 dark:text-stone-100">
              {value}
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 dark:text-stone-400">
              {label}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default function AutomationRules({ projectId }: AutomationRulesProps) {

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'all'>('active');

  // Mock data
  const mockRules: AutomationRule[] = [
    {
      id: 'rule-1',
      name: 'Auto-assign urgent bugs',
      description: 'Automatically assign high priority bugs to the lead developer',
      isActive: true,
      trigger: {
        type: 'task_created'
      },
      conditions: [
        {
          field: 'type',
          operator: 'equals',
          value: 'BUG'
        },
        {
          field: 'priority',
          operator: 'equals',
          value: 'HIGH'
        }
      ],
      actions: [
        {
          type: 'assign_user',
          value: 'user-1'
        },
        {
          type: 'add_label',
          value: 'urgent'
        },
        {
          type: 'send_notification',
          value: 'user-1',
          message: 'New urgent bug assigned to you'
        }
      ],
      projectId,
      createdById: 'user-1',
      createdBy: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/api/placeholder/40/40'
      },
      lastRunAt: '2024-01-20T10:30:00Z',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-20T10:30:00Z'
    },
    {
      id: 'rule-2',
      name: 'Move to testing when ready',
      description: 'Automatically move tasks to testing when marked as resolved',
      isActive: true,
      trigger: {
        type: 'status_changed'
      },
      conditions: [
        {
          field: 'status',
          operator: 'equals',
          value: 'status-3'
        }
      ],
      actions: [
        {
          type: 'change_status',
          value: 'status-4'
        },
        {
          type: 'add_comment',
          value: 'Automatically moved to testing',
          message: 'Task automatically moved to testing phase'
        }
      ],
      projectId,
      createdById: 'user-2',
      createdBy: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: '/api/placeholder/40/40'
      },
      lastRunAt: '2024-01-19T14:15:00Z',
      createdAt: '2024-01-12T11:00:00Z',
      updatedAt: '2024-01-19T14:15:00Z'
    },
    {
      id: 'rule-3',
      name: 'Due date reminder',
      description: 'Send reminder notifications for tasks due in 2 days',
      isActive: false,
      trigger: {
        type: 'schedule',
        schedule: '0 9 * * *' // Daily at 9 AM
      },
      conditions: [
        {
          field: 'due_date',
          operator: 'less_than',
          value: '2'
        }
      ],
      actions: [
        {
          type: 'send_notification',
          value: 'assignee',
          message: 'Task due in 2 days'
        }
      ],
      projectId,
      createdById: 'user-3',
      createdBy: {
        id: 'user-3',
        firstName: 'Alice',
        lastName: 'Johnson',
        avatar: '/api/placeholder/40/40'
      },
      createdAt: '2024-01-18T16:00:00Z',
      updatedAt: '2024-01-18T16:00:00Z'
    }
  ];

  useEffect(() => {
    const loadRules = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setRules(mockRules);
      } catch (error) {
        console.error('Error loading automation rules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRules();
  }, [projectId]);

  const handleCreateRule = () => {
    setSelectedRule(null);
    setShowRuleBuilder(true);
  };

  const handleEditRule = (rule: AutomationRule) => {
    setSelectedRule(rule);
    setShowRuleBuilder(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    console.log('Deleting rule:', ruleId);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
    console.log('Toggling rule:', ruleId);
  };

  const handleSaveRule = (ruleData: Partial<AutomationRule>) => {
    if (selectedRule) {
      // Update existing rule
      setRules(prev => prev.map(rule => 
        rule.id === selectedRule.id 
          ? { ...rule, ...ruleData, updatedAt: new Date().toISOString() }
          : rule
      ));
    } else {
      // Create new rule
      const newRule: AutomationRule = {
        id: `rule-${Date.now()}`,
        ...ruleData,
        projectId,
        createdById: 'user-1',
        createdBy: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          avatar: '/api/placeholder/40/40'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as AutomationRule;
      
      setRules(prev => [...prev, newRule]);
    }
    
    setShowRuleBuilder(false);
    setSelectedRule(null);
  };

  const getFilteredRules = () => {
    switch (activeTab) {
      case 'active':
        return rules.filter(rule => rule.isActive);
      case 'inactive':
        return rules.filter(rule => !rule.isActive);
      default:
        return rules;
    }
  };

  const getTabCount = (tab: 'active' | 'inactive' | 'all') => {
    switch (tab) {
      case 'active':
        return rules.filter(rule => rule.isActive).length;
      case 'inactive':
        return rules.filter(rule => !rule.isActive).length;
      default:
        return rules.length;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-200 border-t-amber-600"></div>
        <span className="ml-2 text-stone-600 dark:text-stone-400">Loading automation rules...</span>
      </div>
    );
  }

  if (showRuleBuilder) {
    return (
      <RuleBuilder
        rule={selectedRule}
        projectId={projectId}
        onSave={handleSaveRule}
        onCancel={() => {
          setShowRuleBuilder(false);
          setSelectedRule(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <HiCpuChip size={20} className="text-amber-600" />
            Automation Rules
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Automate repetitive tasks and workflows
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex items-center gap-2">
            <HiArrowDownTray size={16} />
            Import Rules
          </Button>
          <Button onClick={handleCreateRule} className="flex items-center gap-2">
            <HiPlus size={16} />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={HiCheckCircle}
          value={rules.filter(rule => rule.isActive).length}
          label="Active Rules"
          color="green"
        />
        <StatCard
          icon={HiBolt}
          value={rules.length}
          label="Total Rules"
          color="blue"
        />
        <StatCard
          icon={HiClock}
          value={rules.filter(rule => rule.trigger.type === 'schedule').length}
          label="Scheduled Rules"
          color="purple"
        />
        <StatCard
          icon={HiPlay}
          value={rules.filter(rule => rule.lastRunAt).length}
          label="Recently Executed"
          color="orange"
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex gap-1">
          {(['active', 'inactive', 'all'] as const).map(tab => {
            const isActive = activeTab === tab;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-400 text-xs px-2 py-0.5 rounded-full">
                  {getTabCount(tab)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules List */}
      <RuleList
        rules={getFilteredRules()}
        onEdit={handleEditRule}
        onDelete={handleDeleteRule}
        onToggle={handleToggleRule}
      />

      {/* Empty State */}
      {getFilteredRules().length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <HiBolt className="mx-auto h-12 w-12 text-stone-400 mb-4" />
            <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">
              No {activeTab === 'all' ? '' : activeTab} rules
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
              {activeTab === 'all' 
                ? 'Get started by creating your first automation rule.'
                : `No ${activeTab} automation rules found.`
              }
            </p>
            {activeTab === 'all' && (
              <Button onClick={handleCreateRule} className="flex items-center gap-2">
                <HiPlus size={16} />
                Create Rule
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}