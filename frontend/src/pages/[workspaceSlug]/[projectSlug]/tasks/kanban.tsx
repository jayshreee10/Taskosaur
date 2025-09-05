;

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/project-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { useTask } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { getCurrentOrganizationId } from '@/utils/hierarchyContext';

// Layout components
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OrganizationProvider from "@/contexts/organization-context";
import WorkspaceProvider from "@/contexts/workspace-context";
import ProjectProvider from "@/contexts/project-context";
import SprintProvider from "@/contexts/sprint-context";
import TaskProvider from "@/contexts/task-context";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { Toaster } from "sonner";

// Kanban components
import { KanbanBoard } from '@/components/tasks/KanbanBoard';

function TaskKanbanContent() {
  const router = useRouter();
  const { workspaceSlug, projectSlug } = router.query;
  const { getProjectsByWorkspace } = useProject();
  const { getWorkspaceBySlug } = useWorkspace();
  const { getTasksByProject } = useTask();
  const { isAuthenticated } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!workspaceSlug || !projectSlug || !isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        // First get the workspace
        const workspaceData = await getWorkspaceBySlug(workspaceSlug as string);
        if (!workspaceData) {
          setLoading(false);
          return;
        }

        // Then get all projects in the workspace and find by slug
        const workspaceProjects = await getProjectsByWorkspace(workspaceData.id);
        const projectData = workspaceProjects.find(p => p.slug === projectSlug);
        
        if (projectData) {
          setProject(projectData);
          const organizationId = getCurrentOrganizationId();
          if (!organizationId) {
            throw new Error("No organization selected. Please select an organization first.");
          }
          const tasksData = await getTasksByProject(projectData.id, organizationId);
          setTasks(tasksData || []);
        }
      } catch (err) {
        console.error('Error fetching project tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workspaceSlug, projectSlug, getWorkspaceBySlug, getProjectsByWorkspace, getTasksByProject, isAuthenticated]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--muted)] rounded w-1/3"></div>
          <div className="h-96 bg-[var(--muted)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Kanban Board
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {project?.name || 'Loading...'} - Kanban View
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {project && (
          <KanbanBoard
            kanbanData={[]}
            projectId={project.id}
          />
        )}
      </div>
    </div>
  );
}

export default function TaskKanbanPage() {
  return (
    <ProtectedRoute>
      <OrganizationProvider>
        <WorkspaceProvider>
          <ProjectProvider>
            <SprintProvider>
              <TaskProvider>
                <div className="min-h-screen bg-[var(--background)]">
                  <div className="flex h-screen">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header />
                      <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                          <Breadcrumb />
                          <TaskKanbanContent />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Toaster />
                </div>
              </TaskProvider>
            </SprintProvider>
          </ProjectProvider>
        </WorkspaceProvider>
      </OrganizationProvider>
    </ProtectedRoute>
  );
}