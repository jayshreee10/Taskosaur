import Link from "next/link";

import { useEffect, useState, useMemo } from "react";
import {
  getSidebarCollapsedState,
  toggleSidebar as toggleSidebarUtil,
} from "@/utils/sidebarUtils";
import ResizableSidebar from "./ResizableSidebar";
import WorkspaceSelector from "./WorkspaceSelector";
import ProjectSelector from "./ProjectSelector";

import {
  HiHome,
  HiViewGrid,
  HiClipboardList,
  HiUsers,
  HiCalendar,
  HiCog,
  HiMenu,
  HiLightningBolt,
  HiViewBoards,
} from "react-icons/hi";
import { useRouter } from "next/router";

// Type definitions
interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  title?: string;
}

const usePathnameParsing = (pathname: string, isMounted: boolean) => {
  return useMemo(() => {
    if (!isMounted)
      return { currentWorkspaceSlug: null, currentProjectSlug: null };

    const parts = pathname.split("/").filter(Boolean);

    // Define global routes that should not be treated as workspace slugs
    const globalRoutes = [
      "dashboard",
      "workspaces",
      "projects",
      "activities",
      "settings",
      "tasks",
    ];

    // Define workspace-level routes that should not be treated as project slugs
    const workspaceRoutes = [
      "projects",
      "members",
      "activities",
      "tasks",
      "analytics",
      "settings",
    ];
    if (parts.length === 0 || globalRoutes.includes(parts[0])) {
      return { currentWorkspaceSlug: null, currentProjectSlug: null };
    }

    if (parts.length === 1) {
      return { currentWorkspaceSlug: parts[0], currentProjectSlug: null };
    }

    if (parts.length >= 2) {
      // If the second part is a workspace-level route, don't treat it as a project slug
      if (workspaceRoutes.includes(parts[1])) {
        return { currentWorkspaceSlug: parts[0], currentProjectSlug: null };
      }
      return { currentWorkspaceSlug: parts[0], currentProjectSlug: parts[1] };
    }

    return { currentWorkspaceSlug: null, currentProjectSlug: null };
  }, [pathname, isMounted]);
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = router.asPath.split("?")[0];

  const [isMounted, setIsMounted] = useState(false);
  const [miniPathName, setMiniPathName] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return getSidebarCollapsedState();
    }
    return false;
  });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const { currentWorkspaceSlug, currentProjectSlug } = usePathnameParsing(
    pathname,
    isMounted
  );
  useEffect(() => {
    setIsMounted(true);
    const storedState = getSidebarCollapsedState();
    if (storedState !== isSidebarCollapsed) {
      setIsSidebarCollapsed(storedState);
    }
  }, []);

  const toggleSidebar = (forceValue?: boolean) => {
    setHasUserInteracted(true);
    toggleSidebarUtil(setIsSidebarCollapsed, forceValue);
  };

  useEffect(() => {
    if (!isMounted) return;

    const handleResize = () => {
      if (
        window.innerWidth < 768 &&
        !isSidebarCollapsed &&
        !hasUserInteracted
      ) {
        toggleSidebarUtil(setIsSidebarCollapsed, true);
      }
    };

    window.addEventListener("resize", handleResize);

    if (!hasUserInteracted) {
      handleResize();
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarCollapsed, hasUserInteracted]);

  const globalNavItems = useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: <HiHome size={16} />,
        title: "Global Dashboard",
      },
      {
        name: "Workspaces",
        href: "/workspaces",
        icon: <HiViewGrid size={16} />,
        title: "All Workspaces",
      },
      {
        name: "Projects",
        href: "/projects",
        icon: <HiViewBoards size={16} />,
        title: "All Projects",
      },
      {
        name: "Tasks",
        href: "/tasks",
        icon: <HiClipboardList size={16} />,
        title: "All Tasks",
      },
      {
        name: "Activities",
        href: "/activities",
        icon: <HiCalendar size={16} />,
        title: "All Activities",
      },
      {
        name: "Settings",
        href: "/settings",
        icon: <HiCog size={16} />,
        title: "All Settings",
      },
    ],
    []
  );

  const workspaceNavItems = useMemo(
    () =>
      currentWorkspaceSlug
        ? [
            {
              name: "Overview",
              href: `/${currentWorkspaceSlug}`,
              icon: <HiViewGrid size={16} />,
              title: "Workspace Overview",
            },
            {
              name: "Projects",
              href: `/${currentWorkspaceSlug}/projects`,
              icon: <HiViewBoards size={16} />,
              title: "Workspace Projects",
            },
            {
              name: "Members",
              href: `/${currentWorkspaceSlug}/members`,
              icon: <HiUsers size={16} />,
              title: "Workspace Members",
            },
            {
              name: "Activities",
              href: `/${currentWorkspaceSlug}/activities`,
              icon: <HiCalendar size={16} />,
              title: "Workspace Activity",
            },
            {
              name: "Tasks",
              href: `/${currentWorkspaceSlug}/tasks`,
              icon: <HiClipboardList size={16} />,
              title: "Workspace Tasks",
            },
            // { name: 'Analytics', href: `/${currentWorkspaceSlug}/analytics`, icon: <HiChartBar size={16} />, title: 'Workspace Analytics' },
            {
              name: "Settings",
              href: `/${currentWorkspaceSlug}/settings`,
              icon: <HiCog size={16} />,
              title: "Workspace Settings",
            },
          ]
        : [],
    [currentWorkspaceSlug]
  );

  const projectNavItems = useMemo(
    () =>
      currentWorkspaceSlug && currentProjectSlug
        ? [
            {
              name: "Overview",
              href: `/${currentWorkspaceSlug}/${currentProjectSlug}`,
              icon: <HiViewBoards size={16} />,
              title: "Project Overview",
            },
            {
              name: "Tasks",
              href: `/${currentWorkspaceSlug}/${currentProjectSlug}/tasks`,
              icon: <HiClipboardList size={16} />,
              title: "Tasks",
            },
            {
              name: "Sprints",
              href: `/${currentWorkspaceSlug}/${currentProjectSlug}/sprints`,
              icon: <HiLightningBolt size={16} />,
              title: "Sprints",
            },
            {
              name: "Calendar",
              href: `/${currentWorkspaceSlug}/${currentProjectSlug}/tasks/calendar`,
              icon: <HiCalendar size={16} />,
              title: "Calendar",
            },
            // { name: 'Time', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/time`, icon: <HiClock size={16} />, title: 'Time Tracking' },
            // { name: 'Analytics', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/analytics`, icon: <HiChartBar size={16} />, title: 'Analytics' },
            {
              name: "Members",
              href: `/${currentWorkspaceSlug}/${currentProjectSlug}/members`,
              icon: <HiUsers size={16} />,
              title: "Members",
            },
            {
              name: "Settings",
              href: `/${currentWorkspaceSlug}/${currentProjectSlug}/settings`,
              icon: <HiCog size={16} />,
              title: "Settings",
            },
          ]
        : [],
    [currentWorkspaceSlug, currentProjectSlug]
  );

  const navigationItems: NavItem[] = useMemo(() => {
    if (currentWorkspaceSlug && currentProjectSlug) return projectNavItems;
    if (currentWorkspaceSlug) return workspaceNavItems;
    return globalNavItems;
  }, [
    currentWorkspaceSlug,
    currentProjectSlug,
    globalNavItems,
    workspaceNavItems,
    projectNavItems,
  ]);
  const miniSidebarNavItems = useMemo(() => {
    if (currentWorkspaceSlug && currentProjectSlug) {
      setMiniPathName(`/${currentWorkspaceSlug}`);
      return workspaceNavItems;
    }
    if (currentWorkspaceSlug) {
      setMiniPathName("/workspaces");
      return globalNavItems;
    }
    return [];
  }, [
    currentWorkspaceSlug,
    currentProjectSlug,
    globalNavItems,
    workspaceNavItems,
  ]);
  // Listen for sidebar state changes from other components
  useEffect(() => {
    const handleSidebarStateChange = (event: CustomEvent) => {
      setIsSidebarCollapsed(event.detail.collapsed);
    };

    window.addEventListener(
      "sidebarStateChange",
      handleSidebarStateChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "sidebarStateChange",
        handleSidebarStateChange as EventListener
      );
    };
  }, []);

  // const getSidebarColor = () => {
  //   return "bg-[var(--sidebar)]";
  // };

  const renderFullSidebar = () => (
    <div className="layout-sidebar-full">
      <div className="layout-sidebar-header">
        {/* Global Dashboard */}
        {!currentWorkspaceSlug &&
          globalNavItems.length > 0 &&
          (() => {
            const activeItem = globalNavItems.find(
              (item) =>
                pathname.replace(/\/$/, "") === item.href.replace(/\/$/, "")
            );
            return (
              <div className="layout-sidebar-header-dashboard">
                <div className="layout-sidebar-header-dashboard-content">
                  <div className="layout-sidebar-header-dashboard-icon">
                    {activeItem ? activeItem.icon : "TS"}
                  </div>
                  <span className="layout-sidebar-header-dashboard-title">
                    {activeItem ? activeItem.name : "Taskosaur"}
                  </span>
                </div>
              </div>
            );
          })()}

        {/* Workspace Level */}
        {currentWorkspaceSlug && !currentProjectSlug && (
          <WorkspaceSelector currentWorkspaceSlug={currentWorkspaceSlug} />
        )}

        {/* Project Level */}
        {currentWorkspaceSlug && currentProjectSlug && (
          <ProjectSelector
            currentWorkspaceSlug={currentWorkspaceSlug}
            currentProjectSlug={currentProjectSlug}
          />
        )}
      </div>

      <nav className="layout-sidebar-nav">
        <ul className="layout-sidebar-nav-list">
          {navigationItems.map((item) => {
            return (
              <li key={item.name} className="layout-sidebar-nav-item">
                <Link
                  href={item.href}
                  className={`layout-sidebar-nav-link ${
                    pathname.replace(/\/$/, "") === item.href.replace(/\/$/, "")
                      ? "layout-sidebar-nav-link-active"
                      : "layout-sidebar-nav-link-inactive"
                  }`}
                >
                  <span className="layout-sidebar-nav-link-icon">
                    {item.icon}
                  </span>
                  <span className="layout-sidebar-nav-link-text">
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  const renderMiniSidebar = () => {
    if (!isMounted) {
      return (
        <div className="layout-sidebar-mini">
          <div className="mb-6 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--sidebar-muted)]">
            <HiMenu size={16} />
          </div>
          <div className="flex-grow flex flex-col items-center gap-4"></div>
        </div>
      );
    }
    return (
      <div className="layout-sidebar-mini">
        <button
          onClick={() => toggleSidebar(!isSidebarCollapsed)}
          className="layout-sidebar-mini-expand-button"
          title="Expand navigation"
        >
          <HiMenu size={16} />
        </button>

        <div className="layout-sidebar-mini-nav">
          {miniSidebarNavItems.map((item) => {
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`layout-sidebar-mini-nav-link ${
                  miniPathName === item.href
                    ? "layout-sidebar-nav-link-active"
                    : "layout-sidebar-mini-nav-link-inactive"
                }`}
                title={item.title || item.name}
              >
                {item.icon}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // Hide sidebar on /organization page
  const isOrganizationPage = isMounted && pathname === "/organization";

  if (isOrganizationPage) {
    return null;
  }

  return (
    <>
      {isSidebarCollapsed && (
        <button
          onClick={() => toggleSidebar(!isSidebarCollapsed)}
          className="layout-sidebar-toggle-button"
          title="Show navigation"
        >
          <HiMenu size={16} />
        </button>
      )}

      <div className="layout-sidebar-container">
        <div
          className={`layout-sidebar-wrapper ${
            isSidebarCollapsed
              ? "layout-sidebar-wrapper-collapsed"
              : "layout-sidebar-wrapper-expanded"
          }`}
        >
          <div className="layout-sidebar-mini">
            {/* Mini sidebar content */}
            {renderMiniSidebar()}
          </div>

          <div className="layout-sidebar-main">
            {isMounted ? (
              <ResizableSidebar
                minWidth={200}
                maxWidth={400}
                className="layout-sidebar-resizable"
              >
                {renderFullSidebar()}
              </ResizableSidebar>
            ) : (
              <div className="layout-sidebar-resizable-fallback">
                {renderFullSidebar()}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isSidebarCollapsed && (
        <div
          className="layout-sidebar-overlay"
          onClick={() => toggleSidebar(!isSidebarCollapsed)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
