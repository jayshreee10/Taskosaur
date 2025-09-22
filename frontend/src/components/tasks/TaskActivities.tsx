import React, { useEffect, useState } from "react";
import UserAvatar from "@/components/ui/avatars/UserAvatar";
import { HiOutlineBolt } from "react-icons/hi2";
import { useTask } from "@/contexts/task-context";
import { TaskActivityType } from "@/types/tasks";

interface TaskActivitiesProps {
  taskId: string;
}

function TaskActivities({ taskId }: TaskActivitiesProps) {
  const { getTaskActivity } = useTask();
  const [activities, setActivities] = useState<TaskActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActivities(1);
  }, [taskId]);

  const fetchActivities = async (pageNum: number, append = false) => {
    try {
      setLoading(true);
      const response = await getTaskActivity(taskId, pageNum);

      if (response && response.activities) {
        if (append) {
          setActivities((prev) => [...prev, ...response.activities]);
        } else {
          setActivities(response.activities);
        }
        setHasMore(response.pagination.hasNextPage);
        setTotalPages(response.pagination.totalPages);
        setPage(pageNum);
      } else {
        setError("Failed to fetch activities");
      }
    } catch (err) {
      setError("An error occurred while fetching activities");
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (page < totalPages) {
      fetchActivities(page + 1, true);
    }
  };

  const generateSimpleMessage = (activity: TaskActivityType): string => {
    const name = activity.user.firstName;

    switch (activity.type) {
      case "TASK_CREATED":
        return `${name} added the task`;

      case "TASK_UPDATED":
        return `${name} updated the task`;

      case "TASK_COMMENTED":
        return `${name} commented`;

      case "TASK_DELETED":
        return `${name} deleted the task`;

      case "TASK_ASSIGNED":
        return `${name} changed assignee`;

      case "TASK_LABEL_ADDED":
        return `${name} label added`;

      case "TASK_LABEL_REMOVED":
        return `${name} label removed`;

      case "TASK_STATUS_CHANGED":
        return `${name} changed status`;

      case "TASK_ATTACHMENT_ADDED":
        return `${name} added task attachment`;

      case "TASK_ATTACHMENT_REMOVED":
        return `${name} removed task attachment`;

      default:
        return `${name} updated the task`;
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="w-full max-w-md h-74 rounded-xl p-4 flex flex-col">
        <div className="flex items-center gap-1 mb-3">
          <div className="p-1 rounded-md">
            <HiOutlineBolt className="size-5 text-[var(--primary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Activities
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl px-3 py-2 flex items-start gap-2 animate-pulse"
            >
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="w-full max-w-md h-74 rounded-xl p-4 flex flex-col">
        <div className="flex items-center gap-1 mb-3">
          <div className="p-1 rounded-md">
            <HiOutlineBolt size={16} className="text-[var(--primary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Activities
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[var(--muted-foreground)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md h-74 rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-1 mb-3">
        <div className="p-1 rounded-md">
          <HiOutlineBolt size={18} className="text-[var(--primary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Activities
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        {activities.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              No activities yet
            </p>
          </div>
        ) : (
          <>
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-[var(--background-secondary)] transition-colors"
              >
                <UserAvatar
                  user={{
                    firstName: activity.user.firstName,
                    lastName: activity.user.lastName,
                    avatar: activity.user.avatar,
                  }}
                  size="xs"
                />
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-[13px] text-[var(--foreground)] truncate">
                    {generateSimpleMessage(activity)}
                  </span>
                  <span className="text-[11px] text-[var(--muted-foreground)] ml-2 flex-shrink-0">
                    {formatTimestamp(activity.createdAt)}
                  </span>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="w-full flex justify-center mt-2">
                <button
                  className="text-[13px] text-[var(--primary)] font-medium py-1 px-3 rounded hover:text-blue-500 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "View more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TaskActivities;
