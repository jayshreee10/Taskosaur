"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { TagBadge } from '@/components/ui';
import TagManagerWrapper from "@/components/tasks/TagManagerWrapper";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import TaskComments from "./TaskComments";
import Subtasks from "./Subtasks";
import UserAvatar from "@/components/ui/avatars/UserAvatar";
import { useTask } from "@/contexts/task-context";
import { useProjectContext } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TokenManager } from '@/lib/api';
import {
  HiDocumentText,
  HiCog,
  HiUsers,
  HiTag,
  HiPaperClip,
  HiTrash,
  HiPencil,
  HiChevronDown,
  HiXMark,
  HiArrowLeft,
  HiPlus,
  HiExclamationTriangle
} from 'react-icons/hi2';

interface TaskDetailClientProps {
  task: any;
  workspaceSlug: string;
  projectSlug: string;
  taskId: string;
}

// Import shadcn UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Theme-consistent section header component
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="w-5 h-5 text-[var(--primary)]" />
    <h3 className="text-md font-semibold text-[var(--foreground)]">{title}</h3>
  </div>
);

export default function TaskDetailClient({
  task,
  workspaceSlug,
  projectSlug,
  taskId,
}: TaskDetailClientProps) {
  const { 
    updateTask, 
    deleteTask, 
    loading, 
    error, 
    getTaskAttachments, 
    uploadAttachment, 
    downloadAttachment, 
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
  const { getProjectMembersByWorkspace } = useProjectContext();
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();

  // Global fetch prevention hook
  const {
    shouldPreventFetch,
    markFetchStart,
    markFetchComplete,
    markFetchError,
    getCachedData
  } = useGlobalFetchPrevention();

  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(true);

  const [editTaskData, setEditTaskData] = useState({
    title: task.title,
    description: task.description,
    status: typeof task.status === "object" ? task.status?.name : task.status,
    priority: typeof task.priority === "object" ? task.priority?.name : task.priority,
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
  });

  const [assignee, setAssignee] = useState(task.assignee);
  const [reporter, setReporter] = useState(task.reporter);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isReporterDropdownOpen, setIsReporterDropdownOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const reporterRef = useRef<HTMLDivElement>(null);

  // Labels state (renamed from tags for consistency with API)
  const [labels, setLabels] = useState(task.labels || task.tags || []);
  const [availableLabels, setAvailableLabels] = useState<any[]>([]);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");

  // Available users from project members
  const availableUsers = projectMembers;

  // Label colors with hexadecimal values
  const labelColors = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Green", value: "#10B981" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Red", value: "#EF4444" },
    { name: "Gray", value: "#6B7280" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Pink", value: "#EC4899" },
  ];

  // Priority mapping for API
  const priorityApiMapping = {
    Low: "LOW",
    Medium: "MEDIUM",
    High: "HIGH",
    Highest: "HIGHEST",
  } as const;

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

  // Theme-consistent status and priority colors
  const getStatusConfig = (status: any) => {
    const statusName = typeof status === "object" ? status?.name : status;
    switch (statusName?.toLowerCase()) {
      case 'done':
      case 'completed':
        return 'bg-green-500/15 text-green-700 border border-green-200 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/30';
      case 'in progress':
      case 'in_progress':
        return 'bg-blue-500/15 text-blue-700 border border-blue-200 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/30';
      case 'review':
        return 'bg-purple-500/15 text-purple-700 border border-purple-200 dark:bg-purple-400/10 dark:text-purple-400 dark:border-purple-400/30';
      case 'todo':
      case 'to do':
        // Further improved: even darker text, higher contrast background for accessibility
        return 'bg-gray-300/40 text-gray-800 border  border-gray-400 dark:bg-gray-700/20 dark:text-gray-100 dark:border-gray-500/40';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]';
    }
  };

  const getPriorityConfig = (priority: any) => {
  const priorityName = typeof priority === "object" ? priority?.name : priority;
  switch (priorityName?.toLowerCase()) {
    case 'highest':
      return 'bg-red-500/15 text-red-700 border border-red-200 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/30';
    case 'high':
      return 'bg-orange-500/15 text-orange-700 border border-orange-200 dark:bg-orange-400/10 dark:text-orange-400 dark:border-orange-400/30';
    case 'medium':
      return 'bg-yellow-500/15 text-yellow-700 border border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/30';
    case 'low':
      return 'bg-green-500/15 text-green-700 border border-green-200 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/30';
    default:
      return 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]';
  }
  };

  // Fetch project members
  useEffect(() => {
    const workspaceId = task.workspace?.id || task.workspaceId;
    if (!workspaceId) return;

    const fetchKey = `project-members-${workspaceId}`;
    
    if (shouldPreventFetch(fetchKey)) {
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setProjectMembers(cachedData);
        setLoadingMembers(false);
        return;
      }
    }

    const fetchProjectMembers = async () => {
      setLoadingMembers(true);
      markFetchStart(fetchKey);
      
      try {
        const token = TokenManager.getAccessToken();
        if (token && workspaceId) {
          const members = await getProjectMembersByWorkspace(workspaceId);
          const membersData = members || [];
          setProjectMembers(membersData);
          markFetchComplete(fetchKey, membersData);
        }
      } catch (error) {
        console.error('Failed to fetch project members:', error);
        setProjectMembers([]);
        markFetchError(fetchKey);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchProjectMembers();
  }, [task.workspace?.id, task.workspaceId]);

  // Fetch project labels
  useEffect(() => {
    const projectId = task.projectId || task.project?.id;
    if (!projectId) return;

    const fetchKey = `project-labels-${projectId}`;
    
    if (shouldPreventFetch(fetchKey)) {
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setAvailableLabels(cachedData);
        return;
      }
    }

    const fetchProjectLabels = async () => {
      markFetchStart(fetchKey);
      
      try {
        const projectLabels = await getProjectLabels(projectId);
        const labelsData = projectLabels || [];
        setAvailableLabels(labelsData);
        markFetchComplete(fetchKey, labelsData);
        
        if (task.labels && task.labels.length > 0) {
          setLabels(task.labels);
        } else if (task.tags && task.tags.length > 0) {
          setLabels(task.tags);
        }
      } catch (error) {
        console.error('Failed to fetch project labels:', error);
        setAvailableLabels([]);
        markFetchError(fetchKey);
      }
    };

    fetchProjectLabels();
  }, [task.projectId, task.project?.id]);

  // Fetch task attachments
  useEffect(() => {
    if (!taskId) return;

    const fetchKey = `task-attachments-${taskId}`;
    
    if (shouldPreventFetch(fetchKey)) {
      const cachedData = getCachedData(fetchKey);
      if (cachedData) {
        setAttachments(cachedData);
        setLoadingAttachments(false);
        return;
      }
    }

    const fetchAttachments = async () => {
      setLoadingAttachments(true);
      markFetchStart(fetchKey);
      
      try {
        const taskAttachments = await getTaskAttachments(taskId);
        const attachmentsData = taskAttachments || [];
        setAttachments(attachmentsData);
        markFetchComplete(fetchKey, attachmentsData);
      } catch (error) {
        console.error('Failed to fetch task attachments:', error);
        setAttachments([]);
        markFetchError(fetchKey);
      } finally {
        setLoadingAttachments(false);
      }
    };

    fetchAttachments();
  }, [taskId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
      if (reporterRef.current && !reporterRef.current.contains(event.target as Node)) {
        setIsReporterDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
      ];

      const validFiles = Array.from(files).filter(file => {
        if (file.size > maxFileSize) {
          showConfirmModal(
            "File Too Large",
            `File "${file.name}" is too large. Maximum size is 10MB.`,
            () => {},
            "warning"
          );
          return false;
        }
        if (!allowedTypes.includes(file.type)) {
          showConfirmModal(
            "Invalid File Type",
            `File "${file.name}" has an unsupported format.`,
            () => {},
            "warning"
          );
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        setIsUploading(false);
        event.target.value = "";
        return;
      }

      const uploadPromises = validFiles.map(async (file) => {
        try {
          const uploadedAttachment = await uploadAttachment(taskId, file);
          return uploadedAttachment;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          showConfirmModal(
            "Upload Error",
            `Failed to upload "${file.name}". Please try again.`,
            () => {},
            "danger"
          );
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(Boolean);
      
      if (successfulUploads.length > 0) {
        const updatedAttachments = await getTaskAttachments(taskId);
        setAttachments(updatedAttachments || []);
        
        showConfirmModal(
          "Upload Successful",
          `${successfulUploads.length} file(s) uploaded successfully.`,
          () => {},
          "info"
        );
      }
    } catch (error) {
      console.error("Failed to upload files:", error);
      showConfirmModal(
        "Upload Error",
        "Failed to upload one or more files. Please try again.",
        () => {},
        "danger"
      );
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
    if (!currentUser?.id) {
      showConfirmModal(
        "Error",
        "You must be logged in to delete attachments.",
        () => {},
        "danger"
      );
      return;
    }

    showConfirmModal(
      "Delete Attachment",
      "Are you sure you want to delete this attachment? This action cannot be undone.",
      async () => {
        try {
          await deleteAttachment(attachmentId, currentUser.id);
          const updatedAttachments = await getTaskAttachments(taskId);
          setAttachments(updatedAttachments || []);
          
          showConfirmModal(
            "Success",
            "Attachment deleted successfully.",
            () => {},
            "info"
          );
        } catch (error) {
          console.error("Failed to delete attachment:", error);
          showConfirmModal(
            "Error",
            "Failed to delete attachment. Please try again.",
            () => {},
            "danger"
          );
        }
      },
      "danger"
    );
  };

  const handleEditTask = () => {
    setIsEditingTask(true);
  };

  const handleSaveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editTaskData.title.trim()) {
      showConfirmModal(
        "Validation Error",
        "Task title cannot be empty.",
        () => {},
        "warning"
      );
      return;
    }

    try {
      const updatedTask = await updateTask(taskId, {
        title: editTaskData.title.trim(),
        description: editTaskData.description.trim(),
        priority: priorityApiMapping[editTaskData.priority as keyof typeof priorityApiMapping] || "MEDIUM",
        startDate: task.startDate || new Date().toISOString(),
        dueDate: editTaskData.dueDate
          ? new Date(editTaskData.dueDate + "T23:59:59.999Z").toISOString()
          : undefined,
        remainingEstimate: task.remainingEstimate || 0,
        assigneeId: assignee?.id || task.assigneeId,
        reporterId: reporter?.id || task.reporterId,
        statusId: task.status?.id || task.statusId,
        projectId: task.projectId || task.project?.id,
      });

      Object.assign(task, updatedTask);
      setIsEditingTask(false);
      showConfirmModal(
        "Success",
        "Task updated successfully.",
        () => {},
        "info"
      );
    } catch (error) {
      console.error("Failed to update task:", error);
      showConfirmModal(
        "Error",
        "Failed to update the task. Please try again.",
        () => {},
        "danger"
      );
    }
  };

  const handleCancelTaskEdit = () => {
    setEditTaskData({
      title: task.title,
      description: task.description,
      status: typeof task.status === "object" ? task.status?.name : task.status,
      priority: typeof task.priority === "object" ? task.priority?.name : task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
    setIsEditingTask(false);
  };

  const handleTaskFieldChange = (field: string, value: string) => {
    setEditTaskData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteTask = () => {
    showConfirmModal(
      "Delete Task",
      "Are you sure you want to delete this task? This action cannot be undone and will permanently remove all associated data.",
      async () => {
        try {
          await deleteTask(taskId);
          window.location.href = `/${workspaceSlug}/${projectSlug}/tasks`;
        } catch (error) {
          console.error("Failed to delete task:", error);
          showConfirmModal(
            "Error",
            "Failed to delete the task. Please try again.",
            () => {},
            "danger"
          );
        }
      },
      "danger"
    );
  };

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: "danger" | "warning" | "info" = "info"
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const hideConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAssigneeChange = async (user: any) => {
    try {
      await updateTask(taskId, {
        assigneeId: user?.id || null,
      });
      setAssignee(user);
      setIsAssigneeDropdownOpen(false);
    } catch (error) {
      console.error("Failed to update assignee:", error);
      showConfirmModal(
        "Error",
        "Failed to update assignee. Please try again.",
        () => {},
        "danger"
      );
    }
  };

  const handleReporterChange = async (user: any) => {
    try {
      await updateTask(taskId, {
        reporterId: user.id,
      });
      setReporter(user);
      setIsReporterDropdownOpen(false);
    } catch (error) {
      console.error("Failed to update reporter:", error);
      showConfirmModal(
        "Error",
        "Failed to update reporter. Please try again.",
        () => {},
        "danger"
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Label management functions
  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    try {
      const projectId = task.projectId || task.project?.id;
      if (!projectId) {
        showConfirmModal(
          "Error",
          "Project ID not found. Cannot create label.",
          () => {},
          "danger"
        );
        return;
      }

      const newLabel = await createLabel({
        name: newLabelName.trim(),
        color: newLabelColor,
        projectId: projectId
      });
      
      setAvailableLabels([...availableLabels, newLabel]);
      
      await assignLabelToTask({
        taskId: taskId,
        labelId: newLabel.id
      });
      
      setLabels([...labels, newLabel]);
      setIsAddingLabel(false);
      setNewLabelName("");
      setNewLabelColor("#3B82F6");
      
      showConfirmModal(
        "Success",
        "Label created and assigned to task successfully.",
        () => {},
        "info"
      );
    } catch (error) {
      console.error("Failed to add label:", error);
      showConfirmModal(
        "Error",
        error instanceof Error ? error.message : "Failed to add label. Please try again.",
        () => {},
        "danger"
      );
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    showConfirmModal(
      "Remove Label",
      "Are you sure you want to remove this label from the task?",
      async () => {
        try {
          await removeLabelFromTask(taskId, labelId);
          setLabels(labels.filter((label: any) => label.id !== labelId));
          
          showConfirmModal(
            "Success",
            "Label removed from task successfully.",
            () => {},
            "info"
          );
        } catch (error) {
          console.error("Failed to remove label:", error);
          showConfirmModal(
            "Error",
            "Failed to remove label. Please try again.",
            () => {},
            "danger"
          );
        }
      },
      "danger"
    );
  };

  const handleAssignExistingLabel = async (label: any) => {
    try {
      await assignLabelToTask({
        taskId: taskId,
        labelId: label.id
      });
      
      setLabels([...labels, label]);
      
      showConfirmModal(
        "Success",
        "Label assigned to task successfully.",
        () => {},
        "info"
      );
    } catch (error) {
      console.error("Failed to assign label:", error);
      showConfirmModal(
        "Error",
        "Failed to assign label. Please try again.",
        () => {},
        "danger"
      );
    }
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const blob = await downloadAttachment(attachmentId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download attachment:", error);
      showConfirmModal(
        "Error",
        "Failed to download attachment. Please try again.",
        () => {},
        "danger"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header - Following your breadcrumb pattern */}
        <div className="mb-6">
          {/* <div className="flex items-center gap-2 text-sm mb-4">
            <Link href={`/${workspaceSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              {task?.workspace?.name || task?.project?.workspace?.name || 'Workspace'}
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link href={`/${workspaceSlug}/${projectSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              {task?.project?.name || 'Project'}
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link href={`/${workspaceSlug}/${projectSlug}/tasks`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              Tasks
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-[var(--foreground)] font-medium">Task {taskId}</span>
          </div> */}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {task.title}
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-[10px] font-semibold border-none py-0.5 rounded-full capitalize text-center tracking-wide shadow-sm ${getStatusConfig(task.status)}`}
                >
                  {typeof task.status === "object" ? task.status?.name || "Unknown" : task.status}
                </Badge>
                <Badge
                  className={`text-[10px] font-semibold border-none py-0.5 rounded-full capitalize text-center tracking-wide shadow-sm ${getPriorityConfig(task.priority)}`}
                >
                  {typeof task.priority === "object" ? task.priority?.name || "Unknown" : task.priority} Priority
                </Badge>
              </div>
            </div>
            <Link href={`/${workspaceSlug}/${projectSlug}/tasks`}>
              <Button 
                variant="outline" 
                size="sm" 
                className="relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2 text-sm"
              >
                <HiArrowLeft className="w-4 h-4" />
                Back to Tasks
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details Section */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardContent className="p-6">
                <SectionHeader icon={HiDocumentText} title="Task Details" />
                {isEditingTask ? (
                  <form onSubmit={handleSaveTaskEdit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[var(--foreground)] font-medium">Description</Label>
                      <Textarea
                        value={editTaskData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTaskFieldChange("description", e.target.value)}
                        rows={4}
                        placeholder="Task description"
                        className="border-input bg-background text-[var(--foreground)] resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[var(--foreground)] font-medium">Status</Label>
                        <Select value={editTaskData.status} onValueChange={(value) => handleTaskFieldChange("status", value)}>
                          <SelectTrigger className="h-9 w-[120px] border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                            <SelectValue placeholder="Select status">
                              {editTaskData.status || 'Select status'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="border-none bg-[var(--card)]">
                            <SelectItem value="Todo">Todo</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[var(--foreground)] font-medium">Priority</Label>
                        <Select value={editTaskData.priority} onValueChange={(value) => handleTaskFieldChange("priority", value)}>
                          <SelectTrigger className="h-9 w-[120px] border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                            <SelectValue placeholder="Select priority">
                              {editTaskData.priority || 'Select priority'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="border-none bg-[var(--card)]">
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Highest">Highest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[var(--foreground)] font-medium">Due Date</Label>
                        <Input
                          type="date"
                          value={editTaskData.dueDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaskFieldChange("dueDate", e.target.value)}
                          className="h-9 border-input bg-background text-[var(--foreground)]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelTaskEdit}
                        disabled={loading}
                        className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="h-9 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-[var(--muted-foreground)] leading-relaxed">
                      {task.description || "No description provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subtasks Section */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardContent className="p-6">
                <Subtasks
                  taskId={taskId}
                  projectId={task.projectId || task.project?.id}
                  onSubtaskAdded={() => {}}
                  onSubtaskUpdated={() => {}}
                  onSubtaskDeleted={() => {}}
                  showConfirmModal={showConfirmModal}
                />
              </CardContent>
            </Card>

            {/* Attachments Section */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardContent className="p-6">
                <SectionHeader icon={HiPaperClip} title={`Attachments (${attachments.length})`} />
                <div>
                  {loadingAttachments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading attachments...</span>
                    </div>
                  ) : attachments.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      {attachments.map((attachment: any) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30 hover:bg-[var(--accent)] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <HiPaperClip className="w-4 h-4 text-[var(--muted-foreground)]" />
                            <div>
                              <p className="text-sm font-medium text-[var(--foreground)]">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {formatFileSize(attachment.fileSize)} • {formatDate(attachment.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                              className="h-8 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                            >
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="h-8 border-none bg-[var(--destructive)]/5 hover:bg-[var(--destructive)]/10 text-[var(--destructive)]"
                            >
                              <HiTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-col space-y-3">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`inline-flex items-center justify-center w-full p-6 border-2 border-dashed border-[var(--border)] rounded-lg text-sm cursor-pointer transition-colors ${
                        isUploading
                          ? "text-[var(--muted-foreground)] cursor-not-allowed border-[var(--muted)]"
                          : "text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <HiPaperClip className="w-6 h-6" />
                        <span className="font-medium">
                          {isUploading ? "Uploading files..." : "Click to upload files"}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          PNG, JPG, PDF up to 10MB
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardContent className="p-6">
                <TaskComments
                  taskId={taskId}
                  onCommentAdded={() => {}}
                  onCommentUpdated={() => {}}
                  onCommentDeleted={() => {}}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Assignment Section */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardContent className="p-6">
                <SectionHeader icon={HiUsers} title="Assignment" />
                <div className="space-y-4">
                  <div className="relative" ref={assigneeRef}>
                    <Label className="text-[var(--foreground)] font-medium mb-2 block">Assignee</Label>
                    {assignee ? (
                      <button
                        type="button"
                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        className="w-full flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={{
                              firstName: assignee.firstName || '',
                              lastName: assignee.lastName || '',
                              avatar: assignee.avatar,
                            }}
                            size="sm"
                          />
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {assignee.username || `${assignee.firstName} ${assignee.lastName}`}
                          </span>
                        </div>
                        <HiChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        className="w-full p-3 border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors text-left text-sm"
                      >
                        Select assignee...
                      </button>
                    )}

                    {isAssigneeDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-[var(--card)] shadow-lg rounded-lg border border-[var(--border)] max-h-48 overflow-y-auto">
                        {assignee && (
                          <button
                            type="button"
                            onClick={() => handleAssigneeChange(null)}
                            className="w-full px-3 py-2 text-left text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 flex items-center gap-2"
                          >
                            <HiXMark className="w-4 h-4" />
                            Unassign
                          </button>
                        )}
                        {availableUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleAssigneeChange(user)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent)] flex items-center gap-3 ${
                              assignee?.id === user.id ? "bg-[var(--primary)]/10" : ""
                            }`}
                          >
                            <UserAvatar
                              user={{
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                avatar: user.avatar,
                              }}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-[var(--foreground)]">
                                {user.username || `${user.firstName} ${user.lastName}`}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {user.role || "Member"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={reporterRef}>
                    <Label className="text-[var(--foreground)] font-medium mb-2 block">Reporter</Label>
                    {reporter ? (
                      <button
                        type="button"
                        onClick={() => setIsReporterDropdownOpen(!isReporterDropdownOpen)}
                        className="w-full flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={{
                              firstName: reporter.firstName || '',
                              lastName: reporter.lastName || '',
                              avatar: reporter.avatar,
                            }}
                            size="sm"
                          />
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {reporter.username || `${reporter.firstName} ${reporter.lastName}`}
                          </span>
                        </div>
                        <HiChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsReporterDropdownOpen(!isReporterDropdownOpen)}
                        className="w-full p-3 border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors text-left text-sm"
                      >
                        Select reporter...
                      </button>
                    )}

                    {isReporterDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-[var(--card)] shadow-lg rounded-lg border border-[var(--border)] max-h-48 overflow-y-auto">
                        {reporter && (
                          <button
                            type="button"
                            onClick={() => handleReporterChange(null)}
                            className="w-full px-3 py-2 text-left text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 flex items-center gap-2"
                          >
                            <HiXMark className="w-4 h-4" />
                            Remove reporter
                          </button>
                        )}
                        {availableUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleReporterChange(user)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent)] flex items-center gap-3 ${
                              reporter?.id === user.id ? "bg-[var(--primary)]/10" : ""
                            }`}
                          >
                            <UserAvatar
                              user={{
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                avatar: user.avatar,
                              }}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-[var(--foreground)]">
                                {user.username || `${user.firstName} ${user.lastName}`}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {user.role || "Member"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!assignee && !reporter && (
                    <Alert className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]">
                      <HiExclamationTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Please assign at least one assignee or reporter
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Section */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardContent className="p-6">
                <SectionHeader icon={HiCog} title="Actions" />
                <div className="space-y-3">
                  <Button
                    onClick={handleEditTask}
                    variant="outline"
                    className="w-full h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] flex items-center gap-2"
                  >
                    <HiPencil className="w-4 h-4" />
                    Edit Task
                  </Button>
                  <Button
                    onClick={handleDeleteTask}
                    variant="outline"
                    className="w-full h-9 border-none bg-[var(--destructive)]/5 hover:bg-[var(--destructive)]/10 text-[var(--destructive)] flex items-center gap-2"
                  >
                    <HiTrash className="w-4 h-4" />
                    Delete Task
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Labels Section */}
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardContent className="p-6">
                <SectionHeader icon={HiTag} title={`Labels (${labels.length})`} />
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {labels.map((label: any) => (
                      <Badge
                        key={label.id}
                        className={
                          `text-[10px] font-semibold border-none py-0.5 rounded-full capitalize text-center tracking-wide shadow-sm ` +
                          (label.color
                            ? `bg-[${label.color}]/10 text-[${label.color}]`
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)]')
                        }
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>

                  {/* Available labels from project */}
                  {availableLabels.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-[var(--muted-foreground)] mb-2">Available labels:</div>
                      <div className="flex flex-wrap gap-2">
                        {availableLabels
                          .filter(label => !labels.find((l: any) => l.id === label.id))
                          .map((label: any) => (
                            <button
                              key={label.id}
                              type="button"
                              onClick={() => handleAssignExistingLabel(label)}
                              className="text-sm px-3 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
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
                        className="h-9 border-input bg-background text-[var(--foreground)]"
                      />
                      <div className="flex items-center gap-2">
                        <Select value={newLabelColor} onValueChange={setNewLabelColor}>
                          <SelectTrigger className="flex-1 h-9 border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent className="border-none bg-[var(--card)]">
                            {labelColors.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                {color.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="submit" 
                          disabled={!newLabelName.trim()} 
                          size="sm"
                          className="h-9 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]"
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
                          className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingLabel(true)}
                      className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 transition-colors"
                    >
                      <HiPlus className="w-4 h-4" />
                      Add new label
                    </button>
                  )}
                </div>
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