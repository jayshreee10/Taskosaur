"use client";

import React, { useState, useEffect } from 'react';
import { useTask } from '../../contexts/task-context';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import {
  HiChatBubbleLeftRight,
  HiPencilSquare,
  HiTrash,
  HiPlus,
  HiExclamationTriangle
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
        markFetchComplete(fetchKey, transformedComments);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        markFetchError(fetchKey);
      }
    };

    fetchComments();
  }, [taskId]);

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
      
      await refreshComments();
      setNewComment("");
      
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

      await refreshComments();
      
      setEditingCommentId(null);
      setEditingContent("");
      
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
      await refreshComments();
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
      <Alert className="bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]">
        <HiExclamationTriangle className="h-4 w-4" />
        <AlertDescription>
          Please log in to view and add comments.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <HiChatBubbleLeftRight className="w-5 h-5 text-[var(--primary)]" />
        <h3 className="text-md font-semibold text-[var(--foreground)]">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-6 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-[var(--muted-foreground)]">Loading comments...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
          <HiExclamationTriangle className="h-4 w-4" />
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      )}
      
      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <UserAvatar
              user={{
                firstName: comment.author?.name?.split(' ')[0] || 'User',
                lastName: comment.author?.name?.split(' ')[1] || '',
                avatar: comment.author?.avatar,
              }}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="bg-[var(--muted)]/30 p-4 rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-[var(--foreground)]">
                    {comment.author?.name || `User ${comment.authorId.slice(0, 8)}`}
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                {editingCommentId === comment.id ? (
                  <div>
                    <Textarea
                      value={editingContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingContent(e.target.value)}
                      rows={3}
                      className="mb-3 border-input bg-background text-[var(--foreground)] resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="h-8 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSaveEdit(comment.id)}
                        size="sm"
                        disabled={loading || !editingContent.trim()}
                        className="h-8 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">
                    {comment.content}
                  </p>
                )}
              </div>
              {editingCommentId !== comment.id && comment.authorId === currentUser.id && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleEditComment(comment.id, comment.content)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
                    disabled={loading}
                  >
                    <HiPencilSquare className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] flex items-center gap-1 transition-colors"
                    disabled={loading}
                  >
                    <HiTrash className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {!loading && comments.length === 0 && (
          <div className="text-center py-8 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
            <HiChatBubbleLeftRight className="w-8 h-8 mx-auto mb-3 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="mt-6">
        <form onSubmit={handleAddComment} className="flex gap-3">
          <UserAvatar
            user={{
              firstName: currentUser.firstName || '',
              lastName: currentUser.lastName || '',
              avatar: currentUser.avatar,
            }}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <Textarea
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              rows={3}
              placeholder="Add a comment..."
              disabled={isSubmitting || loading}
              className="mb-3 border-input bg-background text-[var(--foreground)] resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting || loading}
                size="sm"
                className="h-9 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] flex items-center gap-2"
              >
                <HiPlus className="w-4 h-4" />
                {isSubmitting ? "Adding..." : "Comment"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}