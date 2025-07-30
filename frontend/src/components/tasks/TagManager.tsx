'use client';

import { useState } from 'react';
import { Tag } from '@/types';
import { TagBadge } from '@/components/ui';

// Available colors for new tags
const availableColors = [
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Red', value: 'red' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Purple', value: 'purple' },
  { name: 'Indigo', value: 'indigo' },
  { name: 'Pink', value: 'pink' },
  { name: 'Gray', value: 'gray' },
];

interface TagManagerProps {
  taskId: string;
  initialTags: Tag[];
  onTagsUpdate?: (tags: Tag[]) => void;
}

export default function TagManager({ taskId, initialTags = [], onTagsUpdate }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    const newTag: Tag = {
      id: `temp-${Date.now()}`, // In a real app, the server would assign an ID
      name: newTagName.trim(),
      color: selectedColor,
    };

    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    setNewTagName('');
    setIsAdding(false);
    
    // In a real app, you would make an API call to add the tag to the task
    if (onTagsUpdate) {
      onTagsUpdate(updatedTags);
    }
  };

  const handleDeleteTag = (tagId: string) => {
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    setTags(updatedTags);
    
    // In a real app, you would make an API call to remove the tag from the task
    if (onTagsUpdate) {
      onTagsUpdate(updatedTags);
    }
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Tags
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1">
              <TagBadge 
                tag={tag.name}
                color={tag.color}
              />
              <button 
                onClick={() => handleDeleteTag(tag.id)}
                className="text-xs text-red-500 hover:text-red-700 ml-1"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tags</p>
        )}
      </div>

      {isAdding ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`w-5 h-5 rounded-full ${
                  selectedColor === color.value ? 'ring-2 ring-offset-2 ring-gray-500' : ''
                }`}
                style={{ 
                  backgroundColor: `var(--${color.value}-500)`,
                  // Fallback for when CSS variables are not available
                  background: color.value === 'blue' ? '#3b82f6' :
                             color.value === 'green' ? '#10b981' :
                             color.value === 'red' ? '#ef4444' :
                             color.value === 'yellow' ? '#f59e0b' :
                             color.value === 'purple' ? '#8b5cf6' :
                             color.value === 'indigo' ? '#6366f1' :
                             color.value === 'pink' ? '#ec4899' : '#6b7280'
                }}
                title={color.name}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddTag}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewTagName('');
              }}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            + Add tag
          </button>
        </div>
      )}
    </div>
  );
}