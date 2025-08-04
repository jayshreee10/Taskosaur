import api from "@/lib/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  userId: string;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
  organizationId?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  recent: number;
  byType: Record<string, number>;
}

export interface RecentNotificationsResponse {
  notifications: Notification[];
  count: number;
}

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMMENTED"
  | "TASK_DUE_SOON"
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "WORKSPACE_INVITED"
  | "MENTION"
  | "SYSTEM";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const notificationApi = {
  // Get user notifications with filters and pagination
  getUserNotifications: async (
    filters: NotificationFilters = {}
  ): Promise<NotificationResponse> => {
    try {
      const params = new URLSearchParams();

      // Add filters as query parameters
      if (filters.limit !== undefined) {
        params.append(
          "limit",
          Math.min(Math.max(1, filters.limit), 100).toString()
        );
      }

      if (filters.page !== undefined) {
        params.append("page", Math.max(1, filters.page).toString());
      }

      if (filters.isRead !== undefined) {
        params.append("isRead", filters.isRead.toString());
      }

      if (filters.type) {
        params.append("type", filters.type);
      }

      if (filters.organizationId) {
        params.append("organizationId", filters.organizationId);
      }

      console.log("Fetching user notifications with filters:", filters);

      const response = await api.get<NotificationResponse>(
        `/notifications?${params.toString()}`
      );

      console.log("User notifications fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user notifications:", error);
      throw error;
    }
  },

  // Get unread notification count
  getUnreadNotificationCount: async (
    organizationId?: string
  ): Promise<{ count: number }> => {
    try {
      const params = new URLSearchParams();
      if (organizationId) {
        params.append("organizationId", organizationId);
      }

      console.log("Fetching unread notification count");

      const response = await api.get<{ count: number }>(
        `/notifications/unread-count?${params.toString()}`
      );

      console.log("Unread count fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      throw error;
    }
  },

  // Get recent notifications (last 7 days)
  getRecentNotifications: async (
    filters: {
      limit?: number;
      organizationId?: string;
    } = {}
  ): Promise<RecentNotificationsResponse> => {
    try {
      const params = new URLSearchParams();

      if (filters.limit !== undefined) {
        params.append(
          "limit",
          Math.min(Math.max(1, filters.limit), 50).toString()
        );
      }

      if (filters.organizationId) {
        params.append("organizationId", filters.organizationId);
      }

      console.log("Fetching recent notifications with filters:", filters);

      const response = await api.get<RecentNotificationsResponse>(
        `/notifications/recent?${params.toString()}`
      );

      console.log("Recent notifications fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch recent notifications:", error);
      throw error;
    }
  },

  // Get notifications by specific type
  getNotificationsByType: async (
    type: NotificationType,
    filters: {
      page?: number;
      limit?: number;
      organizationId?: string;
    } = {}
  ): Promise<NotificationResponse> => {
    try {
      const params = new URLSearchParams();

      if (filters.page !== undefined) {
        params.append("page", Math.max(1, filters.page).toString());
      }

      if (filters.limit !== undefined) {
        params.append(
          "limit",
          Math.min(Math.max(1, filters.limit), 100).toString()
        );
      }

      if (filters.organizationId) {
        params.append("organizationId", filters.organizationId);
      }

      console.log(`Fetching notifications by type: ${type}`, filters);

      const response = await api.get<NotificationResponse>(
        `/notifications/by-type/${type}?${params.toString()}`
      );

      console.log("Notifications by type fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch notifications by type:", error);
      throw error;
    }
  },

  // Get notification by ID
  getNotificationById: async (
    notificationId: string
  ): Promise<Notification> => {
    try {
      // Validate notificationId format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(notificationId)) {
        throw new Error(
          `Invalid notificationId format: ${notificationId}. Expected UUID format.`
        );
      }

      console.log("Fetching notification by ID:", notificationId);

      const response = await api.get<Notification>(
        `/notifications/${notificationId}`
      );

      console.log("Notification fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch notification by ID:", error);
      throw error;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (
    notificationId: string
  ): Promise<{ message: string }> => {
    try {
      // Validate notificationId format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(notificationId)) {
        throw new Error(
          `Invalid notificationId format: ${notificationId}. Expected UUID format.`
        );
      }

      console.log("Marking notification as read:", notificationId);

      const response = await api.patch<{ message: string }>(
        `/notifications/${notificationId}/read`
      );

      console.log("Notification marked as read successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async (
    organizationId?: string
  ): Promise<{ message: string }> => {
    try {
      const params = new URLSearchParams();
      if (organizationId) {
        params.append("organizationId", organizationId);
      }

      console.log("Marking all notifications as read");

      const response = await api.patch<{ message: string }>(
        `/notifications/mark-all-read?${params.toString()}`
      );

      console.log(
        "All notifications marked as read successfully:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  },

  // Mark all unread notifications as read
  markAllUnreadAsRead: async (
    organizationId?: string
  ): Promise<{ message: string }> => {
    try {
      const params = new URLSearchParams();
      if (organizationId) {
        params.append("organizationId", organizationId);
      }

      console.log("Marking all unread notifications as read");

      const response = await api.patch<{ message: string }>(
        `/notifications/mark-all-unread-read?${params.toString()}`
      );

      console.log(
        "All unread notifications marked as read successfully:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to mark all unread notifications as read:", error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      // Validate notificationId format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(notificationId)) {
        throw new Error(
          `Invalid notificationId format: ${notificationId}. Expected UUID format.`
        );
      }

      console.log("Deleting notification:", notificationId);

      await api.delete(`/notifications/${notificationId}`);

      console.log("Notification deleted successfully");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }
  },

  // Delete multiple notifications
  deleteMultipleNotifications: async (
    notificationIds: string[]
  ): Promise<void> => {
    try {
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new Error("notificationIds must be a non-empty array");
      }

      // Validate all notification IDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (const id of notificationIds) {
        if (!uuidRegex.test(id)) {
          throw new Error(
            `Invalid notificationId format: ${id}. Expected UUID format.`
          );
        }
      }

      console.log("Deleting multiple notifications:", notificationIds);

      await api.delete("/notifications/bulk", {
        data: { notificationIds },
      });

      console.log("Multiple notifications deleted successfully");
    } catch (error) {
      console.error("Failed to delete multiple notifications:", error);
      throw error;
    }
  },

  // Get notification statistics
  getNotificationStats: async (
    organizationId?: string
  ): Promise<NotificationStats> => {
    try {
      const params = new URLSearchParams();
      if (organizationId) {
        params.append("organizationId", organizationId);
      }

      console.log("Fetching notification statistics");

      const response = await api.get<NotificationStats>(
        `/notifications/stats/summary?${params.toString()}`
      );

      console.log("Notification stats fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch notification stats:", error);
      throw error;
    }
  },

  // Helper function to get unread notifications only
  getUnreadNotifications: async (
    filters: Omit<NotificationFilters, "isRead"> = {}
  ): Promise<NotificationResponse> => {
    try {
      console.log("Fetching unread notifications");
      return await notificationApi.getUserNotifications({
        ...filters,
        isRead: false,
      });
    } catch (error) {
      console.error("Failed to fetch unread notifications:", error);
      throw error;
    }
  },

  // Helper function to get read notifications only
  getReadNotifications: async (
    filters: Omit<NotificationFilters, "isRead"> = {}
  ): Promise<NotificationResponse> => {
    try {
      console.log("Fetching read notifications");
      return await notificationApi.getUserNotifications({
        ...filters,
        isRead: true,
      });
    } catch (error) {
      console.error("Failed to fetch read notifications:", error);
      throw error;
    }
  },

  // Helper function to get task-related notifications
  getTaskNotifications: async (
    filters: Omit<NotificationFilters, "type"> = {}
  ): Promise<NotificationResponse[]> => {
    try {
      console.log("Fetching task-related notifications");

      const taskNotificationTypes: NotificationType[] = [
        "TASK_ASSIGNED",
        "TASK_STATUS_CHANGED",
        "TASK_COMMENTED",
        "TASK_DUE_SOON",
      ];

      const promises = taskNotificationTypes.map((type) =>
        notificationApi.getNotificationsByType(type, filters)
      );

      const results = await Promise.all(promises);
      console.log("Task notifications fetched successfully");
      return results;
    } catch (error) {
      console.error("Failed to fetch task notifications:", error);
      throw error;
    }
  },

  // Helper function to clear all notifications (mark as read and optionally delete)
  clearAllNotifications: async (
    organizationId?: string,
    deleteAfterRead: boolean = false
  ): Promise<{ message: string }> => {
    try {
      console.log("Clearing all notifications");

      // First mark all as read
      await notificationApi.markAllNotificationsAsRead(organizationId);

      if (deleteAfterRead) {
        // Get all notifications and delete them
        const notifications = await notificationApi.getUserNotifications({
          organizationId,
          limit: 100, // Get a large batch
        });

        if (notifications.notifications.length > 0) {
          const notificationIds = notifications.notifications.map((n) => n.id);
          await notificationApi.deleteMultipleNotifications(notificationIds);
        }
      }

      console.log("All notifications cleared successfully");
      return { message: "All notifications cleared successfully" };
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
      throw error;
    }
  },

  // Helper function to refresh notification count (useful for real-time updates)
  refreshNotificationData: async (organizationId?: string) => {
    try {
      console.log("Refreshing notification data");

      const [unreadCount, recentNotifications, stats] = await Promise.all([
        notificationApi.getUnreadNotificationCount(organizationId),
        notificationApi.getRecentNotifications({ limit: 5, organizationId }),
        notificationApi.getNotificationStats(organizationId),
      ]);

      const refreshedData = {
        unreadCount: unreadCount.count,
        recentNotifications: recentNotifications.notifications,
        stats,
      };

      console.log("Notification data refreshed successfully:", refreshedData);
      return refreshedData;
    } catch (error) {
      console.error("Failed to refresh notification data:", error);
      throw error;
    }
  },
  // Add this to your notificationApi object
  getNotificationsByUserAndOrganization: async (
    userId: string,
    organizationId: string,
    filters: {
      isRead?: boolean;
      type?: NotificationType;
      priority?: NotificationPriority;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    notifications: Notification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    summary: {
      total: number;
      unread: number;
      byType: Record<string, number>;
      byPriority: Record<string, number>;
    };
  }> => {
    try {
        console.log("Fetching notifications for user", userId, "in organization", organizationId);
      // Validate UUIDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(userId)) {
        throw new Error(
          `Invalid userId format: ${userId}. Expected UUID format.`
        );
      }

      if (!uuidRegex.test(organizationId)) {
        throw new Error(
          `Invalid organizationId format: ${organizationId}. Expected UUID format.`
        );
      }

      const params = new URLSearchParams();

      // Add filters as query parameters
      if (filters.isRead !== undefined) {
        params.append("isRead", filters.isRead.toString());
      }

      if (filters.type) {
        params.append("type", filters.type);
      }

      if (filters.priority) {
        params.append("priority", filters.priority);
      }

      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      if (filters.page !== undefined) {
        params.append("page", Math.max(1, filters.page).toString());
      }

      if (filters.limit !== undefined) {
        params.append(
          "limit",
          Math.min(Math.max(1, filters.limit), 100).toString()
        );
      }
      const response = await api.get(
        `/notifications/user/${userId}/organization/${organizationId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user-organization notifications:", error);
      throw error;
    }
  },
};
