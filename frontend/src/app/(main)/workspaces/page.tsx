"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import MembersManager from "@/components/shared/MembersManager";
import {
  Card,
  Button,
  IconButton,
  EmptyState,
  WorkspaceCardSkeleton,
  WorkspaceCard,
  Modal,
} from "@/components/ui";
import {
  HiPlus,
  HiUsers,
  HiFolder,
  HiExclamation,
  HiRefresh,
  HiSearch,
} from "react-icons/hi";
import "@/styles/workspace.css";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
  memberCount?: number;
  projectCount?: number;
  isStarred?: boolean;
  color?: string;
  lastActivity?: string;
}

interface Organization {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

// Error State Component
const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-6 text-red-500">
      <HiExclamation size={24} />
    </div>
    <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
      Something went wrong
    </h3>
    <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 max-w-md mx-auto">
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
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

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
        console.error("Error getting organization from localStorage:", error);
      }
    };

    getOrganizationId();

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "currentOrganizationId" ||
        e.key === "currentOrganization"
      ) {
        getOrganizationId();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted]);

  // NEW: Add event listener for organization changes
  useEffect(() => {
    if (!mounted) return;

    const handleOrganizationChange = () => {
      // Re-fetch organization data when organization changes
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
          console.error("Error getting organization from localStorage:", error);
        }
      };

      getOrganizationId();
    };

    window.addEventListener("organizationChanged", handleOrganizationChange);

    return () => {
      window.removeEventListener(
        "organizationChanged",
        handleOrganizationChange
      );
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !selectedOrganization) return;

    const loadWorkspaces = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const workspacesData = await getWorkspacesByOrganization(
          selectedOrganization.id
        );

        const enhancedWorkspaces = workspacesData.map((workspace: any) => ({
          ...workspace,
          organizationId: selectedOrganization.id, // Ensure organizationId is included
          memberCount: Math.floor(Math.random() * 20) + 1,
          projectCount: Math.floor(Math.random() * 10) + 1,
          isStarred: Math.random() > 0.7,
          lastActivity: `${Math.floor(Math.random() * 30) + 1} days ago`,
        }));

        setWorkspaces(enhancedWorkspaces);
        setFilteredWorkspaces(enhancedWorkspaces);
      } catch (error) {
        console.error("Error loading workspaces:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load workspaces"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, [selectedOrganization, getWorkspacesByOrganization, mounted]);

  useEffect(() => {
    setSearchQuery("");
  }, [selectedOrganization?.id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWorkspaces(workspaces);
    } else {
      const filtered = workspaces.filter(
        (workspace) =>
          workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workspace.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          workspace.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWorkspaces(filtered);
    }
  }, [searchQuery, workspaces]);

  const handleEdit = (workspace: Workspace) => {

  };

  const handleDelete = (id: string) => {

  };

  const handleShowMembers = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowMembersModal(true);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (!mounted) {
    return (
      <div className="workspaces-container">
        <div className="workspaces-main">
          <div className="animate-pulse">
            <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/2 mb-6"></div>
            <div className="workspaces-grid">
              {[...Array(6)].map((_, i) => (
                <WorkspaceCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="workspaces-container">
        <div className="workspaces-main">
          <div className="animate-pulse">
            <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/2 mb-6"></div>
            <div className="workspaces-grid">
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
      <div className="workspaces-container flex items-center justify-center">
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
      <div className="workspaces-container flex items-center justify-center">
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="workspaces-container">
      <div className="workspaces-main">
        {/* Header */}
        <div className="workspaces-header">
          {/* Search Bar */}
          <div className="workspaces-search">
            <HiSearch size={15} className="workspaces-search-icon" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="workspaces-search-input"
            />
          </div>
          <Link href="/workspaces/new">
            <Button variant="primary" className="flex items-center gap-2 text-xs py-2">
              <HiPlus size={16} />
              <span>Create Workspace</span>
            </Button>
          </Link>
        </div>

        {/* Workspaces Grid */}
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
            />
          )
        ) : (
          <div className="workspaces-grid">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                variant="detailed"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShowMembers={handleShowMembers}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredWorkspaces.length > 0 && (
          <div className="workspaces-results-count">
            Showing {filteredWorkspaces.length} of {workspaces.length} workspace
            {workspaces.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </div>

      {/* Members Management Modal */}
      <Modal
        isOpen={showMembersModal && !!selectedWorkspace && !!selectedOrganization}
        onClose={() => setShowMembersModal(false)}
        title={`Manage Members - ${selectedWorkspace?.name || ''}`}
        className="sm:max-w-2xl"
      >
        {selectedWorkspace && selectedOrganization && (
          <MembersManager
            type="workspace"
            entityId={selectedWorkspace.id}
            organizationId={selectedOrganization.id}
            className="border-none"
            title={`${selectedWorkspace.name} Members`}
          />
        )}
      </Modal>
    </div>
  );
}
