'use client';

import React, { useState } from 'react';
import { TaskStatus, StatusCategory } from '@/types/tasks';
import { Button } from '@/components/ui';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

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

interface StatusConfigurationProps {
  workflow: Workflow;
  onUpdateStatus: (statusId: string, updatedStatus: Partial<TaskStatus>) => void;
  onCreateStatus: (newStatus: Omit<TaskStatus, 'id'>) => void;
  onDeleteStatus: (statusId: string) => void;
}

export default function StatusConfiguration({ 
  workflow, 
  onUpdateStatus, 
  onCreateStatus, 
  onDeleteStatus 
}: StatusConfigurationProps) {
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<TaskStatus | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#64748b',
    category: StatusCategory.TODO,
    order: 1
  });

  const predefinedColors = [
    '#64748b', '#ef4444', '#f59e0b', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'
  ];

  const handleEdit = (status: TaskStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      description: status.description || '',
      color: status.color || '#64748b',
      category: status.category,
      order: status.order
    });
  };

  const handleSave = () => {
    if (!editingStatus) return;

    onUpdateStatus(editingStatus.id, {
      name: formData.name,
      description: formData.description,
      color: formData.color,
      category: formData.category,
      order: formData.order
    });

    setEditingStatus(null);
    resetForm();
  };

  const handleCreate = () => {
    const maxOrder = Math.max(...workflow.statuses.map(s => s.order), 0);
    
    onCreateStatus({
      name: formData.name,
      description: formData.description,
      color: formData.color,
      category: formData.category,
      order: maxOrder + 1,
      isDefault: false,
      workflowId: workflow.id
    });

    setShowCreateModal(false);
    resetForm();
  };

  const handleDelete = (status: TaskStatus) => {
    onDeleteStatus(status.id);
    setShowDeleteModal(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#64748b',
      category: StatusCategory.TODO,
      order: 1
    });
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

  const sortedStatuses = [...workflow.statuses].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Status Configuration
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Manage individual statuses for {workflow.name}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Add Status
        </Button>
      </div>

      {/* Status List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="col-span-3">Status</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Order</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedStatuses.map((status) => (
            <div key={status.id} className="px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {status.name}
                      </div>
                      {status.isDefault && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(status.category)}`}>
                    {status.category}
                  </span>
                </div>
                
                <div className="col-span-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {status.order}
                  </span>
                </div>
                
                <div className="col-span-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {status.description || 'No description'}
                  </p>
                </div>
                
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(status)}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {!status.isDefault && (
                      <button
                        onClick={() => setShowDeleteModal(status)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Status
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Status name"
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
                  placeholder="Status description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as StatusCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={StatusCategory.TODO}>To Do</option>
                  <option value={StatusCategory.IN_PROGRESS}>In Progress</option>
                  <option value={StatusCategory.DONE}>Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color *
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <div className="flex space-x-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order *
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingStatus(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Status
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Status name"
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
                  placeholder="Status description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as StatusCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={StatusCategory.TODO}>To Do</option>
                  <option value={StatusCategory.IN_PROGRESS}>In Progress</option>
                  <option value={StatusCategory.DONE}>Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color *
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <div className="flex space-x-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name.trim()}
              >
                Create Status
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={() => handleDelete(showDeleteModal)}
          title="Delete Status"
          message={`Are you sure you want to delete the status "${showDeleteModal.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
}