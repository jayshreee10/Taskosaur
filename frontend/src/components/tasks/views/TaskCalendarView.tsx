"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Task } from "@/types";
import { HiChevronLeft, HiChevronRight, HiCalendarDays } from "react-icons/hi2";
import { HiX } from "react-icons/hi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/avatars/UserAvatar";

interface TaskCalendarViewProps {
  tasks: Task[];
  workspaceSlug: string;
  projectSlug?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfMonth: number;
  tasks: Task[];
}

export default function TaskCalendarView({
  tasks,
  workspaceSlug,
  projectSlug,
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const getStatusColors = (
    statusName: string
  ): { bg: string; text: string; border: string } => {
    switch (statusName?.toLowerCase()) {
      case "done":
      case "completed":
        return {
          bg: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
          text: "text-green-800 dark:text-green-400",
          border: "border-green-200 dark:border-green-800",
        };
      case "in progress":
      case "in_progress":
        return {
          bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
          text: "text-blue-800 dark:text-blue-400",
          border: "border-blue-200 dark:border-blue-800",
        };
      case "review":
        return {
          bg: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
          text: "text-orange-800 dark:text-orange-400",
          border: "border-orange-200 dark:border-orange-800",
        };
      case "todo":
        return {
          bg: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
          text: "text-gray-800 dark:text-gray-400",
          border: "border-gray-200 dark:border-gray-700",
        };
      default:
        return {
          bg: "bg-[var(--muted)] text-[var(--muted-foreground)]",
          text: "text-[var(--muted-foreground)]",
          border: "border-[var(--border)]",
        };
    }
  };

  const parseDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = (date: Date, taskList: Task[]) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    setCurrentMonth(
      new Intl.DateTimeFormat("en-US", { month: "long" }).format(date)
    );
    setCurrentYear(year.toString());
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month, getDaysInMonth(year, month));
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - dayOfWeek);
    const lastDayOfCalendar = new Date(lastDayOfMonth);
    const remainingDays = 6 - lastDayOfMonth.getDay();
    lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + remainingDays);
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = new Date(firstDayOfCalendar);
    while (currentDay <= lastDayOfCalendar) {
      const currentDayDate = new Date(currentDay);
      const isCurrentMonth = currentDayDate.getMonth() === month;
      const isToday = currentDayDate.getTime() === today.getTime();
      const dayTasks = taskList.filter((task) => {
        const dueDate = parseDate(task.dueDate);
        if (!dueDate) return false;
        return (
          dueDate.getFullYear() === currentDayDate.getFullYear() &&
          dueDate.getMonth() === currentDayDate.getMonth() &&
          dueDate.getDate() === currentDayDate.getDate()
        );
      });
      days.push({
        date: new Date(currentDayDate),
        isCurrentMonth,
        isToday,
        dayOfMonth: currentDayDate.getDate(),
        tasks: dayTasks,
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    setCalendarDays(days);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  useEffect(() => {
    const tasksWithDates = tasks.map((task, index) => {
      if (!task.dueDate) {
        if (task.createdAt) {
          // Use creation date as fallback
          return {
            ...task,
            dueDate: task.createdAt,
          };
        } else {
          // If no dates at all, spread tasks over current month
          const today = new Date();
          const daysToAdd = index % 30; // Distribute evenly over 30 days
          const syntheticDueDate = new Date(
            today.getTime() + daysToAdd * 24 * 60 * 60 * 1000
          );
          return {
            ...task,
            dueDate: syntheticDueDate.toISOString(),
          };
        }
      }
      return task;
    });
    generateCalendarDays(currentDate, tasksWithDates);
  }, [currentDate, tasks]);

  // Show empty state if no tasks
  if (tasks.length === 0) {
    return (
      <div className="w-full bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-8">
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <HiCalendarDays className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">
            No tasks scheduled
          </p>
          <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
            Tasks with due dates will appear on the calendar. Create tasks with
            specific due dates to visualize your schedule.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1 flex items-center gap-2">
              <HiCalendarDays className="w-5 h-5 text-[var(--muted-foreground)]" />
              {currentMonth} {currentYear}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {
                calendarDays.filter(
                  (day) => day.isCurrentMonth && day.tasks.length > 0
                ).length
              }{" "}
              days with tasks this month
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[var(--muted)] rounded-lg p-1">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  viewMode === "month"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  viewMode === "week"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Week
              </button>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="h-8 w-8 p-0 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
              >
                <HiChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="h-8 px-3 text-xs font-medium border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="h-8 w-8 p-0 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
              >
                <HiChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[var(--card)]">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-3 text-center font-semibold text-xs text-[var(--muted-foreground)] border-r last:border-r-0 border-[var(--border)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const isSelected =
              selectedDay &&
              day.date.toDateString() === selectedDay.toDateString();

            return (
              <div
                key={index}
                className={`min-h-[100px] border-r last:border-r-0 border-b last:border-b-0 border-[var(--border)] p-2 transition-all duration-200 cursor-pointer ${
                  day.isCurrentMonth
                    ? "bg-[var(--card)] hover:bg-[var(--accent)]"
                    : "bg-[var(--muted)]/30 opacity-60"
                } ${
                  day.isToday
                    ? "ring-2 ring-[var(--primary)] ring-inset bg-[var(--primary)]/5"
                    : ""
                } ${
                  isSelected
                    ? "bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]"
                    : ""
                }`}
                onClick={() => setSelectedDay(day.date)}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      day.isToday
                        ? "text-[var(--primary)]"
                        : day.isCurrentMonth
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {day.dayOfMonth}
                  </span>
                  {day.tasks.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          day.tasks.some((task) => {
                            const dueDate = new Date(task.dueDate!);
                            return (
                              dueDate < new Date() &&
                              task.status?.name?.toLowerCase() !== "done"
                            );
                          })
                            ? "bg-red-500"
                            : "bg-[var(--primary)]"
                        }`}
                      />
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        {day.tasks.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Task List */}
                <div className="space-y-1">
                  {day.tasks.slice(0, 2).map((task) => {
                    const statusColors = getStatusColors(task.status?.name);
                    const isOverdue =
                      new Date(task.dueDate!) < new Date() &&
                      task.status?.name?.toLowerCase() !== "done";

                    return (
                      <Link
                        key={task.id}
                        href={
                          workspaceSlug && projectSlug
                            ? `/${workspaceSlug}/${projectSlug}/tasks/${task.id}`
                            : workspaceSlug
                            ? `/${workspaceSlug}/tasks/${task.id}`
                            : `/tasks/${task.id}`
                        }
                        className={`block p-1.5 rounded-md border transition-all duration-200 hover:shadow-sm group text-xs ${
                          isOverdue
                            ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                            : `${statusColors.bg} ${statusColors.border}`
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-medium line-clamp-1 flex-1">
                            {task.title || "Untitled Task"}
                          </p>
                          {task.assignee && (
                            <UserAvatar user={task.assignee} size="xs" />
                          )}
                        </div>
                        {isOverdue && (
                          <div className="mt-1">
                            <Badge
                              variant="destructive"
                              className="text-xs px-1 py-0 h-4"
                            >
                              Overdue
                            </Badge>
                          </div>
                        )}
                      </Link>
                    );
                  })}

                  {/* Show more indicator */}
                  {day.tasks.length > 2 && (
                    <div className="text-xs text-[var(--muted-foreground)] text-center py-1">
                      +{day.tasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Sidebar (when day is selected) */}
      {selectedDay && (
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-[var(--foreground)]">
              {selectedDay.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDay(null)}
              className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <HiX className="w-4 h-4" />
            </Button>
          </div>

          {(() => {
            const dayTasks =
              calendarDays.find(
                (day) => day.date.toDateString() === selectedDay.toDateString()
              )?.tasks || [];

            if (dayTasks.length === 0) {
              return (
                <div className="text-center py-6">
                  <HiCalendarDays className="w-8 h-8 mx-auto mb-2 text-[var(--muted-foreground)] opacity-50" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No tasks scheduled for this day
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {dayTasks.map((task) => {
                  const statusColors = getStatusColors(task.status?.name);
                  const isOverdue =
                    new Date(task.dueDate!) < new Date() &&
                    task.status?.name?.toLowerCase() !== "done";

                  return (
                    <Link
                      key={task.id}
                      href={
                        workspaceSlug && projectSlug
                          ? `/${workspaceSlug}/${projectSlug}/tasks/${task.id}`
                          : workspaceSlug
                          ? `/${workspaceSlug}/tasks/${task.id}`
                          : `/tasks/${task.id}`
                      }
                      className={`block p-3 rounded-lg border transition-all duration-200 hover:shadow-sm group ${
                        isOverdue
                          ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          : `${statusColors.bg} ${statusColors.border}`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm mb-1">
                            {task.title || "Untitled Task"}
                          </h5>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0 h-5 border-none bg-[var(--primary)]/10 text-[var(--primary)]"
                            >
                              {task.status?.name || "No Status"}
                            </Badge>
                            {task.priority && (
                              <Badge
                                variant="outline"
                                className="text-xs px-2 py-0 h-5 border-none bg-[var(--muted)] text-[var(--muted-foreground)]"
                              >
                                {task.priority}
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge
                                variant="destructive"
                                className="text-xs px-2 py-0 h-5"
                              >
                                Overdue
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={task.assignee} size="sm" />
                            <div className="text-right">
                              <p className="text-xs font-medium text-[var(--foreground)]">
                                {task.assignee.firstName}{" "}
                                {task.assignee.lastName}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                Assignee
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
