"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getSidebarCollapsedState,
  toggleSidebar as toggleSidebarUtil,
} from "@/utils/sidebarUtils";
import OrganizationSelector from "@/components/organizations/OrganizationSelector";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/contexts/auth-context";
import {
  HiPlus,
  HiChevronDown,
  HiBell,
  HiCog,
  HiCommandLine,
  HiSparkles,
  HiRocketLaunch,
} from "react-icons/hi2";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "./ModeToggle";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { notificationApi } from "@/utils/api/notificationApi";
import { organizationApi } from "@/utils/api/organizationApi";


export default function Header() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  
  // ✅ Add notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const pathname = usePathname();
  const { 
    getCurrentUser, 
    logout, 
    checkOrganizationAndRedirect,
  } = useAuth();

 useEffect(() => {
  const initializeComponent = async () => {
    setIsClient(true);
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Only fetch notifications if user exists
    if (!user?.id) {
      console.log('No user found, skipping notification fetch');
      return;
    }

    const currentOrgId = localStorage.getItem("currentOrganizationId")
    console.log('Current organization:', currentOrgId);
    
    if (!currentOrgId) {
      console.log('No organization found, skipping notification fetch');
      return;
    }

    try {
      setLoadingNotifications(true);
      
      const response = await notificationApi.getNotificationsByUserAndOrganization(
        user.id, // Use user directly instead of currentUser
        currentOrgId,
        {
          isRead: false,
          page: 1,      
          limit: 3       
        }
      );

      setNotifications(response.notifications);
      setUnreadCount(response.pagination.totalCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  initializeComponent();
}, []); // Keep getCurrentUser dependency


  // Check if user has organization access
  // Fix: use state and effect, do not use await in function body
  const [hasOrganizationAccess, setHasOrganizationAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (isClient) {
        const redirectPath = await checkOrganizationAndRedirect();
        setHasOrganizationAccess(redirectPath !== '/organization');
      }
    };
    checkAccess();
  }, [isClient, checkOrganizationAndRedirect]);

  const isExactGlobalRoute =
    pathname === "/workspaces" ||
    pathname === "/dashboard" ||
    pathname === "/activity" ||
    pathname === "/settings" ||
    pathname === "/tasks";

  const pathParts = pathname.split("/").filter(Boolean);

  const getContextLevel = () => {
    if (pathParts.length === 0) return "global";

    if (
      pathParts.length === 1 &&
      ["dashboard", "workspaces", "activity", "settings", "tasks"].includes(
        pathParts[0]
      )
    ) {
      return "global";
    }

    if (
      pathParts.length > 1 &&
      ["dashboard", "workspaces", "activity", "settings", "tasks"].includes(
        pathParts[0]
      )
    ) {
      return "global-nested";
    }

    // Handle workspace homepage route (e.g., /workspace-slug)
    if (
      pathParts.length === 1 &&
      !["dashboard", "workspaces", "activity", "settings", "tasks"].includes(
        pathParts[0]
      )
    ) {
      return "workspace";
    }

    if (
      pathParts.length === 2 &&
      !["dashboard", "workspaces", "activity", "settings", "tasks"].includes(
        pathParts[0]
      ) &&
      [
        "projects",
        "members",
        "activity",
        "tasks",
        "analytics",
        "settings",
      ].includes(pathParts[1])
    ) {
      return "workspace";
    }

    if (
      pathParts.length > 2 &&
      !["dashboard", "workspaces", "activity", "settings", "tasks"].includes(
        pathParts[0]
      ) &&
      [
        "projects",
        "members",
        "activity",
        "tasks",
        "analytics",
        "settings",
      ].includes(pathParts[1])
    ) {
      return "workspace-nested";
    }

    if (
      pathParts.length >= 2 &&
      !["dashboard", "workspaces", "activity", "settings", "tasks"].includes(
        pathParts[0]
      ) &&
      ![
        "projects",
        "members",
        "activity",
        "tasks",
        "analytics",
        "settings",
      ].includes(pathParts[1])
    ) {
      return "project";
    }

    return "unknown";
  };

  const contextLevel = getContextLevel();

  const workspaceSlug =
    contextLevel === "workspace" ||
    contextLevel === "workspace-nested" ||
    contextLevel === "project"
      ? pathParts[0]
      : null;

  const projectSlug = contextLevel === "project" ? pathParts[1] : null;

  useEffect(() => {
    const checkSidebarState = () => {
      const collapsed = getSidebarCollapsedState();
      setIsSidebarCollapsed(collapsed);
    };

    checkSidebarState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sidebarCollapsed") {
        checkSidebarState();
      }
    };

    const handleSidebarStateChange = (
      e: CustomEvent<{ collapsed: boolean }>
    ) => {
      setIsSidebarCollapsed(e.detail.collapsed);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "sidebarStateChange",
      handleSidebarStateChange as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "sidebarStateChange",
        handleSidebarStateChange as EventListener
      );
    };
  }, []);

  const toggleSidebar = () => {
    const isSmallScreen =
      typeof window !== "undefined" && window.innerWidth < 768;

    if (isSmallScreen) {
      toggleSidebarUtil(setIsSidebarCollapsed, false);
    } else {
      toggleSidebarUtil(setIsSidebarCollapsed);
    }
  };

  // ✅ Helper function to format notification time
  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  // ✅ Handle marking notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // ✅ Get user initials for notification avatars
  const getNotificationUserInitials = (user: any) => {
    if (!user?.firstName && !user?.lastName) return 'U';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getInitials = () => {
    if (!isClient || !currentUser) return "U";

    const firstName = currentUser.firstName || "";
    const lastName = currentUser.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getFullName = () => {
    if (!isClient || !currentUser) return "User";
    const firstName = currentUser.firstName || "";
    const lastName = currentUser.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "User";
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      alert("Failed to logout. Please try again.");
    }
  };

  const handleCreateProject = async (projectData: {
    name: string;
    slug: string;
    description: string;
    workspaceId: string;
    color: string;
    avatar: string;
  }) => {
    try {
      // TODO: Implement project creation API call
      console.log("Creating project:", projectData);
      // For now, just redirect to the workspace after "creation"
      window.location.href = `/workspace-slug/projects`;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Section - Create Button (only show if has organization access) */}
        <div className="flex items-center">
          {hasOrganizationAccess && (
            <div
              className={`transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? "md:ml-16" : "md:ml-0"
              }`}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    className="cursor-pointer relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg"
                  >
                    <HiPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Create</span>
                    <HiChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>

                {/* <DropdownMenuContent
                  className="w-80 p-0 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm"
                  align="start"
                  sideOffset={8}
                >
                  <div className="px-4 py-3 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-b border-[var(--border)]/30">
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      Create New
                    </h3>
                  </div>
                </DropdownMenuContent> */}

                <DropdownMenuContent
                  className="w-80 p-0 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm"
                  align="start"
                  sideOffset={8}
                >
                  <div className="px-4 py-3 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-b border-[var(--border)]/30">
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      Create New
                    </h3>
                  </div>

                  <div className="p-2">
                    {contextLevel === "global" && (
                      <>
                        <DropdownMenuItem
                          asChild
                          className="flex items-center gap-2 px-2 rounded cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200"
                        >
                          <Link
                            href="/workspaces/new"
                            className="flex items-center w-full"
                          >
                            <div className="w-6 h-6 rounded bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                              <HiCommandLine className="size-3 text-[var(--primary)]" />
                            </div>
                            <div className="text-left flex-1 min-w-0 ml-2">
                              <div className="text-xs font-semibold text-[var(--foreground)] mb-0">
                                New Workspace
                              </div>
                              <div className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">
                                Create a workspace for your team
                              </div>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 px-2 rounded cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200"
                          onClick={() => setShowNewProjectModal(true)}
                        >
                          <div className="w-6 h-6 rounded bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                            <HiRocketLaunch className="size-3 text-[var(--primary)]" />
                          </div>
                          <div className="text-left flex-1 min-w-0 ml-2">
                            <div className="text-xs font-semibold text-[var(--foreground)] mb-0">
                              New Project
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">
                              Start a new project
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}

                    {contextLevel === "workspace" && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 rounded cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200"
                      >
                        <Link
                          href={`/${workspaceSlug}/projects/new`}
                          className="flex items-center w-full"
                        >
                          <div className="w-6 h-6 rounded bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                            <HiRocketLaunch className="size-3 text-[var(--primary)]" />
                          </div>
                          <div className="text-left flex-1 min-w-0 ml-2">
                            <div className="text-xs font-semibold text-[var(--foreground)] mb-0">
                              New Project
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">
                              Start a new project
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {contextLevel === "project" && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 rounded cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200"
                      >
                        <Link
                          href={`/${workspaceSlug}/${projectSlug}/tasks/new`}
                          className="flex items-center w-full"
                        >
                          <div className="w-6 h-6 rounded bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                            <HiPlus className="size-3 text-[var(--primary)]" />
                          </div>
                          <div className="text-left flex-1 min-w-0 ml-2">
                            <div className="text-xs font-semibold text-[var(--foreground)] mb-0">
                              New Task
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">
                              Add a task to this project
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Center Section - Empty */}
        <div className="flex-1"></div>

        {/* Right Section - Conditional rendering based on organization access */}
        <div className="flex items-center gap-2">
          {/* Organization Selector (only show if has organization access) */}
          {hasOrganizationAccess && <OrganizationSelector />}

          {/* ✅ Updated Notifications Dropdown */}
          {hasOrganizationAccess && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer relative h-7 w-7 hover:bg-[var(--accent)] transition-colors rounded-md flex items-center justify-center"
                >
                  <HiBell className="w-4 h-4 text-[var(--muted-foreground)]" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-medium min-w-[16px] bg-red-500 text-white border-0"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 p-0 bg-[var(--card)] border border-[var(--border)] shadow-lg rounded-lg mt-1"
                align="end"
                sideOffset={4}
              >
                <div className="py-3 px-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[var(--foreground)]">Notifications</span>
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">{unreadCount}</span>
                  </div>
                  
                  {loadingNotifications ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                          <div className="w-8 h-8 bg-[var(--muted)] rounded-full"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                            <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <HiBell className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--muted-foreground)]">No new notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-start gap-3 p-3 hover:bg-[var(--accent)] rounded-lg transition-colors cursor-pointer"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {notification.createdByUser 
                              ? getNotificationUserInitials(notification.createdByUser)
                              : 'S'
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[var(--foreground)] mb-1 line-clamp-1">
                              {notification.title}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)] mb-1 line-clamp-2">
                              {notification.message}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {formatNotificationTime(notification.createdAt)}
                            </div>
                          </div>
                          {/* Priority indicator */}
                          {(notification.priority === 'HIGH' || notification.priority === 'URGENT') && (
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {unreadCount > 3 && (
                    <div className="pt-3 border-t border-gray-100 text-center">
                      <Link 
                        href="/notifications"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 rounded px-3 py-1.5 hover:bg-blue-100 transition-colors inline-block"
                      >
                        View All {unreadCount} Notifications
                      </Link>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ModeToggle />

          {/* Separator (only show if has organization access) */}
          {hasOrganizationAccess && (
            <div className="h-6 w-px bg-[var(--border)] mx-1"></div>
          )}

          {/* Enhanced User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="cursor-pointer flex items-center gap-2 h-9 px-2 hover:bg-[var(--accent)]/50 transition-colors min-w-0 rounded-md"
              >
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] text-[13px] font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex text-left min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--foreground)] leading-none truncate max-w-[80px]">
                    {getFullName()}
                  </div>
                </div>
                <HiChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-60 p-0 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm"
              align="end"
              sideOffset={6}
            >
              {/* User Profile Header */}
              <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-b border-[var(--border)]/30">
                <Avatar className="size-7 flex-shrink-0 ring-1 ring-[var(--primary)]/20">
                  <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] font-bold text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--foreground)] truncate mb-0">
                    {isClient ? getFullName() : "User"}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate mb-0">
                    {isClient && currentUser?.email ? currentUser.email : ""}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[12px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 px-2 mt-2 "
                  >
                    Admin
                  </Badge>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {/* Settings (only show if has organization access) */}
                {hasOrganizationAccess && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-2  rounded cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200"
                    >
                      <div className="w-6 h-6 rounded bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                        <HiCog className="size-3 text-[var(--primary)]" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[var(--foreground)] mb-0">
                          Settings
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* Show separator only if settings is shown */}
                {hasOrganizationAccess && (
                  <DropdownMenuSeparator className="my-1" />
                )}

                {/* Logout (always show) */}
                <DropdownMenuItem
                  className="flex items-center gap-2 px-2  rounded text-[var(--destructive)] hover:bg-[var(--destructive)]/10 focus:text-[var(--destructive)] cursor-pointer transition-all duration-200"
                  onClick={handleLogout}
                >
                  <div className="w-6 h-6 rounded bg-[var(--destructive)]/10 flex items-center justify-center flex-shrink-0">
                    <RiLogoutCircleRLine className="size-3 text-[var(--destructive)]" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-xs font-semibold mb-0">Logout</div>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Project Modal */}
      {hasOrganizationAccess && (
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </header>
  );
}
