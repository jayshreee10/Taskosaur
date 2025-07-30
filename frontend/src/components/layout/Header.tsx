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

export default function Header() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const pathname = usePathname();
  const { getCurrentUser, logout } = useAuth();

  useEffect(() => {
    setIsClient(true);
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [getCurrentUser]);

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
      console.log('Creating project:', projectData);
      // For now, just redirect to the workspace after "creation"
      window.location.href = `/workspace-slug/projects`;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)]/40 bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left Section - Create Button */}
        <div className="flex items-center">
          <div
            className={`transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? "md:ml-16" : "md:ml-0"
            }`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg"
                >
                  <HiPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">Create</span>
                  <HiChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-80 p-0 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm" align="start" sideOffset={8}>
                <div className="px-4 py-3 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-b border-[var(--border)]/30">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Create New</h3>
                </div>
                
                <div className="p-2">
                  {contextLevel === "global" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/workspaces/new"
                          className="flex items-center gap-4 px-4 py-4 cursor-pointer rounded-lg hover:bg-[var(--accent)]/50 transition-all duration-200"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                            <HiCommandLine className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[var(--foreground)] mb-1">New Workspace</div>
                            <div className="text-xs text-[var(--muted-foreground)] leading-relaxed">Create a workspace for your team</div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="flex items-center gap-4 px-4 py-4 cursor-pointer rounded-lg hover:bg-[var(--accent)]/50 transition-all duration-200"
                        onClick={() => setShowNewProjectModal(true)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                          <HiRocketLaunch className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--foreground)] mb-1">New Project</div>
                          <div className="text-xs text-[var(--muted-foreground)] leading-relaxed">Start a new project</div>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}

                  {contextLevel === "workspace" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/${workspaceSlug}/projects/new`}
                        className="flex items-center gap-4 px-4 py-4 cursor-pointer rounded-lg hover:bg-[var(--accent)]/50 transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                          <HiRocketLaunch className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--foreground)] mb-1">New Project</div>
                          <div className="text-xs text-[var(--muted-foreground)] leading-relaxed">Start a new project</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {contextLevel === "project" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/${workspaceSlug}/${projectSlug}/tasks/new`}
                        className="flex items-center gap-4 px-4 py-4 cursor-pointer rounded-lg hover:bg-[var(--accent)]/50 transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                          <HiPlus className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--foreground)] mb-1">New Task</div>
                          <div className="text-xs text-[var(--muted-foreground)] leading-relaxed">Add a task to this project</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center Section - Empty */}
        <div className="flex-1"></div>

        {/* Right Section - Organization, Actions & User Menu */}
        <div className="flex items-center gap-2">
          
          {/* Organization Selector */}
          {(isExactGlobalRoute ||
            contextLevel === "workspace" ||
            contextLevel === "workspace-nested") && (
            <OrganizationSelector />
          )}
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 hover:bg-[var(--accent)]/50 transition-colors rounded-lg flex items-center justify-center"
              >
                <HiBell className="w-5 h-5" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium min-w-[20px] bg-[var(--destructive)] text-[var(--destructive-foreground)]"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <NotificationCenter />
          </DropdownMenu>

          {/* Theme Toggle */}
          <ModeToggle />

          {/* Separator */}
          <div className="h-6 w-px bg-[var(--border)] mx-1"></div>

          {/* Enhanced User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 hover:bg-[var(--accent)]/50 transition-colors min-w-0 rounded-lg"
              >
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex text-left min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--foreground)] leading-none truncate max-w-[100px]">
                    {getFullName()}
                  </div>
                </div>
                <HiChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-80 p-0 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm" align="end" sideOffset={8}>
              {/* User Profile Header */}
              <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-b border-[var(--border)]/30">
                <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-[var(--primary)]/20">
                  <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] font-bold text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[var(--foreground)] truncate mb-1">
                    {isClient ? getFullName() : "User"}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] truncate mb-2">
                    {isClient && currentUser?.email ? currentUser.email : ""}
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                    Admin
                  </Badge>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-4 px-4 py-4 rounded-lg cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200">
                    <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                      <HiCog className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--foreground)] mb-1">Settings</div>
                      <div className="text-xs text-[var(--muted-foreground)] leading-relaxed">Manage your account preferences</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem 
                  className="flex items-center gap-4 px-4 py-4 rounded-lg text-[var(--destructive)] hover:bg-[var(--destructive)]/10 focus:text-[var(--destructive)] cursor-pointer transition-all duration-200"
                  onClick={handleLogout}
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--destructive)]/10 flex items-center justify-center flex-shrink-0">
                    <RiLogoutCircleRLine className="w-5 h-5 text-[var(--destructive)]" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-1">Logout</div>
                    <div className="text-xs text-[var(--destructive)]/70 leading-relaxed">Sign out of your account</div>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleCreateProject}
      />
    </header>
  );
}
