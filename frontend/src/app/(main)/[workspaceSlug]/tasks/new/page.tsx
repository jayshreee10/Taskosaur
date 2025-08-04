"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import ProjectMemberDropdown from "@/components/dropdowns/ProjectMemberDropdown";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";
import { useTask } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import {
  HiDocumentText,
  HiCog,
  HiUsers,
  HiTag,
  HiPaperClip, HiPlus,
  HiXMark,
  HiChevronDown, HiExclamationTriangle,
  HiArrowLeft
} from 'react-icons/hi2';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import '@/app/globals.css';

interface Props {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

// Reusable UI Components

export default function NewTaskPage({ params }: Props) {
  const {
    createTask,
    error: taskError,
    clearError,
    getAllTaskStatuses,
    uploadAttachment,
    deleteAttachment,
    createLabel,
    getProjectLabels,
    assignMultipleLabelsToTask,
  } = useTask();
  // Local loading state for task submission
  const [taskLoading, setTaskLoading] = useState(false);
  const { getAllUsers, getCurrentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { workspaceSlug } = use(params);
  const initialStatusName = searchParams.get("status") || "To Do";

  const [workspace, setWorkspace] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
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

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');
  const currentSlugRef = useRef<string>('');
  const isInitializedRef = useRef(false);

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
  const [newLabelColor, setNewLabelColor] = useState("blue");
  const [isUploading, setIsUploading] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);

  const tagColors = ["blue", "purple", "green", "yellow", "red", "gray", "indigo", "pink"];

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
    const initializeData = async () => {
      const pageKey = `${workspaceSlug}/tasks/new`;
      const requestId = `${pageKey}-${Date.now()}-${Math.random()}`;
      if (!isMountedRef.current || (currentSlugRef.current === pageKey && isInitializedRef.current && workspace && project)) {
        return;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      requestIdRef.current = requestId;
      currentSlugRef.current = pageKey;
      if (!workspaceSlug || !isAuthenticated()) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        const workspaceData = await getWorkspaceBySlug(workspaceSlug);
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        if (!workspaceData) {
          setIsLoading(false);
          return;
        }
        setWorkspace(workspaceData);
        const projectsData = await getProjectsByWorkspace(workspaceData.id);
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        setProject(projectsData);
        const statuses = await getAllTaskStatuses();
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        setAvailableStatuses(statuses || []);
        let initialStatusId = "";
        if (initialStatusName && statuses && statuses.length > 0) {
          const matchingStatus = statuses.find(
            (s) => s.name.toLowerCase() === initialStatusName.toLowerCase()
          );
          initialStatusId = matchingStatus ? matchingStatus.id : statuses[0]?.id || "";
        } else if (statuses && statuses.length > 0) {
          const defaultStatus = statuses.find((s) => 
            s.name.toLowerCase().includes("todo") || 
            s.name.toLowerCase().includes("to do") ||
            (s as any).category === "TODO"
          ) || statuses[0];
          initialStatusId = defaultStatus?.id || "";
        }
        if (initialStatusId) {
          setFormData((prev) => ({ ...prev, status: initialStatusId }));
        }
        isInitializedRef.current = true;
      } catch (error) {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          isInitializedRef.current = false;
        }
      } finally {
        if (requestIdRef.current === requestId && isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    const pageKey = `${workspaceSlug}/tasks/new`;
    if (currentSlugRef.current !== pageKey) {
      isInitializedRef.current = false;
      setWorkspace(null);
      setProject(null);
    }
    const timeoutId = setTimeout(() => {
      initializeData();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [workspaceSlug]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;
      currentSlugRef.current = '';
      requestIdRef.current = '';
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const retryFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    isInitializedRef.current = false;
    currentSlugRef.current = '';
    requestIdRef.current = '';
    setWorkspace(null);
    setProject(null);
    setIsLoading(true);
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [getCurrentUser]);

  useEffect(() => {
    const fetchProjectLabels = async () => {
      if (isAuthenticated() && formData.projectId) {
        try {
          const projectLabels = await getProjectLabels(formData.projectId);
          setAvailableLabels(projectLabels);
        } catch (error) {
          setAvailableLabels([]);
        }
      } else {
        setAvailableLabels([]);
        setLabels([]);
        setAssignee(null);
        setReporter(null);
      }
    };
    fetchProjectLabels();
  }, [isAuthenticated, formData.projectId, getProjectLabels]);

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
      setIsAddingLabel(false);
    } catch (error) {
      console.error("Error creating label:", error);
    }
  };

  const handleDeleteLabel = (labelId: string) => {
    setLabels(labels.filter((label) => label.id !== labelId));
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
    setTaskLoading(true);
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
          console.log(`📎 Uploading ${attachments.length} attachments...`);
          const uploadPromises = attachments.map(async (attachment, index) => {
            if (attachment.file) {
              console.log(`📎 Uploading attachment ${index + 1}:`, attachment.name);
              try {
                const uploadedAttachment = await uploadAttachment(newTask.id, attachment.file);
                console.log(`✅ Successfully uploaded:`, attachment.name);
                return uploadedAttachment;
              } catch (uploadError) {
                console.error(`❌ Failed to upload ${attachment.name}:`, uploadError);
                throw uploadError;
              }
            }
          });
          await Promise.all(uploadPromises);
          console.log("✅ All attachments uploaded successfully");
        } catch (attachmentError) {
          console.error("❌ Error uploading attachments:", attachmentError);
          // Show specific attachment error but don't fail the entire process
          setConfirmModal({
            isOpen: true,
            title: "Attachment Upload Failed",
            message: `Task was created successfully, but there was an error uploading attachments: ${attachmentError instanceof Error ? attachmentError.message : 'Unknown error'}`,
            type: "warning",
            onConfirm: () => {
              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
              router.push(`/${workspaceSlug}/tasks`);
            },
          });
          return; // Exit early on attachment error
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
          // Don't fail the entire process if label assignment fails
        }
      }

      setConfirmModal({
        isOpen: true,
        title: "Task Created",
        message: `"${formData.title}" has been created successfully.`,
        type: "info",
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          router.push(`/${workspaceSlug}/tasks`);
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
      setTaskLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="h-6 bg-muted rounded w-1/4 mb-4" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-10 bg-muted rounded"></div>
                      <div className="h-24 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="h-6 bg-muted rounded w-1/2 mb-4" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-10 bg-muted rounded"></div>
                      <div className="h-10 bg-muted rounded"></div>
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
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <HiExclamationTriangle className="w-5 h-5 text-destructive mt-0.5" />
                Workspace Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 text-destructive">
                The workspace "{workspaceSlug}" could not be found.
              </CardDescription>
              <div className="flex gap-3">
                <Link href="/workspaces" className="text-sm text-primary hover:underline">
                  Back to Workspaces
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={retryFetch}
                >
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
            <Link href={`/${workspaceSlug}`} className="hover:text-stone-700 dark:hover:text-stone-300">
              {workspace.name}
            </Link>
            <span>/</span>
            <span>New Task</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Create New Task</h1>
            <Link href={`/${workspaceSlug}/tasks`}>
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
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
                  <CardTitle>
                    <HiDocumentText className="w-5 h-5 text-amber-600 inline-block mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label >Task Title</Label>
                    <Input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="What needs to be done?"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe the task in detail..."
                    />
                  </div>

                  {/* Attachments Section */}
                  <div>
                    <Label>Attachments ({attachments.length})</Label>
                    <div>
                      {attachments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-3 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800">
                              <div className="flex items-center gap-2">
                                <HiPaperClip size={16} className="text-stone-400" />
                                <div>
                                  <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                                    {attachment.name}
                                  </p>
                                  <p className="text-xs text-stone-500 dark:text-stone-400">
                                    {attachment.size}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="danger"
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
                          className={`inline-flex items-center justify-center w-full p-4 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg text-xs cursor-pointer transition-colors ${
                            isUploading
                              ? "text-stone-400 cursor-not-allowed border-stone-200"
                              : "text-stone-500 dark:text-stone-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <HiPaperClip size={20} />
                            <span className="font-medium">
                              {isUploading ? "Uploading files..." : "Click to upload files"}
                            </span>
                            <span className="text-xs text-stone-400">
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
                <CardContent>
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/${workspaceSlug}/tasks`}>
                      <Button variant="secondary" size="md">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={!isFormValid() || isSubmitting || taskLoading}
                      size="md"
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
                <CardTitle className="flex items-center gap-2">
                  <HiCog size={16} className="text-amber-600" />
                  Task Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Project</Label>
                  <Select
                    name="projectId"
                    value={formData.projectId || ''}
                    // onChange={handleChange}
                  >
                    <option value="">Select a project</option>
                    {Array.isArray(project) && project.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label >Status</Label>
                  <Select
                    name="status"
                    value={formData.status}
                    // onChange={handleChange}
                    disabled={availableStatuses.length === 0}
                  >
                    {availableStatuses.length > 0 ? (
                      <>
                        <option value="">Select a status</option>
                        {availableStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="">Loading statuses...</option>
                    )}
                  </Select>
                  {availableStatuses.length === 0 && isAuthenticated() && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Failed to load statuses. Please refresh the page.
                    </p>
                  )}
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select
                    name="priority"
                    value={formData.priority}
                    // onChange={handleChange}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assignment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiUsers size={16} className="text-amber-600" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assignee</Label>
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

                <div>
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
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                    {!formData.projectId 
                      ? "Please select a project first, then assign at least one assignee or reporter"
                      : "Please assign at least one assignee or reporter"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Labels Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiTag size={16} className="text-amber-600" />
                  Labels ({labels.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {labels.map((label) => (
                    <Badge key={label.id}>
                      {label.name}
                      <Button type="button" size="sm" variant="secondary" className="ml-1 px-1 py-0" onClick={() => handleDeleteLabel(label.id)}>
                        <HiXMark size={12} />
                      </Button>
                    </Badge>
                  ))}
                </div>

                {/* Available labels from project */}
                {availableLabels.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-stone-500 dark:text-stone-400 mb-2">Available labels:</div>
                    <div className="flex flex-wrap gap-1">
                      {availableLabels
                        .filter(label => !labels.find(l => l.id === label.id))
                        .map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => setLabels([...labels, label])}
                            className="text-xs px-2 py-1 rounded border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
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
                      <Select
                        value={newLabelColor}
                        // onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewLabelColor(e.target.value)}
                        // className="flex-1"
                      >
                        {tagColors.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" disabled={!newLabelName.trim() || !formData.projectId} size="sm">
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsAddingLabel(false);
                          setNewLabelName("");
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
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 flex items-center gap-1"
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.type === "danger" ? "Delete" : "OK"}
        cancelText="Cancel"
      />
    </div>
  );
}