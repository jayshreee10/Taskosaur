'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getWorkspaces, getProjects } from '@/utils/apiUtils';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
// import { Workspace, Project } from '@/types';

interface BreadcrumbItem {
  name: string;
  href: string;
  current: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { shouldPreventFetch, markFetchStart, markFetchComplete, getCachedData } = useGlobalFetchPrevention();

  // Set mounted state once component mounts on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const generateBreadcrumbs = async () => {
      const segments = pathname.split('/').filter(Boolean);
      const items: BreadcrumbItem[] = [];

      // Always add home
      items.push({
        name: 'Home',
        href: '/dashboard',
        current: pathname === '/dashboard' || pathname === '/'
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
          current: pathname === '/workspaces'
        });
        setBreadcrumbs(items);
        return;
      }

      if (segments[0] === 'settings') {
        items.push({
          name: 'Settings',
          href: '/settings',
          current: pathname === '/settings'
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
              current: pathname === `/${workspace.slug}`
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
                  current: pathname === `/${workspace.slug}/${project.slug}`
                });
                
                // Handle deeper levels
                if (segments.length >= 3) {
                  // Add section (tasks, members, settings, etc.)
                  items.push({
                    name: segments[2].charAt(0).toUpperCase() + segments[2].slice(1),
                    href: `/${workspace.slug}/${project.slug}/${segments[2]}`,
                    current: pathname === `/${workspace.slug}/${project.slug}/${segments[2]}` || segments.length > 3
                  });
                  
                  // Can add more levels if needed
                }
              } else if (['projects', 'members', 'activity', 'settings'].includes(segments[1])) {
                // Handle workspace sections
                items.push({
                  name: segments[1].charAt(0).toUpperCase() + segments[1].slice(1),
                  href: `/${workspace.slug}/${segments[1]}`,
                  current: pathname === `/${workspace.slug}/${segments[1]}`
                });
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
    <nav className="hidden md:block px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <svg className="h-4 w-4 text-gray-400 mx-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <Link
              href={breadcrumb.href}
              className={`${
                breadcrumb.current
                  ? 'text-gray-700 dark:text-gray-300 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-current={breadcrumb.current ? 'page' : undefined}
            >
              {breadcrumb.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}