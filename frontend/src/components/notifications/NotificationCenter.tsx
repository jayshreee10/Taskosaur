import React, { useState, useEffect } from 'react';
import {
  HiCheckCircle,
  HiChatBubbleLeft,
  HiUser,
  HiRocketLaunch,
  HiClock,
  HiCog,
  HiDocumentText
} from 'react-icons/hi2';
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";

export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_commented' | 'mention' | 'sprint_started' | 'due_date' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: {
    taskId?: string;
    projectId?: string;
    sprintId?: string;
  };
}

interface NotificationCenterProps {}



export default function NotificationCenter({}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: 'You have been assigned to "Implement user authentication"',
      read: false,
      createdAt: '2024-01-22T10:30:00Z',
      actionUrl: '/tasks/task-1',
      actionText: 'View Task',
      actor: {
        id: 'user-2',
        name: 'Jane Smith',
        avatar: '/api/placeholder/32/32'
      },
      metadata: {
        taskId: 'task-1',
        projectId: 'project-1'
      }
    },
    {
      id: '2',
      type: 'task_commented',
      title: 'New Comment',
      message: 'John commented on "Fix login redirect bug"',
      read: false,
      createdAt: '2024-01-22T09:15:00Z',
      actionUrl: '/tasks/task-2',
      actionText: 'View Comment',
      actor: {
        id: 'user-1',
        name: 'John Doe',
        avatar: '/api/placeholder/32/32'
      },
      metadata: {
        taskId: 'task-2',
        projectId: 'project-1'
      }
    },
    {
      id: '3',
      type: 'mention',
      title: 'You were mentioned',
      message: 'Alice mentioned you in "Add dark mode support"',
      read: false,
      createdAt: '2024-01-22T08:45:00Z',
      actionUrl: '/tasks/task-3',
      actionText: 'View Mention',
      actor: {
        id: 'user-3',
        name: 'Alice Johnson',
        avatar: '/api/placeholder/32/32'
      },
      metadata: {
        taskId: 'task-3',
        projectId: 'project-1'
      }
    },
    {
      id: '4',
      type: 'due_date',
      title: 'Due Date Reminder',
      message: 'Task "Fix login redirect bug" is due tomorrow',
      read: true,
      createdAt: '2024-01-21T18:00:00Z',
      actionUrl: '/tasks/task-2',
      actionText: 'View Task',
      metadata: {
        taskId: 'task-2',
        projectId: 'project-1'
      }
    },
    {
      id: '5',
      type: 'sprint_started',
      title: 'Sprint Started',
      message: 'Sprint 1 - Authentication has started',
      read: true,
      createdAt: '2024-01-21T09:00:00Z',
      actionUrl: '/sprints/sprint-1',
      actionText: 'View Sprint',
      metadata: {
        sprintId: 'sprint-1',
        projectId: 'project-1'
      }
    },
    {
      id: '6',
      type: 'task_completed',
      title: 'Task Completed',
      message: 'Bob completed "Setup CI/CD pipeline"',
      read: true,
      createdAt: '2024-01-20T16:30:00Z',
      actionUrl: '/tasks/task-4',
      actionText: 'View Task',
      actor: {
        id: 'user-4',
        name: 'Bob Wilson',
        avatar: '/api/placeholder/32/32'
      },
      metadata: {
        taskId: 'task-4',
        projectId: 'project-1'
      }
    },
    {
      id: '7',
      type: 'system',
      title: 'System Update',
      message: 'New features are now available in your dashboard',
      read: true,
      createdAt: '2024-01-20T12:00:00Z',
      actionUrl: '/dashboard',
      actionText: 'View Updates'
    }
  ];

  useEffect(() => {
    loadNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };


  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.read);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { size: 16 };
    
    switch (type) {
      case 'task_assigned':
        return <HiDocumentText {...iconProps} className="notifications-icon-task-assigned" />;
      case 'task_completed':
        return <HiCheckCircle {...iconProps} className="notifications-icon-task-completed" />;
      case 'task_commented':
        return <HiChatBubbleLeft {...iconProps} className="notifications-icon-task-commented" />;
      case 'mention':
        return <HiUser {...iconProps} className="notifications-icon-mention" />;
      case 'sprint_started':
        return <HiRocketLaunch {...iconProps} className="notifications-icon-sprint-started" />;
      case 'due_date':
        return <HiClock {...iconProps} className="notifications-icon-due-date" />;
      case 'system':
        return <HiCog {...iconProps} className="notifications-icon-system" />;
      default:
        return <HiDocumentText {...iconProps} className="notifications-icon-default" />;
    }
  };


  const unreadNotifications = getUnreadNotifications();
  const unreadCount = unreadNotifications.length;

  return (
    <DropdownMenuContent className="notifications-dropdown-content" align="end" sideOffset={8}>
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-content">
          <div className="notifications-header-title-group">
            <h2 className="notifications-header-title">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="notifications-unread-badge">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="notifications-mark-all-button"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-list-container">
        {isLoading ? (
          <div className="notifications-loading">
            <div className="notifications-loading-spinner"></div>
          </div>
        ) : unreadNotifications.length === 0 ? (
          <div className="notifications-empty-state">
            <div className="notifications-empty-icon">
              <HiCheckCircle size={24} className="text-[var(--primary)]" />
            </div>
            <h3 className="notifications-empty-title">
              All caught up!
            </h3>
            <p className="notifications-empty-message">
              You have no unread notifications.
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {unreadNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <div
                  className="notifications-item"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notifications-item-content">
                    <div className="notifications-item-avatar-container">
                      {notification.actor ? (
                        <div className="notifications-item-avatar-user">
                          {notification.actor.name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="notifications-item-avatar-system">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="notifications-item-details">
                      <div className="notifications-item-header">
                        <div className="notifications-item-text-content">
                          <p className="notifications-item-title">
                            {notification.title}
                          </p>
                          <p className="notifications-item-message">
                            {notification.message}
                          </p>
                        </div>
                        <div className="notifications-item-indicators">
                          <div className="notifications-unread-indicator"></div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="notifications-footer">
        <div className="notifications-footer-content">
          <button className="notifications-view-all-button">
            View All
          </button>
        </div>
      </div>
    </DropdownMenuContent>
  );
}