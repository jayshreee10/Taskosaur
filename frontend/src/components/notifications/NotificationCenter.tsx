'use client';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface NotificationCenterProps {
  className?: string;
}

const UserAvatar = ({ 
  name, 
  size = "sm" 
}: { 
  name: string;
  size?: "xs" | "sm" | "md";
}) => {
  const sizes = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base"
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-medium shadow-lg`}>
      {getInitials(name)}
    </div>
  );
};

const Button = ({ 
  children, 
  variant = "primary", 
  size = "sm",
  className = "",
  ...props 
}: { 
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "xs" | "sm" | "md";
  className?: string;
  [key: string]: any;
}) => {
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-700 text-white",
    secondary: "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300",
    outline: "border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
  };
  
  const sizes = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm"
  };
  
  return (
    <button 
      className={`rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function NotificationCenter({ className = "" }: NotificationCenterProps) {
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

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
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
    const iconProps = { size: 16, className: "text-stone-400" };
    
    switch (type) {
      case 'task_assigned':
        return <HiDocumentText {...iconProps} className="text-blue-500" />;
      case 'task_completed':
        return <HiCheckCircle {...iconProps} className="text-green-500" />;
      case 'task_commented':
        return <HiChatBubbleLeft {...iconProps} className="text-purple-500" />;
      case 'mention':
        return <HiUser {...iconProps} className="text-amber-500" />;
      case 'sprint_started':
        return <HiRocketLaunch {...iconProps} className="text-indigo-500" />;
      case 'due_date':
        return <HiClock {...iconProps} className="text-red-500" />;
      case 'system':
        return <HiCog {...iconProps} className="text-stone-500" />;
      default:
        return <HiDocumentText {...iconProps} />;
    }
  };


  const unreadNotifications = getUnreadNotifications();
  const unreadCount = unreadNotifications.length;

  return (
    <DropdownMenuContent className="w-96 p-0 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm max-h-[80vh]" align="end" sideOffset={8}>
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-b border-[var(--border)]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[var(--destructive)] text-[var(--destructive-foreground)] min-w-[20px] h-5 justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 font-semibold transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary)]/20 border-t-[var(--primary)]"></div>
          </div>
        ) : unreadNotifications.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-[var(--muted)] flex items-center justify-center">
              <HiCheckCircle size={24} className="text-[var(--primary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              All caught up!
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              You have no unread notifications.
            </p>
          </div>
        ) : (
          <div className="p-2">
            {unreadNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <div
                  className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[var(--accent)]/50 mb-2 border bg-[var(--primary)]/5 border-[var(--primary)]/20"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {notification.actor ? (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center text-[var(--primary-foreground)] text-sm font-bold">
                          {notification.actor.name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--foreground)] leading-tight mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-2 h-2 bg-[var(--primary)] rounded-full"></div>
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
      <div className="px-5 py-4 border-t border-[var(--border)]/30">
        <div className="flex justify-center">
          <button 
            className="px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
          >
            View All
          </button>
        </div>
      </div>
    </DropdownMenuContent>
  );
}