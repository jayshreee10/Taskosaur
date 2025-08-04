"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganization } from "@/contexts/organization-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { useProject } from "@/contexts/project-context";
import { Task, useTask } from "@/contexts/task-context";
import { useTheme } from "next-themes";
import { TodayAgenda } from "@/components/dashboard/TodayAgenda";

// Import React Icons
import {
  HiPlus,
  HiChevronRight,
  HiCalendar,
  HiDocumentText,
  HiFolder,
  HiUsers,
} from "react-icons/hi2";
import { BsFillLightningFill } from "react-icons/bs";

import { OrganizationStats, TasksResponse } from "@/utils/api";

interface Project {
  id: string;
  name: string;
  key: string;
  workspaceId: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  workspaces?: Workspace[];
}

export default function ModernDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { getCurrentUser, isAuthenticated } = useAuth();
  const {
    currentOrganization,
    organizations,
    isLoading: orgLoading,
    getOrganizationById,
    getOrganizationStats,
  } = useOrganization();
  const {
    workspaces,
    getWorkspacesByOrganization,
    isLoading: workspaceLoading,
  } = useWorkspace();
  const {
    projects,
    getProjectsByUserId,
    isLoading: projectLoading,
  } = useProject();
  const {
    tasks,
    getTasksByOrganization,
    isLoading: taskLoading,
    getTodayAgenda,
  } = useTask();
  const { theme, systemTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const isDashboardRoute = pathname === "/dashboard";

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInvalidToken = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("currentOrganizationId");
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");
    }
    router.push("/login");
  }, [router]);

  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  const [dashboardProjects, setDashboardProjects] = useState<Project[]>([]);
  const [dashboardTasks, setDashboardTasks] = useState<Task[]>([]);
  const [todayTask, setTodayTask] = useState<TasksResponse | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isFetchingRef = useRef(false);
  const isWorkspacesFetchingRef = useRef(false);
  const [showTodayAgenda, setShowTodayAgenda] = useState(false);

  const currentUser = isHydrated ? getCurrentUser() : null;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currentOrganizationId" && isHydrated) {
        setHasInitialized(false);
        setActiveOrganization(null);
        isFetchingRef.current = false;
      }
    };

    const handleOrganizationChange = () => {
      if (isHydrated) {
        setHasInitialized(false);
        setActiveOrganization(null);
        isFetchingRef.current = false;
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("organizationChanged", handleOrganizationChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "organizationChanged",
        handleOrganizationChange
      );
    };
  }, [isHydrated]);

  const fetchData = useCallback(async () => {
    const currentOrganizationId =
      typeof window !== "undefined"
        ? localStorage.getItem("currentOrganizationId")
        : null;

    if (
      !isHydrated ||
      isLoading ||
      hasInitialized ||
      isFetchingRef.current ||
      !isDashboardRoute
    ) {
      return;
    }

    if (!isAuthenticated()) {
      handleInvalidToken();
      return;
    }

    if (!currentOrganizationId) {
      console.log("No organization selected");
      setActiveOrganization(null);
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        throw new Error("User not authenticated");
      }

      console.log(
        "Fetching dashboard data for organization:",
        currentOrganizationId
      );

      // Fetch organization details
      let organizationData: Organization | null = null;
      try {
        const orgData = await getOrganizationById(currentOrganizationId);
        organizationData = orgData;
      } catch (error) {
        console.error("Error fetching organization:", error);
      }

      // Fetch workspaces for the organization
      let workspacesData: Workspace[] = [];
      try {
        workspacesData = await getWorkspacesByOrganization(
          currentOrganizationId
        );
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      }

      // Fetch projects for the current user
      let projectsData: Project[] = [];
      try {
        projectsData = await getProjectsByUserId(currentUser.id);
        setDashboardProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }

      // Fetch tasks for organization with pagination
      try {
        const tasksResponse = await getTasksByOrganization(
          currentOrganizationId,
          {
            page: 1,
            limit: 5,
          }
        );
        const todayTasks = await getTodayAgenda(currentOrganizationId);
        setTodayTask(todayTasks);
        const tasksData = Array.isArray(tasksResponse)
          ? tasksResponse
          : tasksResponse.tasks;
        setDashboardTasks(tasksData || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }

      // Fetch organization stats
      try {
        const statsData = await getOrganizationStats(currentOrganizationId);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching organization stats:", error);
      }

      if (organizationData) {
        setActiveOrganization({
          ...organizationData,
          workspaces: workspacesData,
        });
      }

      setHasInitialized(true);
      console.log("Dashboard data loaded successfully");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    isHydrated,
    isLoading,
    hasInitialized,
    handleInvalidToken,
    isDashboardRoute,
    getCurrentUser,
    isAuthenticated,
    getOrganizationById,
    getWorkspacesByOrganization,
    getProjectsByUserId,
    getTasksByOrganization,
    getOrganizationStats,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const activeWorkspaces = activeOrganization?.workspaces || [];
  const defaultWorkspace = activeWorkspaces[0] || {
    slug: "default",
    id: "default",
  };
  const defaultProject = dashboardProjects[0] || {
    key: "default",
    id: "default",
  };

  // Show loading state
  const isAnyLoading =
    isLoading ||
    orgLoading ||
    workspaceLoading ||
    projectLoading ||
    taskLoading;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Accepts string or enum (case-insensitive)
  const getPriorityColor = (priority: string) => {
    if (!priority) return "bg-gray-300";
    const p = priority.toString().toLowerCase();
    if (p === "high") return "bg-red-500";
    if (p === "medium") return "bg-yellow-500";
    if (p === "low") return "bg-green-500";
    return "bg-gray-300";
  };

  // Status color logic
  const getStatusColor = (category: string) => {
    switch (category) {
      case "DONE":
        return "bg-green-100 text-green-700";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "TODO":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Refactor status/category string for display (e.g., IN_PROGRESS -> in progress)
  const formatStatusText = (status: string) => {
    if (!status) return "";
    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--background)]" />;
  }
  console.log("dashboardTasks", dashboardTasks);
  return (
    <div className="min-h-screen bg-[var(--background)] p-2">
      {showTodayAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-[var(--card)] rounded-lg shadow-lg p-6 relative w-full max-w-md">
            <Button
              className="absolute top-2 right-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => setShowTodayAgenda(false)}
              aria-label="Close"
            >
              &times;
            </Button>
            <TodayAgenda
              isOpen={showTodayAgenda}
              onClose={() => setShowTodayAgenda(false)}
              currentDate={getCurrentDate()}
              upcomingTasks={todayTask?.tasks || []}
            />
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {currentUser?.firstName?.charAt(0) || "U"}
              {currentUser?.lastName?.charAt(0) || ""}
            </div>
            <div>
              <h1 className="text-md font-semibold text-[var(--foreground)]">
                {getTimeBasedGreeting()}, {currentUser?.firstName || "User"}!
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {getCurrentDate()} • Ready to tackle your goals?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={() => setShowTodayAgenda(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm transition-colors hover:bg-[var(--accent)]"
            >
              <HiCalendar className="w-4 h-4" />
              Today's Agenda
            </Button>
            <Link href="/tasks">
              <Button
                variant="default"
                className="relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2 text-sm"
              >
                <HiPlus className="w-4 h-4" />
                New Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Compact Stats Row - Uniform Height */}
        <div className="flex gap-2 lg:gap-6">
          {/* Task Analytics - Smaller text, even spacing */}
          <div className="flex-1 min-w-0">
            <Card className="bg-[var(--card)] rounded-lg p-3 shadow-sm h-20 flex flex-col justify-between border-none">
              <CardContent className="p-0 h-full flex flex-col justify-between">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                  <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                    Task Analytics
                  </h3>
                </div>
                <div className="flex items-center justify-between flex-1 gap-2">
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-base font-bold text-[var(--accent-foreground)] dark:text-[var(--accent-foreground)]">
                      {isAnyLoading ? (
                        <span className="animate-pulse bg-[var(--muted)] h-5 w-8 rounded block"></span>
                      ) : (
                        stats?.statistics?.totalTasks || 0
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">
                      Total
                    </span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-base font-bold text-[var(--accent-foreground)] dark:text-[var(--accent-foreground)]">
                      {isAnyLoading ? (
                        <span className="animate-pulse bg-[var(--muted)] h-5 w-8 rounded block"></span>
                      ) : (
                        stats?.statistics?.openTasks || 0
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">
                      Progress
                    </span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-base font-bold text-[var(--accent-foreground)] dark:text-[var(--accent-foreground)]">
                      {isAnyLoading ? (
                        <span className="animate-pulse bg-[var(--muted)] h-5 w-8 rounded block"></span>
                      ) : (
                        stats?.statistics?.completedTasks || 0
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">
                      Done
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Projects Card */}
          <div className="flex-1 min-w-0">
            <Card className="bg-[var(--card)] rounded-lg p-3 shadow-sm h-20 flex flex-col justify-between border-none">
              <CardContent className="p-0 h-full flex flex-col justify-between">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                  <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                    Projects
                  </h3>
                </div>
                <div className="flex items-center justify-center flex-1 gap-2">
                  <span className="text-base font-bold text-[var(--accent-foreground)] dark:text-[var(--accent-foreground)]">
                    {isAnyLoading ? (
                      <span className="animate-pulse bg-[var(--muted)] h-5 w-8 rounded block"></span>
                    ) : (
                      stats?.statistics?.activeProjects || 0
                    )}
                  </span>
                  <div className="w-4 h-4 text-[var(--muted-foreground)]">
                    <HiFolder className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide ml-2">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Workspaces Card */}
          <div className="flex-1 min-w-0">
            <Card className="bg-[var(--card)] rounded-lg p-3 shadow-sm h-20 flex flex-col justify-between border-none">
              <CardContent className="p-0 h-full flex flex-col justify-between">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                  <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                    Workspaces
                  </h3>
                </div>
                <div className="flex items-center justify-center flex-1 gap-2">
                  <span className="text-base font-bold text-[var(--accent-foreground)] dark:text-[var(--accent-foreground)]">
                    {isAnyLoading ? (
                      <span className="animate-pulse bg-[var(--muted)] h-5 w-8 rounded block"></span>
                    ) : (
                      stats?.statistics?.totalActiveWorkspaces || 0
                    )}
                  </span>
                  <div className="w-4 h-4 text-[var(--muted-foreground)]">
                    <HiUsers className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide ml-2">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content - Optimized Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* My Tasks - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-[var(--card)] rounded-lg shadow-sm">
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                    <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                      My Tasks
                    </h3>
                  </div>
                  <Link
                    href="/tasks"
                    className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary)]/90 flex items-center gap-1"
                  >
                    View all <HiChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] ml-3">
                  Stay on top of your work and deadlines
                </p>
              </div>

              <div className="px-4 pb-4">
                {isAnyLoading && !hasInitialized ? (
                  <div className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-600 mx-auto mb-3"></div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Loading your tasks...
                    </p>
                  </div>
                ) : dashboardTasks.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardTasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="block"
                        style={{ textDecoration: 'none' }}
                      >
                        <div
                          className="flex justify-between items-start gap-3 p-2 rounded-lg transition-colors group cursor-pointer hover:bg-[var(--muted)] "
                        >
                          {/* Left Column - Priority Dot + Title + Description */}
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div
                              className={`w-2 h-2 mt-2 rounded-full ${getPriorityColor(
                                task.priority
                              )} flex-shrink-0 mt-1 transition-all duration-200 cursor-pointer group/priority-dot hover:scale-125 hover:ring-2 hover:ring-offset-2 hover:ring-[var(--primary)]`}
                            >
                              <span className="absolute z-10 hidden group-hover/priority-dot:inline-block bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg -mt-8 ml-2 whitespace-nowrap pointer-events-none lowercase">
                                priority:{task.priority}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[var(--accent-foreground)]  ">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 ">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right Column - Status and Due Date */}
                          <div className="flex flex-col items-end gap-1">
                            {task.status && (
                              <span
                                className={`inline-block min-w-[80px] text-center px-2 py-0.5 rounded text-[12px] font-semibold ${getStatusColor(
                                  task.status.category
                                )}`}
                              >
                                {formatStatusText(task.status.category)}
                              </span>
                            )}
                            {task.dueDate && (
                              <div className="text-xs text-[var(--muted-foreground)] px-2 py-1 rounded-md whitespace-nowrap group-hover:text-[var(--primary)]">
                                {new Date(task.dueDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 mb-3 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                      <HiDocumentText className="w-6 h-6 text-[var(--muted-foreground)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--accent-foreground)] mb-1">
                      Ready to get started?
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">
                      Create your first task and start organizing your work.
                    </p>
                    <Link
                      href="/tasks/new"
                      className="w-full flex justify-center"
                    >
                      <Button
                        variant="default"
                        className="relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-1 text-xs mx-auto"
                      >
                        <HiPlus className="w-3 h-3" />
                        Create Task
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Workspaces */}
            <div className="bg-[var(--card)] rounded-lg shadow-sm">
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                    <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                      Workspaces
                    </h3>
                  </div>
                  <Link
                    href="/workspaces"
                    className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary)]/90 flex items-center gap-1"
                  >
                    View all <HiChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="px-4 pb-4">
                {activeOrganization?.workspaces &&
                activeOrganization.workspaces.length > 0 ? (
                  <div className="space-y-2">
                    {activeOrganization.workspaces
                      .slice(0, 3)
                      .map((workspace) => (
                        <Link
                          key={workspace.id}
                          href={`/${workspace.slug}`}
                          className="block"
                          style={{ textDecoration: 'none' }}
                        >
                          <div
                            className="flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-[var(--muted)]"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] rounded-lg flex items-center justify-center cursor-pointer w-8 h-8 min-w-8 min-h-8">
                                {workspace.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--accent-foreground)] truncate">
                                {workspace.name}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)] truncate">
                                {workspace.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 mb-2 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                      <HiFolder className="w-5 h-5 text-[var(--muted-foreground)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--accent-foreground)] mb-1">
                      Create workspace
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">
                      Start organizing your projects
                    </p>
                    <Link
                      href="/workspaces/new"
                      className="w-full flex justify-center"
                    >
                      <Button
                        variant="default"
                        className="relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-1 text-xs mx-auto"
                      >
                        <HiPlus className="w-3 h-3" />
                        New Workspace
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-[var(--card)] rounded-lg shadow-sm">
              <div className="p-4 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                  <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                    Recent Activities
                  </h3>
                </div>
              </div>

              <div className="px-4 pb-4">
                {stats?.recentActivities &&
                stats.recentActivities.length > 0 ? (
                  <div className="space-y-2">
                    {stats.recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 rounded-lg transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <BsFillLightningFill className="w-3 h-3 text-[var(--primary-foreground)] bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-full p-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--accent-foreground)]">
                            {activity.description}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            by {activity.user.name} •{" "}
                            {new Date(activity.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                      <BsFillLightningFill className="w-5 h-5 text-[var(--muted-foreground)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--accent-foreground)] mb-1">
                      No recent activities
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Activity will appear here as you work
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
