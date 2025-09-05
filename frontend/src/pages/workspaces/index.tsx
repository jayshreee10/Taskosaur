import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import ActionButton from "@/components/common/ActionButton";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { EntityCard } from "@/components/common/EntityCard";
import { EmptyState } from "@/components/ui";
import { HiUsers, HiFolder, HiSearch } from "react-icons/hi";
import { HiViewGrid } from "react-icons/hi";
import Loader from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";
import NewWorkspaceDialog from "@/components/workspace/NewWorkspaceDialogProps";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

function WorkspacesPageContent() {
  const {
    workspaces,
    isLoading,
    error,
    getWorkspacesByOrganization,
    getCurrentOrganizationId,
    clearError,
  } = useWorkspaceContext();
  const { getUserAccess } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const currentOrganization = getCurrentOrganizationId();
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) {
      return workspaces;
    }
    return workspaces.filter(
      (workspace) =>
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workspace.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        workspace.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workspaces, searchQuery]);

  const fetchData = useCallback(async () => {
    if (!currentOrganization) {
      return;
    }
    try {
      await getWorkspacesByOrganization(currentOrganization);
    } catch (error) {
      if (
        error.message?.includes("401") ||
        error.message?.includes("Unauthorized")
      ) {
        toast.error("Authentication required. Please log in again.");
      } else {
        toast.error("Failed to load workspaces");
      }
    }
  }, [currentOrganization, getWorkspacesByOrganization]);

  const retryFetch = useCallback(() => {
    clearError();
    fetchData();
  }, [clearError]);

  const didFetchRef = useRef(false);
  useEffect(() => {
    if (currentOrganization && !didFetchRef.current) {
      didFetchRef.current = true;
      fetchData();
    }
    if (!currentOrganization) return;
    getUserAccess({ name: "organization", id: currentOrganization })
      .then((data) => {
        setHasAccess(data?.canChange);
      })
      .catch((error) => {
        console.error("Error fetching user access:", error);
      });
  }, [currentOrganization]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  const handleWorkspaceCreated = useCallback(async () => {
    try {
      await fetchData();
      toast.success("Workspace created successfully!");
    } catch (error) {
      toast.error("Error refreshing workspaces after creation");
    }
  }, []);

  if (isLoading && workspaces.length === 0) {
    return <Loader text="Fetching workspace details" />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retryFetch} />;
  }

  return (
    <div className="dashboard-container">
      <div className="space-y-6 text-md ">
        <PageHeader
          icon={<HiViewGrid className="size-5" />}
          title="Workspaces"
          description="Manage your workspaces efficiently and collaborate with your team."
          actions={
            <>
              <div className="relative max-w-xs w-full">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <Input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 rounded-md border border-[var(--border)]"
                />
              </div>
              {hasAccess && (
                <NewWorkspaceDialog
                  open={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                  onWorkspaceCreated={handleWorkspaceCreated}
                  refetchWorkspaces={handleWorkspaceCreated}
                >
                  <ActionButton
                    primary
                    showPlusIcon
                    onClick={() => setIsDialogOpen(true)}
                  >
                    New Workspace
                  </ActionButton>
                </NewWorkspaceDialog>
              )}
            </>
          }
        />
        {isLoading && workspaces.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
          </div>
        )}
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
              description="Create your first workspace to get started with organizing your projects and collaborating with your team."
            />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-16">
            {filteredWorkspaces.map((ws) => (
              <EntityCard
                key={ws.id}
                href={`/${ws.slug}`}
                leading={
                  <div className="w-10 h-10 rounded-md bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-semibold">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                }
                heading={ws.name}
                subheading={ws.slug}
                description={ws.description}
                footer={
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <HiFolder size={12} />
                      {ws._count?.projects ?? ws.projectCount ?? 0} projects
                    </span>
                    <span className="flex items-center gap-1">
                      <HiUsers size={12} />
                      {ws._count?.members ?? ws.memberCount ?? 0} members
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        )}
        {filteredWorkspaces.length > 0 && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full min-h-[48px] flex items-center justify-center pb-4 pointer-events-none">
            <p className="text-sm text-[var(--muted-foreground)] pointer-events-auto">
              Showing {filteredWorkspaces.length} workspace
              {filteredWorkspaces.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspacesPage() {
  return <WorkspacesPageContent />;
}
