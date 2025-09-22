import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from "sonner";
import { useTask } from '../../contexts/task-context';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import {
  HiChatBubbleLeftRight,
  HiExclamationTriangle,
  HiClock,
  HiPencil,
  HiTrash
} from 'react-icons/hi2';
import { TaskComment, User } from '@/types';
import ActionButton from '../common/ActionButton';
import ConfirmationModal from '../modals/ConfirmationModal';

interface TaskCommentsProps {
  taskId: string;
  onCommentAdded?: (comment: TaskComment) => void;
  onCommentUpdated?: (commentId: string, content: string) => void;
  onCommentDeleted?: (commentId: string) => void;
  onTaskRefetch?: () => void;
  hasAccess?: boolean;
}

interface CommentWithAuthor extends TaskComment {
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

const CommentItem = React.memo(({
  comment,
  currentUser,
  onEdit,
  onDelete,
  formatTimestamp
}: {
  comment: CommentWithAuthor;
  currentUser: User;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  formatTimestamp: (createdAt: string, updatedAt: string) => { 
    text: string; 
    isEdited: boolean; 
    fullDate: string 
  };
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timestamp = useMemo(() => 
    formatTimestamp(comment.createdAt, comment.updatedAt), 
    [comment.createdAt, comment.updatedAt, formatTimestamp]
  );
  
  const canEdit = comment.authorId === currentUser.id;
  const displayName = useMemo(() => {
    if (comment.author?.firstName || comment.author?.lastName) {
      return `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim();
    }
    if (comment.author?.email) {
      return comment.author.email.split('@')[0];
    }
    return `User ${comment.author?.id?.slice(0, 8) || 'Unknown'}`;
  }, [comment.author]);

  const avatarProps = useMemo(() => ({
    firstName: comment.author?.firstName || '',
    lastName: comment.author?.lastName || '',
    avatar: comment.author?.avatar,
  }), [comment.author]);

  return (
    <div 
      className="group" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-2  items-start">
        <div className="flex-shrink-0 mt-1">
          <UserAvatar user={avatarProps} size="xs" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 pb-1">
            <div className="flex-1">
              <div className="rounded-xl inline-block">
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center ">
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        {displayName}
                      </span>
                      {timestamp.isEdited && (
                        <span className="text-[12px] text-[var(--muted-foreground)]">
                          (edited)
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] capitalize text-[var(--foreground)] leading-relaxed whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Meta info row */}
              <div className="flex items-center gap-1 text-[12px] text-[var(--muted-foreground)]">
                <HiClock className="size-2.5" />
                <span 
                  className="cursor-default"
                  title={timestamp.fullDate}
                >
                  {timestamp.text}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            {canEdit && (
              <div 
                className={`flex items-center gap-1 transition-opacity ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button
                  onClick={() => onEdit(comment.id, comment.content)}
                  className="p-1.5 text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] hover:bg-[var(--muted)]/30 rounded-full transition-colors"
                  title="Edit comment"
                >
                  <HiPencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="p-1.5 text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--destructive)] hover:bg-[var(--muted)]/30 rounded-full transition-colors"
                  title="Delete comment"
                >
                  <HiTrash className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CommentItem.displayName = 'CommentItem';

const CommentEditForm = ({
  comment,
  onSave,
  onCancel
}: {
  comment: CommentWithAuthor;
  onSave: (commentId: string, content: string) => void;
  onCancel: () => void;
}) => {
  const [editingContent, setEditingContent] = useState(comment.content);

  return (
    <div className="flex gap-2 py-2">
      <div className="flex-shrink-0 mt-1">
        <UserAvatar
          user={{
            firstName: comment.author?.firstName || '',
            lastName: comment.author?.lastName || '',
            avatar: comment.author?.avatar,
          }}
          size="xs"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="space-y-2">
          <Textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            rows={2}
            className=" text-sm border-[var(--input)] bg-[var(--background)]"
            placeholder="Edit your comment..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <ActionButton
              variant="outline"
              secondary
              onClick={onCancel}
              
            >
              Cancel
            </ActionButton>
            <ActionButton
              primary
              onClick={() => onSave(comment.id, editingContent)}
              disabled={!editingContent.trim()}
             
            >
              Save
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TaskComments({
  taskId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  onTaskRefetch,
  hasAccess = false
}: TaskCommentsProps) {
  const { 
    getTaskComments, 
    createTaskComment, 
    updateTaskComment, 
    deleteTaskComment,
  } = useTask();

  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingComments, setLoadingComments] = useState(true);

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

  // Format timestamp with smart logic for created vs updated
  const formatTimestamp = useCallback((createdAt: string, updatedAt: string) => {
    if (!createdAt) return { text: 'Unknown time', isEdited: false, fullDate: '' };
    
    try {
      const created = new Date(createdAt);
      const updated = new Date(updatedAt);
      const now = new Date();
      
      // If created and updated are the same (within 1 second), show "commented"
      const timeDiff = Math.abs(updated.getTime() - created.getTime());
      const isOriginalComment = timeDiff < 1000;
      
      const timeToUse = isOriginalComment ? created : updated;
      const action = isOriginalComment ? 'commented' : 'updated';
      
      // Calculate time difference
      const diffInMs = now.getTime() - timeToUse.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      let timeAgo;
      if (diffInMinutes < 1) {
        timeAgo = 'just now';
      } else if (diffInMinutes < 60) {
        timeAgo = `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        timeAgo = `${diffInHours}h ago`;
      } else if (diffInDays < 7) {
        timeAgo = `${diffInDays}d ago`;
      } else {
        timeAgo = timeToUse.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: timeToUse.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
      
      return {
        text: `${action} ${timeAgo}`,
        isEdited: !isOriginalComment,
        fullDate: timeToUse.toLocaleString()
      };
    } catch {
      return { text: 'Unknown time', isEdited: false, fullDate: '' };
    }
  }, []);

  // Fetch comments when component mounts or taskId changes
  useEffect(() => {
    if (!taskId) return;

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const taskComments = await getTaskComments(taskId);
        setComments(taskComments || []);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [taskId]);

  const refreshComments = useCallback(async () => {
    try {
      const taskComments = await getTaskComments(taskId);
      setComments(taskComments || []);
      if (onTaskRefetch) {
        await onTaskRefetch();
      }
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  }, [taskId, getTaskComments, onTaskRefetch]);

  const handleAddComment = useCallback(async () => {
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
      setNewComment('');
      onCommentAdded?.(createdComment);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, isSubmitting, currentUser, taskId, createTaskComment, refreshComments, onCommentAdded]);

  const handleEditComment = useCallback((commentId: string) => {
    setEditingCommentId(commentId);
  }, []);

  const handleSaveEdit = useCallback(async (commentId: string, content: string) => {
    if (!content.trim() || !currentUser) return;

    try {
      await updateTaskComment(commentId, currentUser.id, {
        content: content.trim()
      });
      await refreshComments();
      setEditingCommentId(null);
      onCommentUpdated?.(commentId, content.trim());
      toast.success('Comment updated successfully');
    } catch (error) {
      toast.error('Failed to update comment');
      console.error('Failed to edit comment:', error);
    }
  }, [currentUser, updateTaskComment, refreshComments, onCommentUpdated]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const handleDeleteComment = useCallback((commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteModalOpen(true);
  }, []);

  const confirmDeleteComment = useCallback(async () => {
    if (!commentToDelete || !currentUser) return;
    try {
      await deleteTaskComment(commentToDelete, currentUser.id);
      await refreshComments();
      onCommentDeleted?.(commentToDelete);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setDeleteModalOpen(false);
      setCommentToDelete(null);
    }
  }, [commentToDelete, currentUser, deleteTaskComment, refreshComments, onCommentDeleted]);

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
  }, []);

  // Memoize comments list to prevent unnecessary re-renders
  const commentsList = useMemo(() => {
    if (loadingComments) {
      return (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-2 animate-pulse py-2">
              <div className="w-8 h-8 bg-[var(--muted)] rounded-full flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="bg-[var(--muted)]/30 rounded-xl p-3">
                  <div className="h-3 bg-[var(--muted)] rounded w-1/4 mb-2" />
                  <div className="h-4 bg-[var(--muted)] rounded w-3/4" />
                </div>
                <div className="h-2 bg-[var(--muted)] rounded w-16 ml-1" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-0">
        {comments.length > 0 ? (
          comments.map((comment) => {
            if (editingCommentId === comment.id) {
              return (
                <CommentEditForm
                  key={comment.id}
                  comment={comment}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              );
            }
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser!}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                formatTimestamp={formatTimestamp}
              />
            );
          })
        ) : (
          /* Empty State */
          <div className="text-center py-6 bg-[var(--muted)]/10 rounded-lg border border-dashed border-[var(--border)]">
            <div className="p-2 rounded-full  w-fit mx-auto mb-2">
              <HiChatBubbleLeftRight className="w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">
              No comments yet
            </h4>
            <p className="text-xs text-[var(--muted-foreground)]">
              Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    );
  }, [
    loadingComments, 
    comments, 
    editingCommentId, 
    currentUser, 
    handleSaveEdit, 
    handleCancelEdit, 
    handleEditComment, 
    handleDeleteComment, 
    formatTimestamp
  ]);

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
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2">
            <div className="p-1 rounded-md ">
              <HiChatBubbleLeftRight size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Comments
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </p>
            </div>
          </div>
        </div>

        {/* Comments List */}
        {commentsList}

        {/* Add Comment Form */}
        {hasAccess && (
          <div>
            <div className="flex gap-2">
              <div className="flex-shrink-0 mt-1">
                <UserAvatar
                  user={{
                    firstName: currentUser.firstName || '',
                    lastName: currentUser.lastName || '',
                    avatar: currentUser.avatar,
                  }}
                  size="xs"
                />
              </div>
              <div className="flex-1">
                <div className="relative">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={1}
                    placeholder="Add a comment..."
                    disabled={isSubmitting}
                    className="text-sm border-[var(--input)] bg-[var(--background)] placeholder:text-[var(--muted-foreground)] rounded-xl px-3 py-2 pr-10 min-h-[38px] hide-arrows"
                    style={{ lineHeight: '1.4' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                 
                </div>
                <div className='flex justify-end mt-2'>
                  <ActionButton secondary  onClick={handleAddComment} disabled={isSubmitting}>
                  Post
                </ActionButton>
                </div>
               
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setCommentToDelete(null); }}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}