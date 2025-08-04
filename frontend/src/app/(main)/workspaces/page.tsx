"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import MembersManager from "@/components/shared/MembersManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EmptyState,
  WorkspaceCardSkeleton,
  WorkspaceCard,
} from "@/components/ui";
import {
  HiPlus,
  HiUsers,
  HiFolder,
  HiExclamation,
  HiRefresh,
  HiSearch,
  HiX,
} from "react-icons/hi";
import { HiOfficeBuilding } from "react-icons/hi";
interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
  memberCount?: number;
  projectCount?: number;
  color?: string;
  lastActivity?: string;
}

// Removed Organization interface

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-[var(--destructive)]/10 rounded-lg flex items-center justify-center mx-auto mb-6 text-[var(--destructive)]">
      <HiExclamation size={24} />
    </div>
    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
      Something went wrong
    </h3>
    <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
      {error}
    </p>
    <Button variant="secondary" onClick={onRetry}>
      <HiRefresh size={16} className="mr-2" />
      Try Again
    </Button>
  </div>
);

export default function WorkspacesPage() {
  const {
    getWorkspacesByOrganization,
    searchWorkspacesByOrganization,
    getCurrentOrganizationId,
  } = useWorkspaceContext();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed selectedOrganization and organizationId state
  const [searchQuery, setSearchQuery] = useState("");
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );

  // Use refs to prevent infinite loops
  const currentOrgRef = useRef<string | null>(null);
  const contextFunctionsRef = useRef({ getWorkspacesByOrganization });

  // Update context functions ref when they change
  useEffect(() => {
    contextFunctionsRef.current = { getWorkspacesByOrganization };
  }, [getWorkspacesByOrganization]);

  // Load workspaces for current organizationId in localStorage, and update in realtime
  useEffect(() => {
    let lastOrgId = localStorage.getItem("currentOrganizationId") || "";
    const loadWorkspaces = async (orgId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        currentOrgRef.current = orgId;
        const workspacesData =
          await contextFunctionsRef.current.getWorkspacesByOrganization(orgId);
        setWorkspaces(workspacesData || []);
        setFilteredWorkspaces(workspacesData || []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load workspaces"
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadWorkspaces(lastOrgId);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currentOrganizationId") {
        const newOrgId = localStorage.getItem("currentOrganizationId") || "";
        if (newOrgId !== lastOrgId) {
          lastOrgId = newOrgId;
          loadWorkspaces(newOrgId);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Also poll for changes in case storage event doesn't fire in same tab
    const interval = setInterval(() => {
      const newOrgId = localStorage.getItem("currentOrganizationId") || "";
      if (newOrgId !== lastOrgId) {
        lastOrgId = newOrgId;
        loadWorkspaces(newOrgId);
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Search workspaces by organization when typing in search box (no frontend filtering)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setFilteredWorkspaces(workspaces);
        return;
      }
      try {
        const orgId = getCurrentOrganizationId
          ? getCurrentOrganizationId()
          : null;
        if (orgId && searchWorkspacesByOrganization) {
          const results = await searchWorkspacesByOrganization(
            orgId,
            searchQuery.trim()
          );
          setFilteredWorkspaces(results || []);
        } else {
          setFilteredWorkspaces([]);
        }
      } catch (error) {
        setFilteredWorkspaces([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    workspaces,
    searchWorkspacesByOrganization,
    getCurrentOrganizationId,
  ]);

  const handleEdit = (workspace: Workspace) => {
    // Edit functionality
  };

  const handleDelete = (id: string) => {
    // Delete functionality
  };

  const handleShowMembers = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowMembersModal(true);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--muted)] rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <WorkspaceCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Removed organization empty state

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-md">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HiOfficeBuilding className="size-5" />
              <h1 className="text-md font-bold">Workspaces</h1>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage your workspaces efficiently and collaborate with your team.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative max-w-xs w-full">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg border border-[var(--border)]"
              />
            </div>
            <Link href="/workspaces/new">
              <Button className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90">
                <HiPlus size={16} />
                <span>Create Workspace</span>
              </Button>
            </Link>
          </div>
        </div>

        {filteredWorkspaces.length === 0 ? (
          searchQuery ? (
            <EmptyState
              icon={<HiSearch size={24} />}
              title="No workspaces found"
              description={`No workspaces match "${searchQuery}". Try adjusting your search terms.`}
            />
          ) : (
            <EmptyState
              icon={<HiFolder size={24} />}
              title="No workspaces found"
              description={`Create your first workspace to get started with organizing your projects and collaborating with your team.`}
            />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-16">
              {filteredWorkspaces.map((workspace) => (
                <Link href={`/${workspace.slug}`} passHref legacyBehavior key={workspace.id}>
                  <a style={{ textDecoration: "none" }}>
                    <Card
                      className="bg-[var(--card)] rounded-lg shadow-sm group hover:shadow-lg transition-all duration-200 border-none cursor-pointer p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-semibold">
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                            {workspace.name}
                          </CardTitle>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {workspace.slug}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-[var(--muted-foreground)]">
                        {workspace.description || "No description provided"}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <HiFolder size={12} />
                          {workspace.projectCount || 0} projects
                        </span>
                        <span className="flex items-center gap-1">
                          <HiUsers size={12} />
                          {workspace.memberCount || 0} members
                        </span>
                      </div>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>

            {filteredWorkspaces.length > 0 && (
              <div className="fixed bottom-0  left-1/2 transform -translate-x-1/2 w-full min-h-[48px] flex items-center justify-center pb-4 pointer-events-none">
                <p className="text-sm text-[var(--muted-foreground)] pointer-events-auto">
                  Showing {filteredWorkspaces.length} of {workspaces.length}{" "}
                  workspace
                  {workspaces.length !== 1 ? "s" : ""}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Members - {selectedWorkspace?.name || ""}
            </DialogTitle>
          </DialogHeader>
          {selectedWorkspace && (
            <MembersManager
              type="workspace"
              entityId={selectedWorkspace.id}
              organizationId={""}
              className="border-none"
              title={`${selectedWorkspace.name} Members`}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
