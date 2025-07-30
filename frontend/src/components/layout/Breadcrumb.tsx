'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getWorkspaces, getProjects } from '@/utils/apiUtils';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  HiHome,
  HiRectangleGroup,
  HiCog6Tooth,
  HiClipboardDocumentList,
  HiClock,
  HiFolder,
  HiUsers,
} from 'react-icons/hi2';
// import { Workspace, Project } from '@/types';

interface BreadcrumbItemType {
  name: string;
  href: string;
  current: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItemType[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { shouldPreventFetch, markFetchStart, markFetchComplete, getCachedData } = useGlobalFetchPrevention();

  const getSectionIcon = (section: string) => {
    switch (section.toLowerCase()) {
      case 'activity':
        return HiClock;
      case 'tasks':
        return HiClipboardDocumentList;
      case 'projects':
        return HiFolder;
      case 'members':
        return HiUsers;
      case 'settings':
        return HiCog6Tooth;
      case 'analytics':
        return HiClipboardDocumentList;
      default:
        return undefined;
    }
  };

  // Set mounted state once component mounts on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const generateBreadcrumbs = async () => {
      const segments = pathname.split('/').filter(Boolean);
      const items: BreadcrumbItemType[] = [];

      // Always add home
      items.push({
        name: 'Home',
        href: '/dashboard',
        current: pathname === '/dashboard' || pathname === '/',
        icon: HiHome
      });

      if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
        // We're at the dashboard, so just return the single item
        setBreadcrumbs(items);
        return;
      }

      if (segments[0] === 'workspaces') {
        items.push({
          name: 'Workspaces',
          href: '/workspaces',
          current: pathname === '/workspaces',
          icon: HiRectangleGroup
        });
        setBreadcrumbs(items);
        return;
      }

      if (segments[0] === 'settings') {
        items.push({
          name: 'Settings',
          href: '/settings',
          current: pathname === '/settings',
          icon: HiCog6Tooth
        });
        setBreadcrumbs(items);
        return;
      }

      if (segments[0] === 'activity') {
        items.push({
          name: 'Activity',
          href: '/activity',
          current: pathname === '/activity',
          icon: HiClock
        });
        setBreadcrumbs(items);
        return;
      }

      if (segments[0] === 'tasks') {
        items.push({
          name: 'Tasks',
          href: '/tasks',
          current: pathname === '/tasks',
          icon: HiClipboardDocumentList
        });
        setBreadcrumbs(items);
        return;
      }

      // Handle workspace level
      try {
        // First segment could be a workspace slug
        if (segments.length >= 1 && segments[0] !== 'dashboard' && segments[0] !== 'workspaces') {
          const workspacesFetchKey = 'breadcrumb-workspaces';
          let workspaces = getCachedData(workspacesFetchKey);
          
          if (!workspaces && !shouldPreventFetch(workspacesFetchKey)) {
            markFetchStart(workspacesFetchKey);
            workspaces = await getWorkspaces();
            markFetchComplete(workspacesFetchKey, workspaces);
          }
          
          if (!workspaces) {
            workspaces = [];
          }
          
          const workspace = workspaces.find((w: any) => w.slug === segments[0]);
          
          if (workspace) {
            items.push({
              name: workspace.name,
              href: `/${workspace.slug}`,
              current: pathname === `/${workspace.slug}`,
              icon: HiRectangleGroup
            });
            
            // Handle project level
            if (segments.length >= 2) {
              const projectsFetchKey = 'breadcrumb-projects';
              let projects = getCachedData(projectsFetchKey);
              
              if (!projects && !shouldPreventFetch(projectsFetchKey)) {
                markFetchStart(projectsFetchKey);
                projects = await getProjects();
                markFetchComplete(projectsFetchKey, projects);
              }
              
              if (!projects) {
                projects = [];
              }
              
              const project = projects.find((p: any) => 
                p.slug === segments[1] && p.workspace.slug === workspace.slug
              );
              
              if (project) {
                items.push({
                  name: project.name,
                  href: `/${workspace.slug}/${project.slug}`,
                  current: pathname === `/${workspace.slug}/${project.slug}`,
                  icon: HiFolder
                });
                
                // Handle deeper levels
                if (segments.length >= 3) {
                  // Add section (tasks, members, settings, etc.)
                  items.push({
                    name: segments[2].charAt(0).toUpperCase() + segments[2].slice(1),
                    href: `/${workspace.slug}/${project.slug}/${segments[2]}`,
                    current: pathname === `/${workspace.slug}/${project.slug}/${segments[2]}` || segments.length > 3,
                    icon: getSectionIcon(segments[2])
                  });
                  
                  // Can add more levels if needed
                }
              } else if (['projects', 'members', 'activity', 'settings', 'tasks', 'analytics'].includes(segments[1])) {
                // Handle workspace sections
                items.push({
                  name: segments[1].charAt(0).toUpperCase() + segments[1].slice(1),
                  href: `/${workspace.slug}/${segments[1]}`,
                  current: pathname === `/${workspace.slug}/${segments[1]}` || segments.length > 2,
                  icon: getSectionIcon(segments[1])
                });
                
                // Handle deeper levels for workspace sections
                if (segments.length >= 3) {
                  items.push({
                    name: segments[2].charAt(0).toUpperCase() + segments[2].slice(1),
                    href: `/${workspace.slug}/${segments[1]}/${segments[2]}`,
                    current: pathname === `/${workspace.slug}/${segments[1]}/${segments[2]}` || segments.length > 3,
                    icon: getSectionIcon(segments[2])
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error generating breadcrumbs:', error);
      }

      setBreadcrumbs(items);
    };

    generateBreadcrumbs();
  }, [pathname, isMounted]);

  if (!isMounted || breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs when there's only the dashboard or before client-side rendering
  }

  return (
    <div className="hidden md:block px-4 sm:px-6 lg:px-8 py-4 bg-[var(--background)] border-b border-[var(--border)] shadow-sm">
      <div className="max-w-7xl mx-auto">
        <ShadcnBreadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.href}>
                <BreadcrumbItem>
                  {breadcrumb.current ? (
                    <BreadcrumbPage className="flex items-center gap-2 font-normal text-[var(--muted-foreground)]">
                      {breadcrumb.icon && (
                        <breadcrumb.icon className="w-4 h-4" />
                      )}
                      {breadcrumb.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={breadcrumb.href}
                        className="flex items-center gap-2 hover:text-[var(--foreground)] transition-colors duration-200"
                      >
                        {breadcrumb.icon && (
                          <breadcrumb.icon className="w-4 h-4" />
                        )}
                        {breadcrumb.name}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </ShadcnBreadcrumb>
      </div>
    </div>
  );
}