"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useProject } from "@/contexts/project-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { setCurrentProjectId } from "@/utils/hierarchyContext";
import { HiChevronDown, HiCheck } from "react-icons/hi2";
import { HiFolder } from "react-icons/hi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Project {
  id: string;
  name: string;
  key: string;
  slug: string;
  description?: string;
  color: string;
  workspaceId: string;
  workspace: {
    slug: string;
  };
}

interface ProjectSelectorProps {
  currentWorkspaceSlug: string | null;
  currentProjectSlug: string | null;
}

export default function ProjectSelector({ 
  currentWorkspaceSlug, 
  currentProjectSlug 
}: ProjectSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { getProjectsByWorkspace } = useProject();
  const { getWorkspaceBySlug } = useWorkspace();

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current workspace
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!currentWorkspaceSlug) {
        setCurrentWorkspace(null);
        return;
      }

      try {
        const workspaceData = await getWorkspaceBySlug(currentWorkspaceSlug);
        setCurrentWorkspace(workspaceData);
      } catch (error) {
        console.error("Error fetching workspace:", error);
        setCurrentWorkspace(null);
      }
    };

    fetchWorkspace();
  }, [currentWorkspaceSlug]); // Remove getWorkspaceBySlug dependency to prevent infinite loop

  // Fetch projects for current workspace
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentWorkspace?.id) {
        setProjects([]);
        return;
      }

      try {
        setIsLoading(true);
        const projectsData = await getProjectsByWorkspace(currentWorkspace.id);
        setProjects(projectsData || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();

    // Listen for organization changes to clear projects
    const handleOrganizationChange = () => {
      setProjects([]);
      setCurrentProject(null);
    };

    // Listen for workspace changes to refetch projects
    const handleWorkspaceChange = () => {
      if (currentWorkspace?.id) {
        fetchProjects();
      }
    };

    window.addEventListener('organizationChanged', handleOrganizationChange);
    window.addEventListener('workspaceChanged', handleWorkspaceChange);
    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
      window.removeEventListener('workspaceChanged', handleWorkspaceChange);
    };
  }, [currentWorkspace?.id]); // Remove getProjectsByWorkspace dependency to prevent infinite loop

  // Set current project based on slug
  useEffect(() => {
    if (!currentProjectSlug || projects.length === 0) {
      setCurrentProject(null);
      return;
    }

    const project = projects.find(p => {
      // Try to match by slug if available, otherwise use name-based slug generation
      const projectSlug = p.slug || p.name.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      return projectSlug === currentProjectSlug;
    });

    setCurrentProject(project || null);
  }, [currentProjectSlug, projects]);

  const handleProjectSelect = (project: Project) => {
    if (!currentWorkspaceSlug) return;

    // Store the project ID in localStorage for hierarchy context
    setCurrentProjectId(project.id);

    // Dispatch project change event
    window.dispatchEvent(new CustomEvent('projectChanged'));

    // Generate project slug for navigation
    const projectSlug = project.slug || project.name.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Navigate to the project homepage
    // This replaces the current route to prevent going back to old project contexts
    router.replace(`/${currentWorkspaceSlug}/${projectSlug}`);
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "P";
  };

  const getProjectKey = (project: Project) => {
    return project.key || project.name.substring(0, 3).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 h-9 rounded-lg bg-[var(--sidebar-accent)] animate-pulse">
        <div className="w-6 h-6 bg-[var(--sidebar-muted)] rounded-md"></div>
        <div className="space-y-1 flex-1">
          <div className="w-20 h-3 bg-[var(--sidebar-muted)] rounded"></div>
          <div className="w-12 h-2 bg-[var(--sidebar-muted)] rounded"></div>
        </div>
      </div>
    );
  }

  // Don't show selector if no workspace, no projects, or if we're not in a project route
  if (!currentWorkspaceSlug || projects.length === 0 || !currentProjectSlug) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-0 py-0 h-8 bg-transparent hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] border-none rounded-lg"
        >
          <div 
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: currentProject?.color || 'var(--sidebar-primary)' }}
          >
            {currentProject ? getProjectKey(currentProject) : "P"}
          </div>
          <div className="flex-1 text-left min-w-0 ml-0">
            <div className="text-sm font-medium text-[var(--sidebar-foreground)] leading-none truncate">
              {currentProject ? currentProject.name : "Select Project"}
            </div>
          </div>
          <HiChevronDown className="w-4 h-4 text-[var(--sidebar-muted-foreground)] flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 p-2 bg-[var(--popover)] border-[var(--border)] shadow-lg"
        align="start"
        sideOffset={8}
      >
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleProjectSelect(project)}
            className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-[var(--accent)] transition-all duration-200 ${
              currentProject?.id === project.id
                ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20"
                : ""
            }`}
          >
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarFallback 
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: project.color || 'var(--primary)' }}
              >
                {getProjectKey(project)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-[var(--foreground)] truncate">
                {project.name}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] truncate">
                {project.description || "No description"}
              </div>
            </div>
            {currentProject?.id === project.id && (
              <HiCheck className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}