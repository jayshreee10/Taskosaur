"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { TagBadge } from '@/components/ui';
import TagManagerWrapper from "@/components/tasks/TagManagerWrapper";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import TaskComments from "./TaskComments";
import Subtasks from "./Subtasks";
import { useTask } from "@/contexts/task-context";
import { useProjectContext } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import {
  HiDocumentText,
  HiCog,
  HiUsers,
  HiTag,
  HiPaperClip,
  // HiCalendar,
  HiTrash,
  HiPencil,
  // HiLink,
  HiChevronDown,
  HiXMark,
  HiArrowLeft,
  HiPlus
} from 'react-icons/hi2';

interface TaskDetailClientProps {
  task: any;
  workspaceSlug: string;
  projectSlug: string;
  taskId: string;
}

// Import shadcn UI components
// Local UI helpers
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="mb-4 flex items-center gap-2">
    <Icon size={16} className="text-amber-600" />
    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</span>
  </div>
);

const UserAvatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  return (
    <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-medium">
      {initials}
    </div>
  );
};
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
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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

  const statusColors = {
    Todo: "default" as const,
    "To Do": "default" as const,
    "In Progress": "secondary" as const,
    Review: "secondary" as const,
    Done: "secondary" as const,
  };

  const priorityColors = {
    LOW: "default" as const,
    Low: "default" as const,
    MEDIUM: "secondary" as const,
    Medium: "secondary" as const,
    HIGH: "secondary" as const,
    High: "secondary" as const,
    HIGHEST: "secondary" as const,
    Highest: "secondary" as const,
  };

  const getStatusVariant = (status: any) => {
    const statusName = typeof status === "object" ? status?.name : status;
    return statusColors[statusName as keyof typeof statusColors] || "default";
  };

  const getPriorityVariant = (priority: any) => {
    const priorityName = typeof priority === "object" ? priority?.name : priority;
    return priorityColors[priorityName as keyof typeof priorityColors] || "default";
  };

  // Fetch project members
  useEffect(() => {
    const workspaceId = task.workspace?.id || task.workspaceId;
    if (!workspaceId) return;

    const fetchKey = `project-members-${workspaceId}`;
    
    // Check if we should prevent this fetch
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
        const token = localStorage.getItem("token");
        if (token && workspaceId) {

          const members = await getProjectMembersByWorkspace(workspaceId, token);
          const membersData = members || [];
          setProjectMembers(membersData);
          
          // Cache the successful result
          markFetchComplete(fetchKey, membersData);

        }
      } catch (error) {
        console.error('❌ [TASK_DETAIL_CLIENT] Failed to fetch project members:', error);
        setProjectMembers([]);
        markFetchError(fetchKey);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchProjectMembers();
  }, [task.workspace?.id, task.workspaceId]); // Only depend on workspace ID

  // Fetch project labels
  useEffect(() => {
    const projectId = task.projectId || task.project?.id;
    if (!projectId) return;

    const fetchKey = `project-labels-${projectId}`;
    
    // Check if we should prevent this fetch
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
        
        // Cache the successful result
        markFetchComplete(fetchKey, labelsData);

        
        // Use the labels from the task prop instead of fetching separately
        // The task should already contain its labels from the server
        if (task.labels && task.labels.length > 0) {
          setLabels(task.labels);
        } else if (task.tags && task.tags.length > 0) {
          // Fallback to tags if labels property doesn't exist
          setLabels(task.tags);
        }
      } catch (error) {
        console.error('❌ [TASK_DETAIL_CLIENT] Failed to fetch project labels:', error);
        setAvailableLabels([]);
        markFetchError(fetchKey);
      }
    };

    fetchProjectLabels();
  }, [task.projectId, task.project?.id]); // Only depend on project ID

  // Fetch task attachments
  useEffect(() => {
    if (!taskId) return;

    const fetchKey = `task-attachments-${taskId}`;
    
    // Check if we should prevent this fetch
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
        
        // Cache the successful result
        markFetchComplete(fetchKey, attachmentsData);

      } catch (error) {
        console.error('❌ [TASK_DETAIL_CLIENT] Failed to fetch task attachments:', error);
        setAttachments([]);
        markFetchError(fetchKey);
      } finally {
        setLoadingAttachments(false);
      }
    };

    fetchAttachments();
  }, [taskId]); // Only depend on task ID

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

  // Refresh functions for real-time updates
  const refreshAttachments = async () => {
    try {
      const taskAttachments = await getTaskAttachments(taskId);
      setAttachments(taskAttachments || []);
    } catch (error) {
      console.error("Failed to refresh attachments:", error);
    }
  };

  const refreshComments = () => {
    // This will be called from TaskComments component
    // when a comment is added, updated, or deleted
  };

  const refreshSubtasks = () => {
    // This will be called from Subtasks component
    // when a subtask is added, updated, or deleted
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // File validation
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
        // Refresh attachments list
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
          
          // Refresh attachments list
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

      // Create the label first
      const newLabel = await createLabel({
        name: newLabelName.trim(),
        color: newLabelColor,
        projectId: projectId
      });
      
      // Add to available labels
      setAvailableLabels([...availableLabels, newLabel]);
      
      // Assign to current task
      await assignLabelToTask({
        taskId: taskId,
        labelId: newLabel.id
      });
      
      // Add to task labels
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
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
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
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
            <Link href={`/${workspaceSlug}`} className="hover:text-stone-700 dark:hover:text-stone-300">
              {task.workspace.name}
            </Link>
            <span>/</span>
            <Link href={`/${workspaceSlug}/${projectSlug}`} className="hover:text-stone-700 dark:hover:text-stone-300">
              {task.project.name}
            </Link>
            <span>/</span>
            <Link href={`/${workspaceSlug}/${projectSlug}/tasks`} className="hover:text-stone-700 dark:hover:text-stone-300">
              Tasks
            </Link>
            <span>/</span>
            <span>Task {taskId}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {task.title}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(task.status)}>
                  {typeof task.status === "object" ? task.status?.name || "Unknown" : task.status}
                </Badge>
                <Badge variant={getPriorityVariant(task.priority)}>
                  {typeof task.priority === "object" ? task.priority?.name || "Unknown" : task.priority} Priority
                </Badge>
              </div>
            </div>
            <Link href={`/${workspaceSlug}/${projectSlug}/tasks`}>
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <HiArrowLeft size={14} />
                Back to Tasks
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details Section */}
            <Card>
              <SectionHeader icon={HiDocumentText} title="Task Details" />
              {isEditingTask ? (
                <form onSubmit={handleSaveTaskEdit} className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      type="text"
                      value={editTaskData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaskFieldChange("title", e.target.value)}
                      placeholder="Task title"
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editTaskData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTaskFieldChange("description", e.target.value)}
                      rows={4}
                      placeholder="Task description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={editTaskData.status}
                        // onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTaskFieldChange("status", e.target.value)}
                      >
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Done">Done</option>
                      </Select>
                    </div>

                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={editTaskData.priority}
                        // onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTaskFieldChange("priority", e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Highest">Highest</option>
                      </Select>
                    </div>

                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={editTaskData.dueDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaskFieldChange("dueDate", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancelTaskEdit}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-stone-700 dark:text-stone-300">
                    {task.description || "No description provided."}
                  </p>
                </div>
              )}
            </Card>

            {/* Subtasks Section */}
            <Card>
              <Subtasks
                taskId={taskId}
                projectId={task.projectId || task.project?.id}
                onSubtaskAdded={() => {}}
                onSubtaskUpdated={() => {}}
                onSubtaskDeleted={() => {}}
                showConfirmModal={showConfirmModal}
              />
            </Card>

            {/* Attachments Section */}
            <Card>
              <SectionHeader icon={HiPaperClip} title={`Attachments (${attachments.length})`} />
              <div>
                {loadingAttachments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                    <span className="ml-2 text-sm text-stone-500 dark:text-stone-400">Loading attachments...</span>
                  </div>
                ) : attachments.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {attachments.map((attachment: any) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800"
                      >
                        <div className="flex items-center gap-2">
                          <HiPaperClip size={16} className="text-stone-400" />
                          <div>
                            <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                          >
                            Download
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <HiTrash size={12} />
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
                        PNG, JPG, PDF up to 10MB
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </Card>

            {/* Comments Section */}
            <Card>
              <TaskComments
                taskId={taskId}
                onCommentAdded={() => {}}
                onCommentUpdated={() => {}}
                onCommentDeleted={() => {}}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Assignment Section */}
            <Card>
              <SectionHeader icon={HiUsers} title="Assignment" />
              <div className="space-y-4">
                <div className="relative" ref={assigneeRef}>
                  <Label>Assignee</Label>
                  {assignee ? (
                    <button
                      type="button"
                      onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                      className="w-full flex items-center justify-between p-2 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar name={assignee.firstName ? assignee.firstName + " " + (assignee.lastName || "") : "U"} />
                        <span className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                          {assignee.username || assignee.firstName + " " + assignee.lastName}
                        </span>
                      </div>
                      <HiChevronDown size={16} className="text-stone-400" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                      className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-500 dark:text-stone-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left text-xs"
                    >
                      Select assignee...
                    </button>
                  )}

                  {isAssigneeDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-stone-800 shadow-lg rounded-lg border border-stone-200 dark:border-stone-700 max-h-48 overflow-y-auto">
                      {assignee && (
                        <button
                          type="button"
                          onClick={() => handleAssigneeChange(null)}
                          className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <HiXMark size={14} />
                          Unassign
                        </button>
                      )}
                      {availableUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleAssigneeChange(user)}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2 ${
                            assignee?.id === user.id ? "bg-amber-50 dark:bg-amber-900/20" : ""
                          }`}
                        >
                          <UserAvatar name={user.firstName ? user.firstName + " " + (user.lastName || "") : "U"} />
                          <div className="min-w-0">
                            <div className="font-medium text-stone-900 dark:text-stone-100 truncate">
                              {user.username || user.firstName + " " + user.lastName}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-stone-400">
                              {user.role || "Member"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={reporterRef}>
                  <Label>Reporter</Label>
                  {reporter ? (
                    <button
                      type="button"
                      onClick={() => setIsReporterDropdownOpen(!isReporterDropdownOpen)}
                      className="w-full flex items-center justify-between p-2 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar name={reporter.firstName ? reporter.firstName + " " + (reporter.lastName || "") : "U"} />
                        <span className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                          {reporter.username || reporter.firstName + " " + reporter.lastName}
                        </span>
                      </div>
                      <HiChevronDown size={16} className="text-stone-400" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsReporterDropdownOpen(!isReporterDropdownOpen)}
                      className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-500 dark:text-stone-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left text-xs"
                    >
                      Select reporter...
                    </button>
                  )}

                  {isReporterDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-stone-800 shadow-lg rounded-lg border border-stone-200 dark:border-stone-700 max-h-48 overflow-y-auto">
                      {reporter && (
                        <button
                          type="button"
                          onClick={() => handleReporterChange(null)}
                          className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <HiXMark size={14} />
                          Remove reporter
                        </button>
                      )}
                      {availableUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleReporterChange(user)}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2 ${
                            reporter?.id === user.id ? "bg-amber-50 dark:bg-amber-900/20" : ""
                          }`}
                        >
                          <UserAvatar name={user.firstName ? user.firstName + " " + (user.lastName || "") : "U"} />
                          <div className="min-w-0">
                            <div className="font-medium text-stone-900 dark:text-stone-100 truncate">
                              {user.username || user.firstName + " " + user.lastName}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-stone-400">
                              {user.role || "Member"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!assignee && !reporter && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                    Please assign at least one assignee or reporter
                  </div>
                )}
              </div>
            </Card>

            {/* Actions Section */}
            <Card>
              <SectionHeader icon={HiCog} title="Actions" />
              <div className="space-y-3">
                <Button
                  onClick={handleEditTask}
                  variant="secondary"
                  className="w-full flex items-center gap-2"
                >
                  <HiPencil size={14} />
                  Edit Task
                </Button>
                <Button
                  onClick={handleDeleteTask}
                  variant="danger"
                  className="w-full flex items-center gap-2"
                >
                  <HiTrash size={14} />
                  Delete Task
                </Button>
              </div>
            </Card>

            {/* Labels Section */}
            <Card>
              <SectionHeader icon={HiTag} title={`Labels (${labels.length})`} />
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {labels.map((label: any) => (
                    <Badge key={label.id}>
                      {label.name}
                    </Badge>
                  ))}
                </div>

                {/* Available labels from project */}
                {availableLabels.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-stone-500 dark:text-stone-400 mb-2">Available labels:</div>
                    <div className="flex flex-wrap gap-1">
                      {availableLabels
                        .filter(label => !labels.find((l: any) => l.id === label.id))
                        .map((label: any) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => handleAssignExistingLabel(label)}
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
                        {labelColors.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.name}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" disabled={!newLabelName.trim()} size="sm">
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
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
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 flex items-center gap-1"
                  >
                    <HiPlus size={12} />
                    Add new label
                  </button>
                )}
              </div>
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