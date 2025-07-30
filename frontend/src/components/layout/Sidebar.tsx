'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { getSidebarCollapsedState, toggleSidebar as toggleSidebarUtil } from '@/utils/sidebarUtils';
import ResizableSidebar from './ResizableSidebar';
import '@/styles/layouts/resizable-sidebar.css';
import '@/styles/layouts/sidebar.css';

import { 
  HiHome, 
  HiViewGrid, 
  HiClipboardList, 
  HiUsers, 
  HiCalendar, 
  HiChartBar, 
  HiCog, 
  HiPlus, 
  HiX, 
  HiMenu, 
  HiChevronDown,
  HiLightningBolt,
  HiClock,
  HiViewBoards
} from 'react-icons/hi';

// Type definitions
interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  title?: string;
}

const usePathnameParsing = (pathname: string, isMounted: boolean) => {
  return useMemo(() => {
    if (!isMounted) return { currentWorkspaceSlug: null, currentProjectSlug: null };
    
    const parts = pathname.split('/').filter(Boolean);
    
    // Define global routes that should not be treated as workspace slugs
    const globalRoutes = ['dashboard', 'workspaces', 'activity', 'tasks', 'settings'];
    
    // Define workspace-level routes that should not be treated as project slugs
    const workspaceRoutes = ['projects', 'members', 'activity', 'tasks', 'analytics', 'settings'];
    
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
  const pathname = usePathname();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  const { currentWorkspaceSlug, currentProjectSlug } = usePathnameParsing(pathname, isMounted);
  
  useEffect(() => {
    setIsMounted(true);
    const collapsed = getSidebarCollapsedState();
    setIsSidebarCollapsed(collapsed);
  }, []);
  
  const toggleSidebar = (forceValue?: boolean) => {
    setHasUserInteracted(true);
    toggleSidebarUtil(setIsSidebarCollapsed, forceValue);
  };
  
  useEffect(() => {
    if (!isMounted) return;
    
    const handleResize = () => {
      if (window.innerWidth < 768 && !isSidebarCollapsed && !hasUserInteracted) {
        toggleSidebarUtil(setIsSidebarCollapsed, true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    if (!hasUserInteracted) {
      handleResize();
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted, isSidebarCollapsed, hasUserInteracted]);
  
  const globalNavItems = useMemo(() => [
    { name: 'Dashboard', href: '/dashboard', icon: <HiHome size={16} />, title: 'Global Dashboard' },
    { name: 'Workspaces', href: '/workspaces', icon: <HiViewGrid size={16} />, title: 'All Workspaces' },
    { name: 'Activity', href: '/activity', icon: <HiCalendar size={16} />, title: 'All Activity' },
    { name: 'Tasks', href: '/tasks', icon: <HiClipboardList size={16} />, title: 'All Tasks' },
    { name: 'Settings', href: '/settings', icon: <HiCog size={16} />, title: 'Global Settings' },
  ], []);
  
  const workspaceNavItems = useMemo(() => 
    currentWorkspaceSlug ? [
      { name: 'Overview', href: `/${currentWorkspaceSlug}`, icon: <HiViewGrid size={16} />, title: 'Workspace Overview' },
      { name: 'Projects', href: `/${currentWorkspaceSlug}/projects`, icon: <HiViewBoards size={16} />, title: 'Workspace Projects' },
      { name: 'Members', href: `/${currentWorkspaceSlug}/members`, icon: <HiUsers size={16} />, title: 'Workspace Members' },
      { name: 'Activity', href: `/${currentWorkspaceSlug}/activity`, icon: <HiCalendar size={16} />, title: 'Workspace Activity' },
      { name: 'Tasks', href: `/${currentWorkspaceSlug}/tasks`, icon: <HiClipboardList size={16} />, title: 'Workspace Tasks' },
      { name: 'Analytics', href: `/${currentWorkspaceSlug}/analytics`, icon: <HiChartBar size={16} />, title: 'Workspace Analytics' },
      { name: 'Settings', href: `/${currentWorkspaceSlug}/settings`, icon: <HiCog size={16} />, title: 'Workspace Settings' },
    ] : [],
  [currentWorkspaceSlug]);
  
  const projectNavItems = useMemo(() => 
    (currentWorkspaceSlug && currentProjectSlug) ? [
      { name: 'Overview', href: `/${currentWorkspaceSlug}/${currentProjectSlug}`, icon: <HiViewBoards size={16} />, title: 'Project Overview' },
      { name: 'Tasks', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/tasks`, icon: <HiClipboardList size={16} />, title: 'Tasks' },
      { name: 'Sprints', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/sprints`, icon: <HiLightningBolt size={16} />, title: 'Sprints' },
      { name: 'Calendar', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/tasks/calendar`, icon: <HiCalendar size={16} />, title: 'Calendar' },
      { name: 'Time', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/time`, icon: <HiClock size={16} />, title: 'Time Tracking' },
      { name: 'Analytics', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/analytics`, icon: <HiChartBar size={16} />, title: 'Analytics' },
      { name: 'Members', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/members`, icon: <HiUsers size={16} />, title: 'Members' },
      { name: 'Settings', href: `/${currentWorkspaceSlug}/${currentProjectSlug}/settings`, icon: <HiCog size={16} />, title: 'Settings' },
    ] : [],
  [currentWorkspaceSlug, currentProjectSlug]);
  
  const navigationItems: NavItem[] = useMemo(() => {
    if (currentWorkspaceSlug && currentProjectSlug) return projectNavItems;
    if (currentWorkspaceSlug) return workspaceNavItems;
    return globalNavItems;
  }, [currentWorkspaceSlug, currentProjectSlug, globalNavItems, workspaceNavItems, projectNavItems]);
  
  const miniSidebarNavItems = useMemo(() => {
    if (currentWorkspaceSlug && currentProjectSlug) return workspaceNavItems;
    if (currentWorkspaceSlug) return globalNavItems;
    return [];
  }, [currentWorkspaceSlug, currentProjectSlug, globalNavItems, workspaceNavItems]);

  const getSidebarColor = () => {
    return "bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800";
  };
  
  const renderSkeleton = () => (
    <div className="hidden md:flex h-screen">
      <div className="w-12 bg-stone-900 dark:bg-stone-950 h-screen flex-col pt-3 items-center overflow-y-auto border-r border-stone-800 fixed left-0 top-0 z-40 hidden md:flex">
        <div className="mb-6 ml-0 w-8 h-8 flex items-center justify-center rounded-lg text-stone-400">
          <HiMenu size={16} />
        </div>
        <div className="flex-grow flex flex-col items-center gap-4"></div>
      </div>
      
      <div className="w-full md:ml-12">
        <div className="w-full md:w-64 bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 h-screen flex flex-col p-4 overflow-y-auto">
          <div className="flex flex-col h-full">
            <div className="h-12 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-stone-300 dark:bg-stone-700 animate-pulse"></div>
              <div className="ml-3 h-4 w-32 bg-stone-300 dark:bg-stone-700 rounded animate-pulse"></div>
            </div>
            <div className="flex-grow">
              <ul className="space-y-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <li key={i}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                      <div className="w-4 h-4 rounded bg-stone-300 dark:bg-stone-700 animate-pulse"></div>
                      <div className="h-3 w-16 bg-stone-300 dark:bg-stone-700 rounded animate-pulse"></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderFullSidebar = () => (
    <div className={`w-full transition-colors ${getSidebarColor()} h-screen flex flex-col p-4 overflow-y-auto`}>
      <div className="h-12 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between relative">
        {!currentWorkspaceSlug && (
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white">
              <HiHome size={16} />
            </div>
            <span className="ml-3 text-sm font-medium text-stone-700 dark:text-stone-300 truncate">Dashboard</span>
          </div>
        )}
        
        {currentWorkspaceSlug && (
          <div className="flex items-center overflow-hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                {currentWorkspaceSlug.charAt(0).toUpperCase()}
              </div>
              <span className="ml-3 text-sm font-medium text-stone-700 dark:text-stone-300 flex items-center truncate">
                <span className="truncate">{currentWorkspaceSlug}</span>
                {currentProjectSlug && (
                  <>
                    <span className="mx-1 text-stone-400">/</span>
                    <span className="truncate">{currentProjectSlug}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <nav className="flex-grow">
        <ul className="space-y-1 mb-6">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
  
  const renderMiniSidebar = () => {
    if (!isMounted) {
      return (
        <div className="w-12 bg-stone-900 dark:bg-stone-950 h-screen flex-col py-3 items-center overflow-y-auto border-r border-stone-800 fixed left-0 top-0 z-40 hidden md:flex">
          <div className="mb-6 w-8 h-8 flex items-center justify-center rounded-lg text-stone-400">
            <HiMenu size={16} />
          </div>
          <div className="flex-grow flex flex-col items-center gap-4"></div>
        </div>
      );
    }
    
    return (
      <div className="w-12 bg-stone-900 dark:bg-stone-950 h-screen flex-col pt-3 items-center overflow-y-auto border-r border-stone-800 fixed left-0 top-0 z-40 hidden md:flex">
        <button 
          onClick={() => toggleSidebar(true)}
          className="mb-6 ml-0 w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          title="Toggle navigation"
        >
          <HiMenu size={16} />
        </button>
        
        <div className="flex-grow flex flex-col items-center gap-3">
          {miniSidebarNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`w-8 h-8 flex items-center justify-center rounded-lg relative group transition-colors ${
                pathname === item.href 
                  ? 'bg-amber-600 text-white' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
              title={item.title || item.name}
            >
              {item.icon}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  if (!isMounted) {
    return renderSkeleton();
  }

  return (
    <>
      {isSidebarCollapsed && (
        <button 
          onClick={() => toggleSidebar(false)}
          className="sidebar-toggle-button fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-lg bg-stone-900 text-stone-200 shadow-lg md:hidden"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          title="Show navigation"
        >
          <HiMenu size={20} />
        </button>
      )}
      
      <div className="flex h-screen">
        <div className={`${isSidebarCollapsed ? 'hidden' : 'flex'} z-40 fixed md:static top-0 left-0 h-full`}>
          {renderMiniSidebar()}
          
          <div className="flex md:ml-12">
            {isMounted ? (
              <ResizableSidebar
                minWidth={200}
                maxWidth={400}
                className={`${getSidebarColor()} w-[280px] md:w-auto`}
              >
                {renderFullSidebar()}
              </ResizableSidebar>
            ) : (
              <div className="w-64">
                {renderFullSidebar()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => toggleSidebar(true)}
          aria-hidden="true"
        />
      )}
    </>
  );
}