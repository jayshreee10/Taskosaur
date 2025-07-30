"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useTask } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';

import { Button } from '@/components/ui';
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
  description: string;
  color: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  workspaceId: string;
  workspace?: Workspace;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
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
      <div className="project-detail-container">
        <div className="project-detail-content">
          <div className="animate-pulse space-y-8">
            <div className="h-4 bg-[var(--muted)] rounded w-1/3"></div>
            
            <div className="project-detail-header">
              <div className="project-detail-title-section">
                <div className="w-10 h-10 bg-[var(--muted)] rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-6 bg-[var(--muted)] rounded w-64 mb-3"></div>
                  <div className="h-4 bg-[var(--muted)] rounded w-96"></div>
                </div>
              </div>
              <div className="project-detail-actions">
                <div className="h-8 bg-[var(--muted)] rounded w-20"></div>
                <div className="h-8 bg-[var(--muted)] rounded w-24"></div>
              </div>
            </div>

            <div className="project-detail-stats">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                  <div className="h-3 bg-[var(--muted)] rounded mb-2 w-16"></div>
                  <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                </div>
              ))}
            </div>

            <div className="project-detail-members">
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                <div className="h-4 bg-[var(--muted)] rounded w-32 mb-4"></div>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-[var(--muted)] rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="project-detail-tasks-header">
              <div className="h-5 bg-[var(--muted)] rounded w-24"></div>
              <div className="h-4 bg-[var(--muted)] rounded w-20"></div>
            </div>

            <div className="project-detail-kanban">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-4 bg-[var(--muted)] rounded w-20"></div>
                    <div className="h-4 bg-[var(--muted)] rounded-full w-6"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-16 bg-[var(--muted)] rounded"></div>
                    <div className="h-16 bg-[var(--muted)] rounded"></div>
                    <div className="h-12 bg-[var(--muted)] rounded border-2 border-dashed border-[var(--border)]"></div>
                  </div>
                </div>
              ))}
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
    <div className="project-detail-container">
      <div className="project-detail-content">
        <div className="project-detail-breadcrumb">
          <Link href={`/${workspaceSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">
            {workspace.name}
          </Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-[var(--foreground)]">{project.name}</span>
        </div>

        <div className="project-detail-header">
          <div className="project-detail-title-section">
            <ProjectAvatar project={project} size="md" />
            <div>
              <h1 className="project-detail-title text-[var(--foreground)]">{project.name}</h1>
              <p className="project-detail-description text-[var(--muted-foreground)]">
                {project.description}
              </p>
            </div>
          </div>
          <div className="project-detail-actions">
            <Link href={`/${workspaceSlug}/${projectSlug}/settings`}>
              <Button variant="secondary" size="sm" className="bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80 border-[var(--border)]">
                <HiCog size={14} className="mr-2" />
                Settings
              </Button>
            </Link>
            <Link href={`/${workspaceSlug}/${projectSlug}/tasks/new`}>
              <Button variant='secondary' size="sm" className="bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80 border-[var(--border)]">
                <HiPlus size={14} className="mr-2" />
                Add Task
              </Button>
            </Link>
          </div>
        </div>

        <div className="project-detail-stats">
          <StatCard
            title="Status"
            value={<StatusBadge status={project.status} type="project" />}
          />
          <StatCard
            title="Start Date"
            value={formatDate(project.startDate)}
          />
          <StatCard
            title="End Date"
            value={formatDate(project.endDate)}
          />
          <StatCard
            title="Tasks"
            value={tasks.length}
          />
        </div>

        <div className="project-detail-members">
          <ProjectMembers 
            projectId={project.id} 
            organizationId={workspace.organizationId}
            workspaceId={workspace.id}
          />
        </div>

        <div className="project-detail-tasks-header">
          <h2 className="project-detail-tasks-title text-[var(--foreground)] flex items-center gap-2">
            <HiClipboardList size={18} />
            Tasks
          </h2>
          <Link 
            href={`/${workspaceSlug}/${projectSlug}/tasks`} 
            className="project-detail-tasks-link text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors flex items-center gap-1 text-sm"
          >
            View all tasks <HiExternalLink size={12} />
          </Link>
        </div>

        <ProjectKanbanView
          tasks={tasks}
          taskStatuses={taskStatuses}
          workspaceSlug={workspaceSlug}
          projectSlug={projectSlug}
          className="project-detail-kanban"
        />
      </div>
    </div>
  );
}