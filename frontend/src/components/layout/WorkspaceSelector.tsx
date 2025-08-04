"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import { setCurrentWorkspaceId, clearCurrentProjectId } from "@/utils/hierarchyContext";
import { HiChevronDown, HiCheck } from "react-icons/hi2";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
}

interface WorkspaceSelectorProps {
  currentWorkspaceSlug: string | null;
}

export default function WorkspaceSelector({ currentWorkspaceSlug }: WorkspaceSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { getWorkspacesByOrganization, getWorkspaceBySlug } = useWorkspace();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch workspaces for current organization
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true);
        const workspacesData = await getWorkspacesByOrganization();
        setWorkspaces(workspacesData || []);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setWorkspaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();

    // Listen for organization changes to refetch workspaces
    const handleOrganizationChange = () => {
      setCurrentWorkspace(null); // Clear current workspace when organization changes
      fetchWorkspaces();
    };

    window.addEventListener('organizationChanged', handleOrganizationChange);
    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
    };
  }, []); // Remove getWorkspacesByOrganization dependency to prevent infinite loop

  // Fetch current workspace details
  useEffect(() => {
    const fetchCurrentWorkspace = async () => {
      if (!currentWorkspaceSlug) {
        setCurrentWorkspace(null);
        return;
      }

      try {
        const workspaceData = await getWorkspaceBySlug(currentWorkspaceSlug);
        setCurrentWorkspace(workspaceData);
      } catch (error) {
        console.error("Error fetching current workspace:", error);
        setCurrentWorkspace(null);
      }
    };

    fetchCurrentWorkspace();
  }, [currentWorkspaceSlug]); // Remove getWorkspaceBySlug dependency to prevent infinite loop

  const handleWorkspaceSelect = (workspace: Workspace) => {
    // Store the workspace ID in localStorage for hierarchy context
    setCurrentWorkspaceId(workspace.id);
    // Clear project context since we're switching workspaces
    clearCurrentProjectId();
    
    // Dispatch workspace change event
    window.dispatchEvent(new CustomEvent('workspaceChanged'));
    
    // Navigate to the workspace homepage
    // This replaces the current route to prevent going back to old workspace contexts
    router.replace(`/${workspace.slug}`);
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "W";
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

  // Don't show selector if no workspaces or if we're in a global route  
  if (workspaces.length === 0 || !currentWorkspaceSlug) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-0 py-0 h-8 bg-transparent hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] border-none rounded-lg"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-[var(--sidebar-primary)] rounded-lg flex items-center justify-center text-[var(--sidebar-primary-foreground)] text-xs font-medium">
            {currentWorkspace ? getInitials(currentWorkspace.name) : "W"}
          </div>
          <div className="flex-1 text-left min-w-0 ml-0">
            <div className="text-sm font-medium text-[var(--sidebar-foreground)] leading-none truncate">
              {currentWorkspace ? currentWorkspace.name : "Select Workspace"}
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
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleWorkspaceSelect(workspace)}
            className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-[var(--accent)] transition-all duration-200 ${
              currentWorkspace?.id === workspace.id
                ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20"
                : ""
            }`}
          >
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold">
                {getInitials(workspace.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-[var(--foreground)] truncate">
                {workspace.name}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] truncate">
                {workspace.description || "No description"}
              </div>
            </div>
            {currentWorkspace?.id === workspace.id && (
              <HiCheck className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}