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

interface Organization {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

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
  const { getWorkspacesByOrganization } = useWorkspaceContext();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  // Use refs to prevent infinite loops
  const currentOrgRef = useRef<string | null>(null);
  const contextFunctionsRef = useRef({ getWorkspacesByOrganization });

  // Update context functions ref when they change
  useEffect(() => {
    contextFunctionsRef.current = { getWorkspacesByOrganization };
  }, [getWorkspacesByOrganization]);

  useEffect(() => {
    const getOrganizationId = () => {
      try {
        const orgId = localStorage.getItem("currentOrganizationId");
        const currentOrg = localStorage.getItem("currentOrganization");

        setOrganizationId(orgId);

        if (currentOrg) {
          try {
            const parsedOrg = JSON.parse(currentOrg);
            setSelectedOrganization(parsedOrg);
          } catch {
            if (orgId) {
              setSelectedOrganization({
                id: orgId,
                name: "Selected Organization",
              });
            }
          }
        } else if (orgId) {
          setSelectedOrganization({
            id: orgId,
            name: "Selected Organization",
          });
        }
      } catch (error) {
        setError("Error accessing organization data");
      }
    };

    getOrganizationId();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currentOrganizationId" || e.key === "currentOrganization") {
        getOrganizationId();
      }
    };

    const handleOrganizationChange = () => {
      getOrganizationId();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("organizationChanged", handleOrganizationChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("organizationChanged", handleOrganizationChange);
    };
  }, []);

  const loadWorkspaces = useCallback(async (orgId: string) => {
    if (currentOrgRef.current === orgId) return; // Prevent duplicate calls
    
    currentOrgRef.current = orgId;
    
    try {
      setIsLoading(true);
      setError(null);

      const workspacesData = await contextFunctionsRef.current.getWorkspacesByOrganization(orgId);
      
      setWorkspaces(workspacesData || []);
      setFilteredWorkspaces(workspacesData || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load workspaces");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedOrganization?.id) return;
    loadWorkspaces(selectedOrganization.id);
  }, [selectedOrganization?.id, loadWorkspaces]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWorkspaces(workspaces);
    } else {
      const filtered = workspaces.filter(
        (workspace) =>
          workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workspace.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workspace.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWorkspaces(filtered);
    }
  }, [searchQuery, workspaces]);

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

  if (!selectedOrganization) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <EmptyState
          icon={<HiFolder size={24} />}
          title="No organization selected"
          description="Please select an organization from the header to view and manage workspaces."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {selectedOrganization.name} Workspaces
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage your team workspaces and collaborate on projects
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
                className="pl-10"
              />
            </div>
            
            <Link href="/workspaces/new">
              <Button className="flex items-center gap-2">
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
              description={`Create your first workspace in ${selectedOrganization.name} to get started with organizing your projects and collaborating with your team.`}
              action={
                <Link href="/workspaces/new">
                  <Button>
                    <HiPlus size={16} className="mr-2" />
                    Create Workspace
                  </Button>
                </Link>
              }
            />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWorkspaces.map((workspace) => (
                <Card key={workspace.id} className="group hover:shadow-lg transition-all duration-200 border-[var(--border)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-semibold">
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                            <Link href={`/${workspace.slug}`}>
                              {workspace.name}
                            </Link>
                          </CardTitle>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">
                            {workspace.slug}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-2">
                      {workspace.description || "No description provided"}
                    </p>
                    
                    <div className="flex items-center justify-between">
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
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowMembers(workspace)}
                        className="text-xs"
                      >
                        <HiUsers size={14} className="mr-1" />
                        Members
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredWorkspaces.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Showing {filteredWorkspaces.length} of {workspaces.length} workspace
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
              Manage Members - {selectedWorkspace?.name || ''}
            </DialogTitle>
          </DialogHeader>
          {selectedWorkspace && selectedOrganization && (
            <MembersManager
              type="workspace"
              entityId={selectedWorkspace.id}
              organizationId={selectedOrganization.id}
              className="border-none"
              title={`${selectedWorkspace.name} Members`}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}