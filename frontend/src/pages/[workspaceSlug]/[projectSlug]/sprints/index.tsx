import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSprint } from "@/contexts/sprint-context";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HiPlus, HiExclamationTriangle, HiRocketLaunch } from "react-icons/hi2";
import { Sprint } from "@/types";
import { SprintCard } from "@/components/sprints/SprintCard";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { SprintFormModal } from "@/components/sprints/SprintFormModal";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";

function SprintsPageContent() {
  const router = useRouter();
  const { projectSlug, projectId, workspaceSlug } = router.query;

  const {
    sprints,
    isLoading,
    error,
    listSprints,
    createSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    clearError,
  } = useSprint();

  const authContext = useAuth();
  const workspaceContext = useWorkspaceContext();
  const projectContext = useProjectContext();
  const [projectData, setProjectData] = useState<any>(null);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { getUserAccess } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  // Load sprints on mount
  useEffect(() => {
    if (projectSlug) {
      listSprints({ slug: projectSlug as string });
    }
  }, [projectSlug]);

  useEffect(() => {
    loadData();
  }, [workspaceSlug, projectSlug]);

  const generateProjectSlug = (projectName: string) => {
    if (!projectName) return "";

    return projectName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const findProjectBySlug = (projects: any[], slug: string) => {
    return projects.find(
      (project) => project.slug === slug
    );
  };

  const loadData = async () => {
    try {
      if (!authContext.isAuthenticated()) {
        router.push("/auth/login");
        return;
      }

      if (
        typeof workspaceSlug !== "string" ||
        typeof projectSlug !== "string"
      ) {
        return;
      }

      const workspace = await workspaceContext.getWorkspaceBySlug(
        workspaceSlug
      );
      if (!workspace) {
        return;
      }
      setWorkspaceData(workspace);

      const projects = await projectContext.getProjectsByWorkspace(
        workspace.id
      );
      const project = findProjectBySlug(projects || [], projectSlug);

      if (!project) {
        return;
      }
      setProjectData(project);
    } catch (err) {
      console.error("Error loading page data:", err);
    }
  };

  useEffect(() => {
    if (!projectData?.id) return;
    getUserAccess({ name: "project", id: projectData?.id })
      .then((data) => {
        setHasAccess(data?.canChange);
      })
      .catch((error) => {
        console.error("Error fetching user access:", error);
      });
  }, [projectData?.id]);

  // Handle create/update sprint
  const handleSaveSprint = async (data: any) => {
    try {
      if (editingSprint) {
        // Remove projectId from update payload
        const { projectId, ...updateData } = data;
        await updateSprint(editingSprint.id, updateData);
      } else {
        const payload = {
          ...data,
          projectId: projectId || data.projectId,
          status: "PLANNING",
        };
        await createSprint(payload);
      }

      if (projectSlug) {
        await listSprints({ slug: projectSlug as string });
      }

      // ✅ close modal after save
      setIsSprintModalOpen(false);
      setEditingSprint(null);
    } catch (error) {
      console.error("Error saving sprint:", error);
      throw error;
    }
  };

  // Handle delete sprint
  const handleDeleteSprint = async () => {
    if (!deletingSprint) return;
    setIsDeleting(true);
    try {
      await deleteSprint(deletingSprint.id);
      setDeletingSprint(null);
      setIsDeleteModalOpen(false);

      if (projectSlug) {
        await listSprints({ slug: projectSlug as string });
      }
    } catch (error) {
      console.error("Error deleting sprint:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle status changes
  const handleStatusChange = async (
    sprintId: string,
    action: "start" | "complete"
  ) => {
    try {
      if (action === "start") {
        await startSprint(sprintId);
      } else if (action === "complete") {
        await completeSprint(sprintId);
      }

      if (projectSlug) {
        await listSprints({ slug: projectSlug as string });
      }
    } catch (error) {
      console.error(`Error ${action}ing sprint:`, error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-[var(--muted-foreground)]">
            Loading sprints...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Sprint Management"
          description="Organize your work into focused iterations and track progress effectively."
          actions={
            hasAccess && (
              <Button
                onClick={() => {
                  setEditingSprint(null);
                  setIsSprintModalOpen(true);
                }}
                className="h-10 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium flex items-center gap-2"
              >
                <HiPlus className="w-4 h-4" />
                Create Sprint
              </Button>
            )
          }
        />

        {/* Error Alert */}
        {error && (
          <Alert className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-auto p-1 text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Sprints Grid */}
        {sprints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sprints.map((sprint) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                onEdit={() => {
                  setEditingSprint(sprint);
                  setIsSprintModalOpen(true);
                }}
                onDelete={() => {
                  setDeletingSprint(sprint);
                  setIsDeleteModalOpen(true);
                }}
                onStatusChange={(action) =>
                  handleStatusChange(sprint.id, action)
                }
                hasAccess={hasAccess}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--muted)] flex items-center justify-center">
              <HiRocketLaunch className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No sprints yet
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
              Create your first sprint to start organizing your work into
              focused iterations.
            </p>
          
          </div>
        )}

        {/* Modals */}
        <SprintFormModal
          isOpen={isSprintModalOpen}
          onClose={() => {
            setIsSprintModalOpen(false);
            setEditingSprint(null);
          }}
          sprint={editingSprint}
          projectSlug={projectSlug as string}
          onSave={handleSaveSprint}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingSprint(null);
          }}
          onConfirm={handleDeleteSprint}
          title="Delete Sprint"
          message={`Are you sure you want to delete the sprint "${deletingSprint?.name || ""}"? This action cannot be undone.`}
          confirmText={isDeleting ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
}

export default function SprintsPage() {
  return <SprintsPageContent />;
}
