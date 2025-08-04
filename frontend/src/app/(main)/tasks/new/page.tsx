"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ProjectMemberDropdown from "@/components/dropdowns/ProjectMemberDropdown";
import { useWorkspace } from "@/contexts/workspace-context";
import { useProject } from "@/contexts/project-context";
import { useTask } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import {
  HiDocumentText,
  HiCog,
  HiUsers,
  HiTag,
  HiPaperClip,
  HiPlus,
  HiXMark,
  HiExclamationTriangle,
  HiArrowLeft,
  HiChevronDown
} from 'react-icons/hi2';

interface Props {
  params: Promise<{
    workspaceSlug?: string;
    projectSlug?: string;
  }>;
}

const TaskSectionHeader = ({
  icon: Icon,
  title,
}: {
  icon: any;
  title: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={16} className="text-[var(--primary)]" />
    <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
  </div>
);

export default function NewTaskPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const { workspaceSlug, projectSlug } = resolvedParams;
  const initialStatusName = searchParams.get("status") || "To Do";

  // Context hooks
  const { currentOrganization } = useOrganization();
  const {
    workspaces,
    getWorkspacesByOrganization,
    isLoading: workspaceLoading,
  } = useWorkspace();
  const {
    projects,
    getProjectsByWorkspace,
    isLoading: projectLoading,
  } = useProject();
  const {
    createTask,
    getAllTaskStatuses,
    uploadAttachment,
    deleteAttachment,
    createAttachment,
    createLabel,
    getProjectLabels,
    assignMultipleLabelsToTask,
    isLoading: taskLoading,
    error: taskError,
    clearError,
  } = useTask();
  const { getCurrentUser, isAuthenticated, uploadFileToS3 } = useAuth();

  // State
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  // Enhanced form state
  const [assignee, setAssignee] = useState<any>(null);
  const [reporter, setReporter] = useState<any>(null);
  const [labels, setLabels] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  // New: Store files selected but not yet uploaded
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [availableLabels, setAvailableLabels] = useState<any[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);

  // UI state
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");
  const [isUploading, setIsUploading] = useState(false);

  const currentUser = getCurrentUser();
  const isInitializedRef = useRef(false);

  // Tag colors
  const tagColors = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Green", value: "#10B981" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Red", value: "#EF4444" },
    { name: "Gray", value: "#6B7280" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Pink", value: "#EC4899" },
  ];

  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  // Utility function
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      if (
        !isAuthenticated() ||
        !currentOrganization?.id ||
        isInitializedRef.current
      )
        return;

      try {
        setIsLoading(true);

        // Load workspaces
        await getWorkspacesByOrganization(currentOrganization.id);

        // Load task statuses
        const statuses = await getAllTaskStatuses();
        setAvailableStatuses(statuses);

        // Set initial status
        let initialStatusId = "";
        if (initialStatusName) {
          const matchingStatus = statuses.find(
            (s) => s.name.toLowerCase() === initialStatusName.toLowerCase()
          );
          initialStatusId = matchingStatus
            ? matchingStatus.id
            : statuses[0]?.id || "";
        } else {
          const defaultStatus =
            statuses.find((s) => (s as any).category === "TODO") || statuses[0];
          initialStatusId = defaultStatus?.id || "";
        }

        if (initialStatusId) {
          setFormData((prev) => ({ ...prev, status: initialStatusId }));
        }

        isInitializedRef.current = true;
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [currentOrganization?.id, isAuthenticated]);

  // Handle workspace selection from URL or user selection
  useEffect(() => {
    if (workspaces.length > 0 && workspaceSlug) {
      const workspace = workspaces.find(
        (w) => w.slug.toLowerCase() === workspaceSlug.toLowerCase()
      );
      if (workspace && workspace.id !== selectedWorkspace?.id) {
        setSelectedWorkspace(workspace);
      }
    }
  }, [workspaces, workspaceSlug, selectedWorkspace?.id]);

  // Load projects when workspace is selected
  useEffect(() => {
    const loadProjects = async () => {
      if (selectedWorkspace?.id) {
        try {
          await getProjectsByWorkspace(selectedWorkspace.id);
        } catch (error) {
          console.error("Error loading projects:", error);
        }
      }
    };

    loadProjects();
  }, [selectedWorkspace?.id]);

  // Handle project selection from URL or user selection
  useEffect(() => {
    if (projects.length > 0 && projectSlug) {
      const project = projects.find(
        (p) => generateProjectSlug(p.name) === projectSlug.toLowerCase()
      );
      if (project && project.id !== selectedProject?.id) {
        setSelectedProject(project);
      }
    }
  }, [projects, projectSlug, selectedProject?.id]);

  // Load project labels when project is selected
  useEffect(() => {
    const fetchProjectLabels = async () => {
      if (selectedProject?.id) {
        try {
          const projectLabels = await getProjectLabels(selectedProject.id);
          setAvailableLabels(projectLabels);
        } catch (error) {
          console.error("Error fetching project labels:", error);
          setAvailableLabels([]);
        }
      } else {
        setAvailableLabels([]);
        setLabels([]);
      }
    };

    fetchProjectLabels();
  }, [selectedProject?.id]);

  // Generate slug from project name
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

  // Validation function
  const isFormValid = (): boolean => {
    const hasTitle = formData.title.trim().length > 0;
    const hasProject = selectedProject?.id;
    const hasStatus = formData.status.length > 0;
    const hasPriority = formData.priority.length > 0;
    const hasAssignment = assignee || reporter;

    return hasTitle && hasProject && hasStatus && hasPriority && hasAssignment;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    setSelectedWorkspace(workspace);
    setSelectedProject(null);
    setAssignee(null);
    setReporter(null);
    setLabels([]);
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    setSelectedProject(project);
    setAssignee(null);
    setReporter(null);
    setLabels([]);
  };

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim() || !selectedProject?.id) return;

    try {
      const newLabel = await createLabel({
        name: newLabelName.trim(),
        color: newLabelColor,
        projectId: selectedProject.id,
      });

      setLabels([...labels, newLabel]);
      setAvailableLabels([...availableLabels, newLabel]);
      setNewLabelName("");
      setNewLabelColor("#3B82F6");
      setIsAddingLabel(false);
    } catch (error) {
      console.error("Error creating label:", error);
      setConfirmModal({
        isOpen: true,
        title: "Error Creating Label",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create label. Please try again.",
        type: "danger",
        onConfirm: () =>
          setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  const handleDeleteLabel = (labelId: string) => {
    setLabels(labels.filter((label) => label.id !== labelId));
  };

  // Fixed file upload function
  // New: Only validate and store files, do not upload yet
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
      "text/plain",
    ];

    const validFiles = Array.from(files).filter((file) => {
      if (file.size > maxFileSize) {
        console.warn(`File ${file.name} is too large`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        console.warn(`File ${file.name} has unsupported type`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setConfirmModal({
        isOpen: true,
        title: "Invalid Files",
        message:
          "No valid files selected. Please ensure files are under 10MB and are of supported types.",
        type: "warning",
        onConfirm: () =>
          setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    // Add to pendingFiles
    setPendingFiles((prev) => [...prev, ...validFiles]);
    event.target.value = "";
  };

  // New: Upload pending files to S3 when user clicks upload
  const handleUploadPendingFiles = async () => {
    if (!selectedProject?.id || pendingFiles.length === 0) return;
    setIsUploading(true);
    try {
      const uploadedFiles: any[] = [];
      for (const file of pendingFiles) {
        try {
          const extension = file.name.split(".").pop() || 'bin';
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substr(2, 5);
          const s3Key = `attachments/${selectedProject.id}/${timestamp}-${randomId}.${extension}`;
          console.log(`Uploading ${file.name} to S3 with key: ${s3Key}`);
          const s3Response = await uploadFileToS3(file, s3Key);
          console.log(`Successfully uploaded ${file.name} to S3. URL: ${s3Response.url}`);
          const attachmentObject = {
            id: `temp-${timestamp}-${randomId}`,
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            s3Key: s3Key,
            s3Url: s3Response.url,
            fileSize: file.size,
            uploaded: true,
            isTemporary: true,
          };
          // Log the uploaded file's URL
          console.log(`Attachment uploaded: ${file.name}, URL: ${s3Response.url}`);
          uploadedFiles.push(attachmentObject);
        } catch (error) {
          console.error("Failed to upload file:", file.name, error);
          setConfirmModal({
            isOpen: true,
            title: "Upload Failed",
            message: `Failed to upload ${file.name}. ${error instanceof Error ? error.message : 'Please try again.'}`,
            type: "danger",
            onConfirm: () =>
              setConfirmModal((prev) => ({ ...prev, isOpen: false })),
          });
        }
      }
      if (uploadedFiles.length > 0) {
        setAttachments((prevAttachments) => [...prevAttachments, ...uploadedFiles]);
        console.log(`Successfully uploaded ${uploadedFiles.length} files`);
      }
      setPendingFiles([]); // Clear pending files after upload
    } finally {
      setIsUploading(false);
    }
  };

  // Fixed delete attachment function (TypeScript: pass attachmentId and userId)
  const handleDeleteAttachment = async (attachmentId: string) => {
    const attachment = attachments.find((a) => a.id === attachmentId);
    if (!attachment) return;

    try {
      // If it's a temporary attachment (uploaded but not yet in database)
      if (attachment.isTemporary) {
        setAttachments(attachments.filter((a) => a.id !== attachmentId));
        // Note: The file remains in S3. In production, you might want to clean up orphaned S3 files
        return;
      }

      // If it's a real attachment (saved to database), call delete API with attachmentId and userId
      if (!currentUser?.id) throw new Error("No user found");
      await deleteAttachment(attachmentId, currentUser.id);
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
    } catch (error) {
      console.error("Error deleting attachment:", error);
      setConfirmModal({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete attachment. Please try again.",
        type: "danger",
        onConfirm: () =>
          setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  // Fixed submit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setConfirmModal({
        isOpen: true,
        title: "Incomplete Form",
        message:
          "Please fill in all required fields: title, project, status, priority, and at least one assignee or reporter.",
        type: "warning",
        onConfirm: () =>
          setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const taskData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || "",
        priority: formData.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
        startDate: new Date().toISOString(),
        dueDate: formData.dueDate
          ? new Date(formData.dueDate + "T17:00:00.000Z").toISOString()
          : new Date().toISOString(),
        projectId: selectedProject.id,
        statusId: formData.status,
      };

      if (assignee?.id) {
        taskData.assigneeId = assignee.id;
      }

      if (reporter?.id) {
        taskData.reporterId = reporter.id;
      }

      console.log("Creating task with data:", taskData);
      const newTask = await createTask(taskData);
      console.log("Task created successfully:", newTask);

      // Handle attachments - files are already uploaded to S3, now create attachment records
      if (attachments.length > 0) {
        try {
          console.log(`Processing ${attachments.length} attachments...`);
          const tempAttachments = attachments.filter(
            (attachment) => attachment.isTemporary && attachment.s3Key
          );

          if (tempAttachments.length > 0) {
            const attachmentPromises = tempAttachments.map(async (attachment) => {
              try {
                // Use createAttachment API: expects metadata with taskId
                const attachmentMetadata = {
                  fileName: attachment.name,
                  filePath: attachment.s3Key,
                  fileSize: attachment.fileSize,
                  mimeType: attachment.type,
                  taskId: newTask.id,
                };
                console.log(`Creating attachment record for: ${attachment.name}`);
                return await createAttachment(attachmentMetadata);
              } catch (attachmentError) {
                console.error(
                  `Failed to create attachment record for ${attachment.name}:`,
                  attachmentError
                );
                throw attachmentError;
              }
            });

            const createdAttachments = await Promise.all(attachmentPromises);
            console.log(
              `Successfully created ${createdAttachments.length} attachment records`
            );
          }
        } catch (attachmentError) {
          console.error("Error creating attachment records:", attachmentError);
          // Task was created but attachments failed - show partial success
          setConfirmModal({
            isOpen: true,
            title: "Partial Success",
            message: `Task "${formData.title}" was created successfully, but some attachments failed to save. The files are uploaded to storage but may need to be re-attached to the task.`,
            type: "warning",
            onConfirm: () => {
              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
              router.push(`/tasks`);
            },
          });
          return;
        }
      }

      // Assign labels after task creation
      if (labels.length > 0) {
        try {
          console.log(`Assigning ${labels.length} labels to task...`);
          const labelIds = labels.map((label) => label.id);
          await assignMultipleLabelsToTask({
            taskId: newTask.id,
            labelIds: labelIds,
          });
          console.log("Labels assigned successfully");
        } catch (labelError) {
          console.error("Error assigning labels:", labelError);
          // Continue - this is non-critical
        }
      }

      // Success - everything completed
      const attachmentCount = attachments.filter((a) => a.isTemporary).length;
      setConfirmModal({
        isOpen: true,
        title: "Task Created Successfully",
        message: `"${formData.title}" has been created successfully${
          attachmentCount > 0 ? ` with ${attachmentCount} attachment(s)` : ""
        }.`,
        type: "info",
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          router.push(`/tasks`);
        },
      });
    } catch (error) {
      console.error("Error creating task:", error);

      let errorMessage = "Failed to create task. Please try again.";
      if (taskError) {
        errorMessage = taskError;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setConfirmModal({
        isOpen: true,
        title: "Error Creating Task",
        message: errorMessage,
        type: "danger",
        onConfirm: () =>
          setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBackUrl = () => {
    if (selectedWorkspace && selectedProject) {
      return `/${selectedWorkspace.slug}/${generateProjectSlug(
        selectedProject.name
      )}/tasks`;
    } else if (selectedWorkspace) {
      return `/${selectedWorkspace.slug}`;
    }
    return "/tasks";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--muted)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-6 bg-[var(--muted)] rounded w-1/4 mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-10 bg-[var(--muted)] rounded"></div>
                        <div className="h-24 bg-[var(--muted)] rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <Alert variant="destructive">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please log in to create a task.
              <div className="mt-4">
                <Link href="/auth/login" className="text-[var(--primary)] hover:text-[var(--primary)]/80 underline">
                  Go to Login
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          {selectedWorkspace && selectedProject && (
            <Breadcrumb className="mb-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${selectedWorkspace.slug}`}>
                    {selectedWorkspace.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={`/${selectedWorkspace.slug}/${generateProjectSlug(
                      selectedProject.name
                    )}`}
                  >
                    {selectedProject.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>New Task</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Create New Task
            </h1>
            <Link href={getBackUrl()}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <HiArrowLeft size={14} />
                Back
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <TaskSectionHeader
                    icon={HiDocumentText}
                    title="Basic Information"
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="What needs to be done?"
                      className="border-[var(--border)] bg-[var(--background)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe the task in detail..."
                      className="border-[var(--border)] bg-[var(--background)]"
                    />
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-2">
                    <Label>Attachments ({attachments.length + pendingFiles.length})</Label>
                    <div>
                      {/* Show uploaded attachments */}
                      {attachments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20"
                            >
                              <div className="flex items-center gap-2">
                                <HiPaperClip
                                  size={16}
                                  className="text-[var(--muted-foreground)]"
                                />
                                <div>
                                  <p className="text-sm font-medium text-[var(--foreground)]">
                                    {attachment.name}
                                  </p>
                                  <p className="text-xs text-[var(--muted-foreground)]">
                                    {attachment.size}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleDeleteAttachment(attachment.id)
                                }
                              >
                                <HiXMark size={12} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Show pending files (not yet uploaded) */}
                      {pendingFiles.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {pendingFiles.map((file, idx) => (
                            <div
                              key={file.name + file.size + idx}
                              className="flex items-center justify-between p-3 border border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]/10"
                            >
                              <div className="flex items-center gap-2">
                                <HiPaperClip size={16} className="text-[var(--primary)]" />
                                <div>
                                  <p className="text-sm font-medium text-[var(--foreground)]">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-[var(--muted-foreground)]">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              {/* Show an icon to indicate file is attached but not uploaded */}
                              <span title="File ready to upload" className="text-yellow-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3.5 3.5M12 8l3.5 3.5" />
                                </svg>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col space-y-3">
                        <Input
                          type="file"
                          id="file-upload-create"
                          multiple
                          accept=".png,.jpg,.jpeg,.pdf,.txt"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload-create"
                          className={`inline-flex items-center justify-center w-full p-4 border-2 border-dashed border-[var(--border)] rounded-lg text-sm cursor-pointer transition-colors ${
                            isUploading
                              ? "text-[var(--muted-foreground)] cursor-not-allowed border-[var(--muted)]"
                              : "text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <HiPaperClip size={20} />
                            <span className="font-medium">
                              {isUploading
                                ? "Uploading files..."
                                : "Click to select files"}
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              PNG, JPG, PDF, TXT up to 10MB
                            </span>
                          </div>
                        </label>
                        {/* Upload button for pending files */}
                        {pendingFiles.length > 0 && (
                          <Button
                            type="button"
                            onClick={handleUploadPendingFiles}
                            disabled={isUploading}
                            className="w-full bg-[var(--primary)] text-[var(--primary-foreground)]"
                          >
                            {isUploading ? "Uploading..." : `Upload ${pendingFiles.length} File(s)`}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={getBackUrl()}>
                      <Button variant="outline">Cancel</Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={!isFormValid() || isSubmitting || taskLoading}
                      className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)]"
                    >
                      {isSubmitting || taskLoading ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        "Create Task"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Workspace & Project Selection */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <TaskSectionHeader icon={HiCog} title="Workspace & Project" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace">Workspace *</Label>
                  <Select
                    value={selectedWorkspace?.id || ""}
                    onValueChange={handleWorkspaceChange}
                    disabled={workspaceLoading}
                  >
                    <SelectTrigger className="border-[var(--border)] bg-[var(--background)]">
                      <SelectValue placeholder="Select a workspace" />
                    </SelectTrigger>
                    <SelectContent className="border-[var(--border)] bg-[var(--popover)]">
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={selectedProject?.id || ""}
                    onValueChange={handleProjectChange}
                    disabled={!selectedWorkspace || projectLoading}
                  >
                    <SelectTrigger className="border-[var(--border)] bg-[var(--background)]">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent className="border-[var(--border)] bg-[var(--popover)]">
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Task Configuration Section */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <TaskSectionHeader icon={HiCog} title="Task Configuration" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                    disabled={availableStatuses.length === 0}
                  >
                    <SelectTrigger className="border-[var(--border)] bg-[var(--background)]">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent className="border-[var(--border)] bg-[var(--popover)]">
                      {availableStatuses.length > 0 ? (
                        availableStatuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Loading statuses...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="border-[var(--border)] bg-[var(--background)]">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="border-[var(--border)] bg-[var(--popover)]">
                      <SelectItem value="LOW">
                        <Badge variant="outline">Low</Badge>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <Badge variant="secondary">Medium</Badge>
                      </SelectItem>
                      <SelectItem value="HIGH">
                        <Badge variant="destructive">High</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="border-[var(--border)] bg-[var(--background)]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assignment Section */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <TaskSectionHeader icon={HiUsers} title="Assignment" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assignee *</Label>
                  <ProjectMemberDropdown
                    projectId={selectedProject?.id}
                    selectedUser={assignee}
                    onUserChange={setAssignee}
                    placeholder="Select assignee..."
                    allowUnassign={true}
                    unassignText="Unassign"
                    required={true}
                    disabled={!selectedProject?.id}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reporter</Label>
                  <ProjectMemberDropdown
                    projectId={selectedProject?.id}
                    selectedUser={reporter}
                    onUserChange={setReporter}
                    placeholder="Select reporter..."
                    allowUnassign={true}
                    unassignText="Remove reporter"
                    required={false}
                    disabled={!selectedProject?.id}
                  />
                </div>

                {!assignee && !reporter && (
                  <Alert variant="destructive">
                    <HiExclamationTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please assign at least one assignee or reporter
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Labels Section */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <TaskSectionHeader
                  icon={HiTag}
                  title={`Labels (${labels.length})`}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {label.name}
                      <button
                        type="button"
                        onClick={() => handleDeleteLabel(label.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <HiXMark size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Available labels from project */}
                {availableLabels.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[var(--muted-foreground)]">
                      Available labels:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableLabels
                        .filter(
                          (label) => !labels.find((l) => l.id === label.id)
                        )
                        .map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => setLabels([...labels, label])}
                            className="text-xs px-2 py-1 rounded-md bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                          >
                            {label.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {isAddingLabel ? (
                  <form onSubmit={handleAddLabel} className="space-y-3">
                    <Input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Label name"
                      autoFocus
                      className="border-[var(--border)] bg-[var(--background)]"
                    />
                    <div className="flex items-center gap-2">
                      <Select
                        value={newLabelColor}
                        onValueChange={setNewLabelColor}
                      >
                        <SelectTrigger className="flex-1 border-[var(--border)] bg-[var(--background)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-[var(--border)] bg-[var(--popover)]">
                          {tagColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: color.value }}
                                ></div>
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="submit"
                        disabled={!newLabelName.trim() || !selectedProject?.id}
                        size="sm"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingLabel(false);
                          setNewLabelName("");
                          setNewLabelColor("#3B82F6");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingLabel(true)}
                    className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1"
                    disabled={!selectedProject?.id}
                  >
                    <HiPlus size={12} />
                    {!selectedProject?.id
                      ? "Select project first"
                      : "Add new label"}
                  </button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmModal.isOpen}
        onOpenChange={(open) =>
          !open && setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <DialogContent className="border-[var(--border)] bg-[var(--card)]">
          <DialogHeader>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[var(--muted)] mb-4">
              <HiExclamationTriangle
                className={`h-6 w-6 ${
                  confirmModal.type === "danger"
                    ? "text-destructive"
                    : confirmModal.type === "warning"
                    ? "text-yellow-500"
                    : "text-[var(--primary)]"
                }`}
              />
            </div>
            <DialogTitle className="text-center text-[var(--foreground)]">
              {confirmModal.title}
            </DialogTitle>
            <DialogDescription className="text-center text-[var(--muted-foreground)]">
              {confirmModal.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmModal((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmModal.type === "danger" ? "destructive" : "default"
              }
              onClick={confirmModal.onConfirm}
            >
              {confirmModal.type === "danger" ? "Delete" : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
