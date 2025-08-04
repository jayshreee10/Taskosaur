"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useTask } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';

import { Button } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProjectAvatar from '@/components/ui/avatars/ProjectAvatar';

import ProjectMembers from '@/components/projects/ProjectMembers';
import { ProjectKanbanView } from '@/components/projects/ProjectKanbanView';
import { ProjectDetailError } from '@/components/projects/ProjectDetailError';

import { StatCard } from '@/components/cards/StatCard';
import { StatusBadge } from '@/components/badges/StatusBadge';

import '@/styles/components/project-detail.css';

import {
  HiPlus,
  HiCog,
  HiExclamation,
  HiClipboardList,
  HiExternalLink
} from 'react-icons/hi';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  organizationId: string;
}

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  color: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  workspaceId: string;
  workspace?: Partial<Workspace>;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST' | 'LOWEST';
  startDate: string;
  dueDate: string;
  projectId: string;
  assigneeId?: string;
  reporterId?: string;
  statusId: string;
}

interface TaskStatus {
  id: string;
  name: string;
  color?: string;
  order?: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;
  const projectSlug = params?.projectSlug as string;
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentRouteRef = useRef<string>('');
  const isFirstRenderRef = useRef(true);

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace } = useProjectContext();
  const { getTasksByProject, getAllTaskStatuses } = useTask();
  const { isAuthenticated } = useAuth();

  const generateProjectSlug = (projectName: string) => {
    if (!projectName) return '';
    
    return projectName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const findProjectBySlug = (projects: Project[], slug: string) => {
    return projects.find(project => generateProjectSlug(project.name) === slug);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'info';
      default:
        return 'secondary';
    }
  };

  useEffect(() => {
    const currentRoute = `${workspaceSlug}/${projectSlug}`;
    
    if (currentRouteRef.current === currentRoute && !isFirstRenderRef.current) {
      return;
    }
    
    const fetchProjectData = async () => {
      if (!workspaceSlug || !projectSlug || !isAuthenticated()) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const workspaceData = await getWorkspaceBySlug(workspaceSlug);
        
        if (!workspaceData) {
          setError('Workspace not found');
          setLoading(false);
          return;
        }

        setWorkspace(workspaceData);

        const projectsData = await getProjectsByWorkspace(workspaceData.id);
        const foundProject = findProjectBySlug(projectsData || [], projectSlug);
        
        if (!foundProject) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        const projectWithWorkspace = {
          ...foundProject,
          workspace: workspaceData
        };

        setProject(projectWithWorkspace);

        const [tasksData, statusesData] = await Promise.allSettled([
          getTasksByProject(foundProject.id),
          getAllTaskStatuses()
        ]);

        if (tasksData.status === 'fulfilled') {
          setTasks(tasksData.value || []);
        } else {
          setTasks([]);
        }

        if (statusesData.status === 'fulfilled') {
          setTaskStatuses(statusesData.value || []);
        } else {
          setTaskStatuses([]);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (currentRouteRef.current !== currentRoute) {
      setWorkspace(null);
      setProject(null);
      setTasks([]);
      setTaskStatuses([]);
      setError(null);
      
      currentRouteRef.current = currentRoute;
      fetchProjectData();
    }
    
    isFirstRenderRef.current = false;
  }, [workspaceSlug, projectSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            {/* Breadcrumb skeleton */}
            <div className="h-4 bg-[var(--muted)] rounded w-1/3"></div>
            
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--muted)] rounded-lg"></div>
                <div>
                  <div className="h-6 bg-[var(--muted)] rounded w-48 mb-2"></div>
                  <div className="h-4 bg-[var(--muted)] rounded w-64"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 bg-[var(--muted)] rounded w-20"></div>
                <div className="h-9 bg-[var(--muted)] rounded w-24"></div>
              </div>
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-4">
                  <div className="h-3 bg-[var(--muted)] rounded mb-3 w-16"></div>
                  <div className="h-5 bg-[var(--muted)] rounded w-3/4"></div>
                </div>
              ))}
            </div>
            
            {/* Members skeleton */}
            <div className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-4">
              <div className="h-5 bg-[var(--muted)] rounded w-32 mb-4"></div>
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-[var(--muted)] rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workspace || !project) {
    return (
      <ProjectDetailError 
        error={error || 'Unknown error'}
        workspaceSlug={workspaceSlug}
        projectSlug={projectSlug}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4">
        
        {/* Breadcrumb - Compact */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <Link href={`/${workspaceSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
            {workspace?.name ?? ''}
          </Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-[var(--foreground)] font-medium">{project?.name ?? ''}</span>
        </div>

        {/* Header - Reduced spacing */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {project && <ProjectAvatar project={project} size="md" />}
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{project?.name ?? ''}</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{project?.description ?? ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${workspaceSlug}/${projectSlug}/settings`}>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center gap-2 whitespace-nowrap transition-all duration-200"
              >
                <HiCog size={14} />
                Settings
              </Button>
            </Link>
            <Link href={`/${workspaceSlug}/${projectSlug}/tasks/new`}>
              <Button
                variant="default"
                className="h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
              >
                <HiPlus className="w-4 h-4" />
                Add Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row - Compact cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Status Card */}
          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-4">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
              <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">Status</h3>
            </div>
            <div className="flex items-center">
              {project && <StatusBadge status={project.status} type="project" />}
            </div>
          </Card>

          {/* Start Date Card */}
          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-4">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
              <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">Start Date</h3>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {project ? formatDate(project.startDate) : ''}
              </span>
            </div>
          </Card>

          {/* End Date Card */}
          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-4">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
              <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">End Date</h3>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {project ? formatDate(project.endDate) : ''}
              </span>
            </div>
          </Card>

          {/* Tasks Card */}
          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none p-4">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
              <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">Tasks</h3>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          </Card>
        </div>

        {/* Members Card - Compact */}
        <div className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm border-none">
          {project && workspace && (
            <ProjectMembers 
              projectId={project.id} 
              organizationId={workspace.organizationId}
              workspaceId={workspace.id}
            />
          )}
        </div>

        {/* Uncomment when needed */}
        {/* Tasks Header */}
        {/* <div className="flex items-center justify-between mt-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <HiClipboardList size={18} />
            Tasks
          </h2>
          <Link 
            href={`/${workspaceSlug}/${projectSlug}/tasks`} 
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors flex items-center gap-1"
          >
            View all tasks <HiExternalLink size={12} />
          </Link>
        </div> */}

        {/* Kanban View */}
        {/* <div className="mt-4">
          <ProjectKanbanView
            tasks={tasks.map(task => ({
              ...task,
              description: typeof task.description === 'string' ? task.description : ''
            }))}
            taskStatuses={taskStatuses}
            workspaceSlug={workspaceSlug}
            projectSlug={projectSlug}
            className="grid grid-cols-1 lg:grid-cols-4 gap-4"
          />
        </div> */}
      </div>
    </div>
  );
}