"use client";

import React, { useState, useEffect } from 'react';
import { useTask } from '../../contexts/task-context';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import {
  HiChatBubbleLeftRight,
  HiPencilSquare,
  HiTrash,
  HiPlus
} from 'react-icons/hi2';

interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  parentCommentId?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

interface TaskCommentsProps {
  taskId: string;
  onCommentAdded?: (comment: Comment) => void;
  onCommentUpdated?: (commentId: string, content: string) => void;
  onCommentDeleted?: (commentId: string) => void;
}

// UI Components matching your theme
const Button = ({ 
  children, 
  variant = "primary", 
  size = "sm",
  className = "",
  disabled = false,
  ...props 
}: { 
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) => {
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white",
    secondary: "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-600",
    danger: "bg-red-600 hover:bg-red-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm"
  };
  
  return (
    <button 
      className={`rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Textarea = ({ className = "", ...props }: { className?: string; [key: string]: any }) => (
  <textarea
    className={`w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:bg-stone-700 dark:text-white transition-colors resize-none text-sm ${className}`}
    {...props}
  />
);

const UserAvatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  return (
    <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
      {initials}
    </div>
  );
};

export default function TaskComments({
  taskId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
}: TaskCommentsProps) {
  const { 
    getTaskComments, 
    createTaskComment, 
    updateTaskComment, 
    deleteTaskComment, 
    loading, 
    error 
  } = useTask();

  // Global fetch prevention hook
  const {
    shouldPreventFetch,
    markFetchStart,
    markFetchComplete,
    markFetchError,
    getCachedData
  } = useGlobalFetchPrevention();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Get current user from localStorage
  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const userString = localStorage.getItem('user');
        if (userString) {
          const user: User = JSON.parse(userString);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    };

    getUserFromStorage();
  }, []);

  // Fetch comments when component mounts or taskId changes
  useEffect(() => {
    if (!taskId) return;

    const fetchKey = `task-comments-${taskId}`;
    
    // Check if we should prevent this fetch
    if (shouldPreventFetch(fetchKey)) {
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setComments(cachedData);
        return;
      }
    }

    const fetchComments = async () => {
      markFetchStart(fetchKey);
      
      try {

        const taskComments = await getTaskComments(taskId);
        // Transform the comments to include author display info
        const transformedComments = taskComments.map((comment: any) => ({
          ...comment,
          author: {
            id: comment.authorId,
            name: `User ${comment.authorId.slice(0, 8)}`, // Fallback name since we don't have user lookup
            avatar: comment.authorId.slice(0, 2).toUpperCase()
          }
        }));
        setComments(transformedComments);
        
        // Cache the successful result
        markFetchComplete(fetchKey, transformedComments);

      } catch (error) {
        console.error('❌ [TASK_COMMENTS] Failed to fetch comments:', error);
        markFetchError(fetchKey);
      }
    };

    fetchComments();
  }, [taskId]); // Only depend on task ID

  // Refresh comments function for real-time updates
  const refreshComments = async () => {
    try {
      const taskComments = await getTaskComments(taskId);
      const transformedComments = taskComments.map((comment: any) => ({
        ...comment,
        author: {
          id: comment.authorId,
          name: `User ${comment.authorId.slice(0, 8)}`,
          avatar: comment.authorId.slice(0, 2).toUpperCase()
        }
      }));
      setComments(transformedComments);
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || !currentUser) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        content: newComment.trim(),
        taskId,
        authorId: currentUser.id,
      };

      const createdComment = await createTaskComment(commentData);
      
      // Refresh comments to get the latest data
      await refreshComments();
      setNewComment("");
      
      // Call the callback if provided
      onCommentAdded?.(createdComment);
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim() || !currentUser) return;

    try {
      const updatedComment = await updateTaskComment(commentId, currentUser.id, {
        content: editingContent.trim()
      });

      // Refresh comments to get the latest data
      await refreshComments();
      
      setEditingCommentId(null);
      setEditingContent("");
      
      // Call the callback if provided
      onCommentUpdated?.(commentId, editingContent.trim());
    } catch (error) {
      console.error("Failed to edit comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }

    if (!currentUser) return;

    try {
      await deleteTaskComment(commentId, currentUser.id);

      // Refresh comments to get the latest data
      await refreshComments();
      
      // Call the callback if provided
      onCommentDeleted?.(commentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Just now';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
      
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center text-stone-500 dark:text-stone-400 p-4 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
        Please log in to view and add comments.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
        <HiChatBubbleLeftRight size={16} className="text-amber-600" />
        Comments ({comments.length})
      </h2>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-stone-500 dark:text-stone-400 py-6 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-200 border-t-amber-600"></div>
            <span className="text-sm">Loading comments...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-600 dark:text-red-400 py-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <span className="text-sm">Error: {error}</span>
        </div>
      )}
      
      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <UserAvatar name={comment.author?.name || `User ${comment.authorId.slice(0, 8)}`} />
            <div className="flex-1 min-w-0">
              <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {comment.author?.name || `User ${comment.authorId.slice(0, 8)}`}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                {editingCommentId === comment.id ? (
                  <div>
                    <Textarea
                      value={editingContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingContent(e.target.value)}
                      rows={3}
                      className="mb-3"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={handleCancelEdit}
                        variant="secondary"
                        size="sm"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSaveEdit(comment.id)}
                        size="sm"
                        disabled={loading || !editingContent.trim()}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {comment.content}
                  </p>
                )}
              </div>
              {editingCommentId !== comment.id && comment.authorId === currentUser.id && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleEditComment(comment.id, comment.content)}
                    className="text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                    disabled={loading}
                  >
                    <HiPencilSquare size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                    disabled={loading}
                  >
                    <HiTrash size={12} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {!loading && comments.length === 0 && (
          <div className="text-center text-stone-500 dark:text-stone-400 py-8 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
            <HiChatBubbleLeftRight size={32} className="mx-auto mb-2 text-stone-400" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="mt-6">
        <form onSubmit={handleAddComment} className="flex gap-3">
          <UserAvatar name={`${currentUser.firstName} ${currentUser.lastName}`} />
          <div className="flex-1 min-w-0">
            <Textarea
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              rows={3}
              placeholder="Add a comment..."
              disabled={isSubmitting || loading}
              className="mb-3"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting || loading}
                size="md"
                className="flex items-center gap-2"
              >
                <HiPlus size={14} />
                {isSubmitting ? "Adding..." : "Comment"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}