'use client';

import { useState } from 'react';
import { Tag } from '@/types';
import TagManager from './TagManager';
import { updateTaskTags } from '@/utils/apiUtils';

interface TagManagerWrapperProps {
  taskId: string;
  initialTags: Tag[];
}

export default function TagManagerWrapper({ taskId, initialTags }: TagManagerWrapperProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Update the task tags via API
  const handleTagsUpdate = async (updatedTags: Tag[]) => {
    setIsUpdating(true);
    setTags(updatedTags);
    
    try {
      // Call the API to persist the changes
      await updateTaskTags(taskId, updatedTags);

    } catch (error) {
      console.error('Failed to update tags:', error);
      // In a real app, you might want to show an error message
      // and potentially revert the UI state
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TagManager
      taskId={taskId}
      initialTags={tags}
      onTagsUpdate={handleTagsUpdate}
    />
  );
}