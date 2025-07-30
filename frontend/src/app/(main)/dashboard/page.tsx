"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getProjects, getWorkspaces, getTasks, getOrganizations } from "@/utils/apiUtils";
import { StatusCategory } from "@/types/tasks";
import { useTheme } from "next-themes";

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Import custom components
import { TodayAgenda } from "@/components/dashboard/TodayAgenda";
import { useCalendar } from "@/hooks/useCalendar";

// Keep only the custom components you need
import {
  IconButton,
  SectionHeader,
  EmptyState,
  ActivityItem,
  WorkspaceCard,
  QuickActionCard,
} from "@/components/ui";

import {
  HiPlus,
  HiChevronRight,
  HiClock,
  HiCheckCircle,
  HiDocumentText,
  HiFolder,
  HiDotsVertical,
  HiLightningBolt,
  HiTerminal,
  HiCode,
  HiCog,
  HiCalendar,
  HiTrendingUp,
  HiTrendingDown,
  HiStar,
  HiViewBoards,
  HiUser,
  HiX,
  HiExclamation,
  HiUsers,
  HiVideoCamera,
  HiLocationMarker,
} from "react-icons/hi";

interface Project {
  id: string;
  name: string;
  slug: string;
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

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { getCurrentUser, isAuthenticated } = useAuth();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDashboardRoute = pathname === '/dashboard';

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInvalidToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("currentOrganizationId");
      sessionStorage.removeItem("access_token");
    }
    router.push('/login');
  }, [router]);

  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    openTasks: 0,
    completedTasks: 0,
    totalProjects: 0,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isFetchingRef = useRef(false);
  const isWorkspacesFetchingRef = useRef(false);
  const [showTodayAgenda, setShowTodayAgenda] = useState(false);

  // Calendar integration
  const { 
    getTodayEvents, 
    formatEventTime, 
    integration: calendarIntegration 
  } = useCalendar();

  const currentUser = isHydrated ? getCurrentUser() : null;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentOrganizationId' && isHydrated) {
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
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('organizationChanged', handleOrganizationChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('organizationChanged', handleOrganizationChange);
    };
  }, [isHydrated]);

  const fetchData = useCallback(async () => {
    const currentOrganizationId = typeof window !== 'undefined' ? localStorage.getItem("currentOrganizationId") : null;
    
    if (!isHydrated || isLoading || hasInitialized || isFetchingRef.current || !isDashboardRoute) {
      return;
    }

    if (!isAuthenticated()) {
      handleInvalidToken();
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      const projectsData = await getProjects();
      setProjects(projectsData || []);

      const tasksData = await getTasks();
      const openTasks = tasksData?.filter(task => task.status.category !== StatusCategory.DONE) || [];
      const completedTasks = tasksData?.filter(task => task.status.category === StatusCategory.DONE) || [];

      if (currentOrganizationId && !isWorkspacesFetchingRef.current) {
        try {
          isWorkspacesFetchingRef.current = true;
          const workspacesData = await getWorkspaces(currentOrganizationId);
          
          const organizations = await getOrganizations();
          const currentOrg = organizations.find(org => org.id === currentOrganizationId);
          
          const organizationWithWorkspaces = {
            id: currentOrganizationId,
            name: currentOrg?.name || 'Current Organization',
            slug: currentOrg?.slug || '',
            workspaces: workspacesData || []
          };
          
          setActiveOrganization(organizationWithWorkspaces);

        } catch (error) {
          console.error(`Error fetching workspaces for organization:`, error);
          setActiveOrganization(null);
        } finally {
          isWorkspacesFetchingRef.current = false;
        }
      } else {
        if (!currentOrganizationId) {
          setActiveOrganization(null);
        }
      }

      setStats({
        totalTasks: tasksData?.length || 0,
        openTasks: openTasks.length,
        completedTasks: completedTasks.length,
        totalProjects: projectsData?.length || 0,
      });
      setHasInitialized(true);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isHydrated, isLoading, hasInitialized, handleInvalidToken, isDashboardRoute, pathname]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const activeWorkspaces = activeOrganization?.workspaces || [];
  const defaultWorkspace = activeWorkspaces[0] || { slug: "default", id: "default" };
  const defaultProject = projects[0] || { slug: "default", id: "default" };

  // Helper functions for enhanced header
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUpcomingDeadlines = () => {
    // Mock data for now - replace with real API call
    return [
      { id: 1, title: "Complete project proposal", dueDate: "Today", priority: "high" as const },
      { id: 2, title: "Review team presentations", dueDate: "Tomorrow", priority: "medium" as const },
      { id: 3, title: "Client meeting preparation", dueDate: "Friday", priority: "high" as const },
    ];
  };

  // Convert calendar events to meeting format for TodayAgenda
  const getTodayMeetings = () => {
    const todayEvents = getTodayEvents();
    return todayEvents.map((event, index) => ({
      id: index + 1,
      title: event.title,
      time: formatEventTime(event.start, event.end),
      type: event.type === 'meeting' ? 'team' as const : 'in-person' as const,
      location: event.location,
      attendees: event.attendees?.length,
      icon: event.type === 'meeting' ? HiUsers : HiUser,
      iconBg: event.color ? `bg-[${event.color}]/10` : "bg-blue-500/10"
    }));
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Personalized Greeting */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {currentUser?.firstName?.charAt(0) || "U"}{currentUser?.lastName?.charAt(0) || ""}
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    {getTimeBasedGreeting()}, {currentUser?.firstName || "User"}!
                  </h1>
                  <p className="text-sm lg:text-base text-muted-foreground mt-1">
                    {getCurrentDate()} • Ready to tackle your goals?
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTodayAgenda(true)}
                className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-all duration-200 hover:border-[var(--primary)]/50 relative"
              >
                <HiCalendar className="w-4 h-4 mr-2" />
                Today's Agenda
                {calendarIntegration.isConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--background)]" />
                )}
              </Button>
              <Link href="/tasks">
                <Button 
                  size="sm" 
                  className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 transition-all duration-200"
                >
                  <HiPlus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 lg:mb-8">
          {/* Total Tasks Card */}
          <Card className="border-[var(--border)] bg-[var(--card)] hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                  <HiViewBoards className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                      Total Tasks
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.totalTasks}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <HiTrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-medium text-green-500">+12%</span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">from last week</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Tasks Card */}
          <Card className="border-[var(--border)] bg-[var(--card)] hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 flex-shrink-0">
                  <HiClock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                      Open Tasks
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.openTasks}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <HiTrendingDown className="w-3 h-3 text-red-500" />
                        <span className="text-xs font-medium text-red-500">-5%</span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">from last week</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Tasks Card */}
          <Card className="border-[var(--border)] bg-[var(--card)] hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 flex-shrink-0">
                  <HiCheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.completedTasks}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <HiTrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-medium text-green-500">+20%</span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">from last week</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects Card */}
          <Card className="border-[var(--border)] bg-[var(--card)] hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
                  <HiFolder className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                      Active Projects
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.totalProjects}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <HiTrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-medium text-green-500">+3</span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">new this month</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* F-Pattern Dashboard Layout - Hero Tasks + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Primary Content Area - My Tasks (Hero Section) */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks - Primary Focus */}
            <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="border-b border-[var(--border)]/50 pb-4 lg:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl lg:text-2xl font-bold text-[var(--foreground)] mb-2">
                      My Tasks
                    </CardTitle>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Stay on top of your work and deadlines
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Link 
                      href="/tasks" 
                      className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 transition-colors"
                    >
                      View all <HiChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
                {isLoading && !hasInitialized ? (
                  <div className="py-16 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] mx-auto mb-4"></div>
                    <p className="text-[var(--muted-foreground)]">Loading your tasks...</p>
                  </div>
                ) : (
                  <EmptyState
                    icon={<HiDocumentText className="w-16 h-16" />}
                    title="Ready to get started?"
                    description="Create your first task and start organizing your work efficiently."
                    action={
                      <Link href={`/${defaultWorkspace.slug}/${defaultProject.slug}/tasks/new`}>
                        <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]">
                          <HiPlus className="w-4 h-4 mr-2" />
                          Create Task
                        </Button>
                      </Link>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Secondary Content */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            {/* Workspaces - Compact */}
            <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-[var(--foreground)]">
                    Workspaces
                  </CardTitle>
                  <Link 
                    href="/workspaces" 
                    className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 transition-colors"
                  >
                    View all <HiChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {activeOrganization?.workspaces && activeOrganization.workspaces.length > 0 ? (
                  <div className="space-y-3">
                    {activeOrganization.workspaces.slice(0, 3).map((workspace) => (
                      <WorkspaceCard key={workspace.id} workspace={workspace} />
                    ))}
                    {activeOrganization.workspaces.length > 3 && (
                      <Link 
                        href="/workspaces"
                        className="block text-center text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] py-2 transition-colors"
                      >
                        +{activeOrganization.workspaces.length - 3} more workspaces
                      </Link>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={<HiFolder className="w-8 h-8" />}
                    title="Create workspace"
                    description="Start organizing your projects"
                    action={
                      <Link href="/workspaces/new">
                        <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]">
                          <HiPlus className="w-3 h-3 mr-1" />
                          New Workspace
                        </Button>
                      </Link>
                    }
                  />
                )}
              </CardContent>
            </Card>


            {/* Recent Activity - Compact */}
            <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--foreground)]">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <ActivityItem
                    icon={<HiCheckCircle className="w-3 h-3" />}
                    title="Task completed"
                    time="2h ago"
                    iconBg="bg-green-500/10 text-green-500"
                  />
                  <ActivityItem
                    icon={<HiLightningBolt className="w-3 h-3" />}
                    title="Project created"
                    time="5h ago"
                    iconBg="bg-blue-500/10 text-blue-500"
                  />
                  <ActivityItem
                    icon={<HiUser className="w-3 h-3" />}
                    title="Member added"
                    time="1d ago"
                    iconBg="bg-amber-500/10 text-amber-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Today's Agenda Modal */}
        <TodayAgenda
          isOpen={showTodayAgenda}
          onClose={() => setShowTodayAgenda(false)}
          currentDate={getCurrentDate()}
          upcomingTasks={getUpcomingDeadlines()}
          todayMeetings={getTodayMeetings()}
        />
      </div>
    </div>
  );
}