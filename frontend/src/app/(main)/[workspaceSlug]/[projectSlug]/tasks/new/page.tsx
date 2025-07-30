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
import UserAvatar from "@/components/ui/avatars/UserAvatar";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";
import { useTask } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import {
  HiDocumentText,
  HiCog,
  HiUsers,
  HiTag,
  HiPaperClip,
  HiPlus,
  HiXMark,
  HiExclamationTriangle,
  HiArrowLeft
} from 'react-icons/hi2';

interface Props {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

// Custom section header with icon for task forms
const TaskSectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={16} className="text-primary" />
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
  </div>
);

export default function NewTaskPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const { workspaceSlug, projectSlug } = resolvedParams;
  const initialStatusName = searchParams.get("status") || "To Do";

  const {
    createTask,
    loading: taskLoading,
    error: taskError,
    clearError,
    getAllTaskStatuses,
    uploadAttachment,
    deleteAttachment,
    createLabel,
    getProjectLabels,
    getLabelById,
    updateLabel,
    deleteLabel,
    assignLabelToTask,
    assignMultipleLabelsToTask,
    removeLabelFromTask,
    searchLabels,
  } = useTask();
  const { getCurrentUser, isAuthenticated } = useAuth();
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace, getProjectMembers } = useProjectContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "MEDIUM",
    dueDate: "",
    projectId: "",
  });

  // Enhanced form state
  const [assignee, setAssignee] = useState<any>(null);
  const [reporter, setReporter] = useState<any>(null);
  const [labels, setLabels] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [availableLabels, setAvailableLabels] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // UI state
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");
  const [isUploading, setIsUploading] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);

  // Track the current route to prevent duplicate calls
  const currentRouteRef = useRef<string>('');
  const isFirstRenderRef = useRef(true);
  
  // Track if project members have been fetched to avoid duplicate calls
  const projectMembersLoadedRef = useRef(false);

  // Tag colors with hexadecimal values
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

  // Find project by slug
  const findProjectBySlug = (projects: any[], slug: string) => {
    return projects.find(
      (project) => generateProjectSlug(project.name) === slug
    );
  };

  // Validation function
  const isFormValid = (): boolean => {
    const hasTitle = formData.title.trim().length > 0;
    const hasProject = formData.projectId.length > 0;
    const hasStatus = formData.status.length > 0;
    const hasPriority = formData.priority.length > 0;
    const hasAssignment = assignee || reporter;
    
    return hasTitle && hasProject && hasStatus && hasPriority && hasAssignment;
  };

  useEffect(() => {
    const currentRoute = `${workspaceSlug}/${projectSlug}/tasks/new`;
    
    // Prevent duplicate calls for the same route
    if (currentRouteRef.current === currentRoute && !isFirstRenderRef.current) {
      return;
    }
    
    // Check authentication and get current user
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Only reset state and fetch if this is a new route
    if (currentRouteRef.current !== currentRoute) {
      // Reset state
      setWorkspace(null);
      setProjects([]);
      setFormData({
        title: "",
        description: "",
        status: "",
        priority: "MEDIUM",
        dueDate: "",
        projectId: "",
      });
      setAssignee(null);
      setReporter(null);
      setLabels([]);
      setSubtasks([]);
      setAttachments([]);
      setAvailableLabels([]);
      setAvailableStatuses([]);
      
      // Reset project members loaded flag
      projectMembersLoadedRef.current = false;
      
      currentRouteRef.current = currentRoute;
      
      // Fetch initial data
      const fetchData = async () => {
        try {
          const workspaceData = await getWorkspaceBySlug(workspaceSlug);
          setWorkspace(workspaceData);

          const projectsData = await getProjectsByWorkspace(workspaceData.id);
          setProjects(projectsData || []);
          
          // Find the current project and set as default
          const currentProject = findProjectBySlug(projectsData || [], projectSlug);
          if (currentProject) {
            setFormData(prev => ({ ...prev, projectId: currentProject.id }));
          }

          // Fetch task statuses
          try {
            const statuses = await getAllTaskStatuses();
            setAvailableStatuses(statuses);

            let initialStatusId = "";
            if (initialStatusName) {
              const matchingStatus = statuses.find(
                (s) => s.name.toLowerCase() === initialStatusName.toLowerCase()
              );
              initialStatusId = matchingStatus ? matchingStatus.id : statuses[0]?.id || "";
            } else {
              const defaultStatus = statuses.find((s) => (s as any).category === "TODO") || statuses[0];
              initialStatusId = defaultStatus?.id || "";
            }

            if (initialStatusId) {
              setFormData((prev) => ({ ...prev, status: initialStatusId }));
            }
          } catch (statusError) {
            console.error("❌ Error fetching task statuses:", statusError);
            setAvailableStatuses([]);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
    
    isFirstRenderRef.current = false;
  }, [workspaceSlug, projectSlug]);

  // Fetch project labels when project is selected
  useEffect(() => {
    const fetchProjectLabels = async () => {
      if (isAuthenticated() && formData.projectId) {
        try {
          const projectLabels = await getProjectLabels(formData.projectId);
          setAvailableLabels(projectLabels);
        } catch (error) {
          console.error("Error fetching project labels:", error);
          setAvailableLabels([]);
        }
      } else {
        setAvailableLabels([]);
        setLabels([]); // Clear selected labels when project changes
      }
    };

    fetchProjectLabels();
  }, [formData.projectId]);

  // Reset project members when project changes
  useEffect(() => {
    if (formData.projectId) {
      // Reset project members loaded flag when project changes
      projectMembersLoadedRef.current = false;
      setAssignee(null);
      setReporter(null);
    }
  }, [formData.projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
    setIsAddingSubtask(false);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Subtask",
      message: "Are you sure you want to delete this subtask?",
      type: "danger",
      onConfirm: () => {
        setSubtasks(subtasks.filter((subtask) => subtask.id !== subtaskId));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim() || !formData.projectId) return;

    try {
      const newLabel = await createLabel({
        name: newLabelName.trim(),
        color: newLabelColor,
        projectId: formData.projectId,
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
        message: error instanceof Error ? error.message : "Failed to create label. Please try again.",
        type: "danger",
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  const handleDeleteLabel = (labelId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Label",
      message: "Are you sure you want to remove this label from the task?",
      type: "danger",
      onConfirm: () => {
        setLabels(labels.filter((label) => label.id !== labelId));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      // Validate files
      const validFiles = Array.from(files).filter((file) => {
        if (file.size > maxFileSize) {
          console.warn(`File ${file.name} is too large (${formatFileSize(file.size)}). Maximum size is 10MB.`);
          return false;
        }
        if (!allowedTypes.includes(file.type)) {
          console.warn(`File ${file.name} has unsupported type: ${file.type}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        setConfirmModal({
          isOpen: true,
          title: "Invalid Files",
          message: "No valid files selected. Please ensure files are under 10MB and are of supported types (PNG, JPG, PDF, TXT, DOC, DOCX).",
          type: "warning",
          onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        });
        return;
      }

      // Store files temporarily until task is created
      const fileObjects = validFiles.map((file) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        file: file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        uploadedAt: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      }));

      setAttachments([...attachments, ...fileObjects]);
      
      if (validFiles.length < files.length) {
        setConfirmModal({
          isOpen: true,
          title: "Some Files Skipped",
          message: `${validFiles.length} of ${files.length} files were added. Some files were skipped due to size or type restrictions.`,
          type: "info",
          onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        });
      }
    } catch (error) {
      console.error("Failed to process files:", error);
      setConfirmModal({
        isOpen: true,
        title: "Error Processing Files",
        message: "There was an error processing the selected files. Please try again.",
        type: "danger",
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Attachment",
      message: "Are you sure you want to delete this attachment?",
      type: "danger",
      onConfirm: async () => {
        try {
          const attachment = attachments.find(att => att.id === attachmentId);
          
          // If it's an uploaded attachment (has API id), delete from server
          if (attachment && attachment.apiId && currentUser) {
            await deleteAttachment(attachment.apiId, currentUser.id);
          }
          
          // Remove from local state
          setAttachments(attachments.filter((attachment) => attachment.id !== attachmentId));
        } catch (error) {
          console.error("Error deleting attachment:", error);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setConfirmModal({
        isOpen: true,
        title: "Incomplete Form",
        message: "Please fill in all required fields: title, project, status, priority, and at least one assignee or reporter.",
        type: "warning",
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
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
        projectId: formData.projectId,
        statusId: formData.status,
      };

      if (assignee?.id) {
        taskData.assigneeId = assignee.id;
      }

      if (reporter?.id) {
        taskData.reporterId = reporter.id;
      }

      const newTask = await createTask(taskData);

      // Upload attachments after task creation
      if (attachments.length > 0) {
        try {
          const uploadPromises = attachments.map(async (attachment, index) => {
            if (attachment.file) {
              try {
                const uploadedAttachment = await uploadAttachment(newTask.id, attachment.file);
                return uploadedAttachment;
              } catch (uploadError) {
                console.error(`❌ Failed to upload ${attachment.name}:`, uploadError);
                throw uploadError;
              }
            }
          });
          await Promise.all(uploadPromises);
        } catch (attachmentError) {
          console.error("❌ Error uploading attachments:", attachmentError);
          setConfirmModal({
            isOpen: true,
            title: "Attachment Upload Failed",
            message: `Task was created successfully, but there was an error uploading attachments: ${attachmentError instanceof Error ? attachmentError.message : 'Unknown error'}`,
            type: "warning",
            onConfirm: () => {
              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
              router.push(`/${workspaceSlug}/${projectSlug}/tasks`);
            },
          });
          return;
        }
      }

      // Assign labels after task creation
      if (labels.length > 0) {
        try {
          const labelIds = labels.map(label => label.id);
          await assignMultipleLabelsToTask({
            taskId: newTask.id,
            labelIds: labelIds
          });
        } catch (labelError) {
          console.error("Error assigning labels:", labelError);
        }
      }

      setConfirmModal({
        isOpen: true,
        title: "Task Created",
        message: `"${formData.title}" has been created successfully.`,
        type: "info",
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          router.push(`/${workspaceSlug}/${projectSlug}/tasks`);
        },
      });
    } catch (error) {
      console.error("❌ Error creating task:", error);
      
      let errorMessage = "Failed to create task. Please try again.";
      if (taskError) {
        errorMessage = taskError;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setConfirmModal({
        isOpen: true,
        title: "Error",
        message: errorMessage,
        type: "danger",
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-24 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-10 bg-muted rounded"></div>
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

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <Alert variant="destructive">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Workspace Not Found</AlertTitle>
            <AlertDescription>
              The workspace "{workspaceSlug}" could not be found.
              <div className="mt-4">
                <Link href="/workspaces" className="text-primary hover:text-primary/80 underline">
                  Back to Workspaces
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
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${workspaceSlug}`}>
                  {workspace.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${workspaceSlug}/${projectSlug}`}>
                  {projects.find(p => generateProjectSlug(p.name) === projectSlug)?.name || projectSlug}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New Task</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Create New Task</h1>
            <Link href={`/${workspaceSlug}/${projectSlug}/tasks`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <HiArrowLeft size={14} />
                Back to Tasks
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <Card>
                <CardHeader>
                  <TaskSectionHeader icon={HiDocumentText} title="Basic Information" />
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
                    />
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-2">
                    <Label>Attachments ({attachments.length})</Label>
                    <div>
                      {attachments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                              <div className="flex items-center gap-2">
                                <HiPaperClip size={16} className="text-muted-foreground" />
                                <div>
                                  <p className="text-xs font-medium text-foreground">
                                    {attachment.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {attachment.size}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                              >
                                <HiXMark size={12} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col space-y-3">
                        <input
                          type="file"
                          id="file-upload-create"
                          multiple
                          accept=".png,.jpg,.jpeg,.pdf,.txt,.doc,.docx"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload-create"
                          className={`inline-flex items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-lg text-xs cursor-pointer transition-colors ${
                            isUploading
                              ? "text-muted-foreground cursor-not-allowed border-muted"
                              : "text-muted-foreground hover:border-primary hover:text-primary"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <HiPaperClip size={20} />
                            <span className="font-medium">
                              {isUploading ? "Uploading files..." : "Click to upload files"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              PNG, JPG, PDF, TXT, DOC, DOCX up to 10MB
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/${workspaceSlug}/${projectSlug}/tasks`}>
                      <Button variant="outline">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={!isFormValid() || isSubmitting || taskLoading}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting || taskLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            {/* Task Configuration Section */}
            <Card>
              <CardHeader>
                <TaskSectionHeader icon={HiCog} title="Task Configuration" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select value={formData.projectId || ""} onValueChange={(value) => setFormData(prev => ({...prev, projectId: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>
                          {proj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}
                    disabled={availableStatuses.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.length > 0 ? (
                        availableStatuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>Loading statuses...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {availableStatuses.length === 0 && isAuthenticated() && (
                    <p className="text-xs text-destructive">
                      Failed to load statuses. Please refresh the page.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({...prev, priority: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Low</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Medium</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="HIGH">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">High</Badge>
                        </div>
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
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assignment Section */}
            <Card>
              <CardHeader>
                <TaskSectionHeader icon={HiUsers} title="Assignment" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assignee *</Label>
                  <ProjectMemberDropdown
                    projectId={formData.projectId}
                    selectedUser={assignee}
                    onUserChange={setAssignee}
                    placeholder="Select assignee..."
                    allowUnassign={true}
                    unassignText="Unassign"
                    required={true}
                    disabled={!formData.projectId}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reporter</Label>
                  <ProjectMemberDropdown
                    projectId={formData.projectId}
                    selectedUser={reporter}
                    onUserChange={setReporter}
                    placeholder="Select reporter..."
                    allowUnassign={true}
                    unassignText="Remove reporter"
                    required={false}
                    disabled={!formData.projectId}
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
            <Card>
              <CardHeader>
                <TaskSectionHeader icon={HiTag} title={`Labels (${labels.length})`} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <Badge key={label.id} variant="secondary" className="flex items-center gap-1">
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
                    <div className="text-xs font-medium text-muted-foreground">Available labels:</div>
                    <div className="flex flex-wrap gap-2">
                      {availableLabels
                        .filter(label => !labels.find(l => l.id === label.id))
                        .map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => setLabels([...labels, label])}
                            className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLabelName(e.target.value)}
                      placeholder="Label name"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Select value={newLabelColor} onValueChange={setNewLabelColor}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tagColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: color.value}}></div>
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="submit" disabled={!newLabelName.trim() || !formData.projectId} size="sm">
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
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    disabled={!formData.projectId}
                  >
                    <HiPlus size={12} />
                    {!formData.projectId ? "Select project first" : "Add new label"}
                  </button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmModal.isOpen} onOpenChange={(open) => !open && setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <HiExclamationTriangle className={`h-6 w-6 ${
                confirmModal.type === 'danger' ? 'text-destructive' : 
                confirmModal.type === 'warning' ? 'text-yellow-500' : 
                'text-primary'
              }`} />
            </div>
            <DialogTitle className="text-center">{confirmModal.title}</DialogTitle>
            <DialogDescription className="text-center">
              {confirmModal.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.type === "danger" ? "destructive" : "default"}
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