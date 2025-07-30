'use client';

import React, { useState, useEffect } from 'react';
import { TaskStatus, StatusCategory } from '@/types/tasks';
import WorkflowEditor from './WorkflowEditor';
import StatusConfiguration from './StatusConfiguration';
import {
  HiArrowPath,
  HiPlus,
  HiCog6Tooth,
  HiChartBarSquare,
  HiEye,
  HiPencilSquare,
  HiTrash,
  HiCheck,
  HiChevronRight
} from 'react-icons/hi2';

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

interface WorkflowManagerProps {
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
import { Badge } from '@/components/ui/badge';

export default function WorkflowManager({ projectId }: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'statuses'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data
  const mockWorkflows: Workflow[] = [
    {
      id: 'workflow-1',
      name: 'Default Workflow',
      description: 'Standard workflow for all tasks',
      projectId,
      isDefault: true,
      statuses: [
        {
          id: 'status-1',
          name: 'To Do',
          description: 'Tasks that need to be started',
          color: '#64748b',
          category: StatusCategory.TODO,
          order: 1,
          isDefault: true,
          workflowId: 'workflow-1'
        },
        {
          id: 'status-2',
          name: 'In Progress',
          description: 'Tasks currently being worked on',
          color: '#f59e0b',
          category: StatusCategory.IN_PROGRESS,
          order: 2,
          isDefault: false,
          workflowId: 'workflow-1'
        },
        {
          id: 'status-3',
          name: 'Code Review',
          description: 'Tasks awaiting code review',
          color: '#3b82f6',
          category: StatusCategory.IN_PROGRESS,
          order: 3,
          isDefault: false,
          workflowId: 'workflow-1'
        },
        {
          id: 'status-4',
          name: 'Testing',
          description: 'Tasks being tested',
          color: '#8b5cf6',
          category: StatusCategory.IN_PROGRESS,
          order: 4,
          isDefault: false,
          workflowId: 'workflow-1'
        },
        {
          id: 'status-5',
          name: 'Done',
          description: 'Completed tasks',
          color: '#10b981',
          category: StatusCategory.DONE,
          order: 5,
          isDefault: false,
          workflowId: 'workflow-1'
        }
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'workflow-2',
      name: 'Bug Workflow',
      description: 'Specialized workflow for bug tracking',
      projectId,
      isDefault: false,
      statuses: [
        {
          id: 'status-6',
          name: 'Reported',
          description: 'Bug has been reported',
          color: '#ef4444',
          category: StatusCategory.TODO,
          order: 1,
          isDefault: true,
          workflowId: 'workflow-2'
        },
        {
          id: 'status-7',
          name: 'Confirmed',
          description: 'Bug has been confirmed',
          color: '#f59e0b',
          category: StatusCategory.TODO,
          order: 2,
          isDefault: false,
          workflowId: 'workflow-2'
        },
        {
          id: 'status-8',
          name: 'Fixing',
          description: 'Bug is being fixed',
          color: '#3b82f6',
          category: StatusCategory.IN_PROGRESS,
          order: 3,
          isDefault: false,
          workflowId: 'workflow-2'
        },
        {
          id: 'status-9',
          name: 'Verification',
          description: 'Fix is being verified',
          color: '#8b5cf6',
          category: StatusCategory.IN_PROGRESS,
          order: 4,
          isDefault: false,
          workflowId: 'workflow-2'
        },
        {
          id: 'status-10',
          name: 'Resolved',
          description: 'Bug has been resolved',
          color: '#10b981',
          category: StatusCategory.DONE,
          order: 5,
          isDefault: false,
          workflowId: 'workflow-2'
        }
      ],
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z'
    }
  ];

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setWorkflows(mockWorkflows);
        setSelectedWorkflow(mockWorkflows[0]);
      } catch (error) {
        console.error('Error loading workflows:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflows();
  }, [projectId]);

  const handleCreateWorkflow = () => {
    setShowCreateModal(true);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    if (workflows.find(w => w.id === workflowId)?.isDefault) {
      alert('Cannot delete default workflow');
      return;
    }
    
    setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(workflows.find(w => w.isDefault) || workflows[0]);
    }
    console.log('Deleting workflow:', workflowId);
  };

  const handleSetDefault = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => ({
      ...w,
      isDefault: w.id === workflowId
    })));
    console.log('Setting default workflow:', workflowId);
  };

  const handleUpdateWorkflow = (updatedWorkflow: Workflow) => {
    setWorkflows(prev => prev.map(w => 
      w.id === updatedWorkflow.id ? updatedWorkflow : w
    ));
    setSelectedWorkflow(updatedWorkflow);
    console.log('Updated workflow:', updatedWorkflow);
  };

  const handleUpdateStatus = (statusId: string, updatedStatus: Partial<TaskStatus>) => {
    if (!selectedWorkflow) return;

    const updatedWorkflow = {
      ...selectedWorkflow,
      statuses: selectedWorkflow.statuses.map(status => 
        status.id === statusId ? { ...status, ...updatedStatus } : status
      )
    };

    handleUpdateWorkflow(updatedWorkflow);
  };

  const handleCreateStatus = (newStatus: Omit<TaskStatus, 'id'>) => {
    if (!selectedWorkflow) return;

    const status: TaskStatus = {
      ...newStatus,
      id: `status-${Date.now()}`,
      workflowId: selectedWorkflow.id
    };

    const updatedWorkflow = {
      ...selectedWorkflow,
      statuses: [...selectedWorkflow.statuses, status]
    };

    handleUpdateWorkflow(updatedWorkflow);
  };

  const handleDeleteStatus = (statusId: string) => {
    if (!selectedWorkflow) return;

    const status = selectedWorkflow.statuses.find(s => s.id === statusId);
    if (status?.isDefault) {
      alert('Cannot delete default status');
      return;
    }

    const updatedWorkflow = {
      ...selectedWorkflow,
      statuses: selectedWorkflow.statuses.filter(s => s.id !== statusId)
    };

    handleUpdateWorkflow(updatedWorkflow);
  };

  const getCategoryVariant = (category: StatusCategory) => {
    switch (category) {
      case StatusCategory.TODO:
        return 'default';
      case StatusCategory.IN_PROGRESS:
        return 'secondary';
      case StatusCategory.DONE:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiEye },
    { id: 'editor', label: 'Workflow Editor', icon: HiPencilSquare },
    { id: 'statuses', label: 'Status Configuration', icon: HiCog6Tooth }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-200 border-t-amber-600"></div>
        <span className="ml-2 text-stone-600 dark:text-stone-400">Loading workflows...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <HiArrowPath size={20} className="text-amber-600" />
            Workflow Management
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Manage workflows and task statuses for your project
          </p>
        </div>
        <Button onClick={handleCreateWorkflow} className="flex items-center gap-2">
          <HiPlus size={16} />
          Create Workflow
        </Button>
      </div>

      {/* Workflow List & Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
              Workflows
            </h3>
            <div className="space-y-2">
              {workflows.map(workflow => (
                <div
                  key={workflow.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {workflow.name}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {workflow.statuses.length} statuses
                      </p>
                    </div>
                    {workflow.isDefault && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <HiCheck size={10} />
                        Default
                      </Badge>
                    )}
                  </div>
                  {workflow.description && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      {workflow.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedWorkflow && (
            <>
              {/* Tab Navigation */}
              <div className="mb-6">
                <div className="flex gap-1">
                  {tabs.map(tab => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <IconComponent size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Workflow Info */}
                    <Card className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-2">
                            {selectedWorkflow.name}
                          </h3>
                          <p className="text-sm text-stone-600 dark:text-stone-400">
                            {selectedWorkflow.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!selectedWorkflow.isDefault && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSetDefault(selectedWorkflow.id)}
                            >
                              Set as Default
                            </Button>
                          )}
                          {!selectedWorkflow.isDefault && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                              className="flex items-center gap-1"
                            >
                              <HiTrash size={12} />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Status Flow */}
                    <Card className="p-6">
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
                        Status Flow
                      </h3>
                      <div className="flex flex-wrap items-center gap-4">
                        {selectedWorkflow.statuses
                          .sort((a, b) => a.order - b.order)
                          .map((status, index) => (
                            <React.Fragment key={status.id}>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full border border-stone-200 dark:border-stone-700"
                                  style={{ backgroundColor: status.color }}
                                />
                                <div>
                                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                    {status.name}
                                  </div>
                                  <Badge variant={getCategoryVariant(status.category)} className="mt-1">
                                    {status.category}
                                  </Badge>
                                </div>
                              </div>
                              {index < selectedWorkflow.statuses.length - 1 && (
                                <HiChevronRight className="w-4 h-4 text-stone-400" />
                              )}
                            </React.Fragment>
                          ))}
                      </div>
                    </Card>

                    {/* Statistics */}
                    <Card className="p-6">
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                        <HiChartBarSquare size={16} className="text-amber-600" />
                        Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
                          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {selectedWorkflow.statuses.length}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                            Total Statuses
                          </div>
                        </div>
                        <div className="text-center p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
                          <div className="text-xl font-bold text-stone-600 dark:text-stone-400">
                            {selectedWorkflow.statuses.filter(s => s.category === StatusCategory.TODO).length}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                            To Do
                          </div>
                        </div>
                        <div className="text-center p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {selectedWorkflow.statuses.filter(s => s.category === StatusCategory.IN_PROGRESS).length}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                            In Progress
                          </div>
                        </div>
                        <div className="text-center p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {selectedWorkflow.statuses.filter(s => s.category === StatusCategory.DONE).length}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                            Done
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'editor' && (
                  <WorkflowEditor
                    workflow={selectedWorkflow}
                    onUpdate={handleUpdateWorkflow}
                  />
                )}

                {activeTab === 'statuses' && (
                  <StatusConfiguration
                    workflow={selectedWorkflow}
                    onUpdateStatus={handleUpdateStatus}
                    onCreateStatus={handleCreateStatus}
                    onDeleteStatus={handleDeleteStatus}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}