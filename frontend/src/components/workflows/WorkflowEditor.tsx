"use client";

import React, { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Clock,
  Play,
  CheckCircle,
  ArrowRight,
  GripVertical,
  RotateCcw,
  Save,
  Edit3,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";

// Import your existing types
import { Workflow } from "@/utils/api/organizationApi";
import { TaskStatus } from "@/utils/api/taskStatusApi";
import { StatusCategory } from "@/types/workflow";

interface WorkflowEditorProps {
  workflow: Workflow;
  onUpdate: (workflow: any) => void;
  isUpdating?: boolean;
}

interface WorkflowDetailsFormData {
  name: string;
  description: string;
  isDefault: boolean;
}

export default function WorkflowEditor({
  workflow,
  onUpdate,
  isUpdating = false,
}: WorkflowEditorProps) {
  const { updateWorkflow, updateTaskStatusPositions } = useOrganization();

  // State for drag and drop
  const [draggedStatus, setDraggedStatus] = useState<TaskStatus | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // State for workflow details editing
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsFormData, setDetailsFormData] =
    useState<WorkflowDetailsFormData>({
      name: workflow.name,
      description: workflow.description || "",
      isDefault: workflow.isDefault,
    });
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>(
    {}
  );
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // State for status reordering
  const [hasStatusChanges, setHasStatusChanges] = useState(false);
  const [isSavingStatuses, setIsSavingStatuses] = useState(false);

  // Update form data when workflow changes
  useEffect(() => {
    setDetailsFormData({
      name: workflow.name,
      description: workflow.description || "",
      isDefault: workflow.isDefault,
    });
  }, [workflow]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, status: TaskStatus) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedStatus(status);
  };

  const handleDragEnd = () => {
    setDraggedStatus(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Fix the handleDrop function
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (!draggedStatus) return;

    const currentIndex = workflow.statuses
      ? workflow.statuses.findIndex((s) => s.id === draggedStatus.id)
      : 0;
    if (currentIndex === targetIndex) return;

    const newStatuses = [...(workflow.statuses ?? [])];
    const [movedStatus] = newStatuses.splice(currentIndex, 1);
    newStatuses.splice(targetIndex, 0, movedStatus);

    // ✅ Fix: Update position values consistently (use position, not order)
    const updatedStatuses = newStatuses.map((status, index) => ({
      ...status,
      position: index, // ✅ Use position and 0-based indexing
      order: index + 1, // Keep order as well for backward compatibility
    }));

    const updatedWorkflow = {
      ...workflow,
      statuses: updatedStatuses,
    };

    onUpdate(updatedWorkflow);
    setHasStatusChanges(true);
    setDragOverIndex(null);

    // Remove alert for better UX
    console.log(
      `Status Reordered: Moved "${draggedStatus.name}" to position ${targetIndex}`
    );
  };

  // Fix the handleResetToDefault function
  const handleResetToDefault = () => {
    if (
      !confirm(
        "Are you sure you want to reset the workflow to default order? This will undo any custom ordering."
      )
    ) {
      return;
    }

    // ✅ Fix: Use category field correctly
    const categoryOrder: Record<StatusCategory, number> = {
      TODO: 1,
      IN_PROGRESS: 2,
      DONE: 3,
    };

    const resetStatuses = [...(workflow.statuses ?? [])]
      .sort((a, b) => {
        // ✅ Fix: Use category field, not name field
        const aPriority = categoryOrder[a.category] ?? 999;
        const bPriority = categoryOrder[b.category] ?? 999;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        return (a.name ?? "").localeCompare(b.name ?? "");
      })
      .map((status, index) => ({
        ...status,
        position: index, // ✅ Use position with 0-based indexing
        order: index + 1, // Keep order for backward compatibility
      }));

    const updatedWorkflow = {
      ...workflow,
      statuses: resetStatuses,
    };

    onUpdate(updatedWorkflow);
    setHasStatusChanges(true);

    console.log("Workflow Reset: Workflow has been reset to default order");
  };

  // Fix the handleSaveStatusOrder function
  const handleSaveStatusOrder = async () => {
    try {
      setIsSavingStatuses(true);

      // ✅ Fix: Use consistent position field
      const statusUpdates = sortedStatuses.map((status, index) => ({
        id: status.id,
        position: index, // ✅ Use current sorted index as position
      }));

      console.log("💾 Saving status order changes:", statusUpdates);

      const updatedStatuses = await updateTaskStatusPositions(statusUpdates);

      const updatedWorkflow = {
        ...workflow,
        statuses: updatedStatuses,
      };

      onUpdate(updatedWorkflow);
      setHasStatusChanges(false);

      console.log("Status order saved successfully");
    } catch (error) {
      console.error("❌ Failed to save status order:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save status order"
      );
    } finally {
      setIsSavingStatuses(false);
    }
  };

  // ✅ Fix: Ensure consistent sorting

  // Workflow details handlers
  const validateDetailsForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!detailsFormData.name.trim()) {
      errors.name = "Workflow name is required";
    } else if (detailsFormData.name.trim().length < 3) {
      errors.name = "Workflow name must be at least 3 characters";
    } else if (detailsFormData.name.trim().length > 50) {
      errors.name = "Workflow name must be less than 50 characters";
    }

    if (
      detailsFormData.description &&
      detailsFormData.description.length > 200
    ) {
      errors.description = "Description must be less than 200 characters";
    }

    setDetailsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDetails = async () => {
    if (!validateDetailsForm()) {
      return;
    }

    try {
      setIsSavingDetails(true);

      const updateData = {
        name: detailsFormData.name.trim(),
        description: detailsFormData.description.trim() || undefined,
        isDefault: detailsFormData.isDefault,
      };

      console.log("🔄 Updating workflow details:", updateData);

      const updatedWorkflow = await updateWorkflow(workflow.id, updateData);

      // Update local state
      onUpdate(updatedWorkflow);
      setIsEditingDetails(false);

      alert("Workflow details updated successfully");
      console.log("Workflow details updated successfully");
    } catch (error) {
      console.error("❌ Failed to update workflow details:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update workflow details"
      );
      console.error("Failed to update workflow details:", error);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleCancelDetailsEdit = () => {
    setDetailsFormData({
      name: workflow.name,
      description: workflow.description || "",
      isDefault: workflow.isDefault,
    });
    setDetailsErrors({});
    setIsEditingDetails(false);
  };

  // Helper functions
  const getCategoryColor = (category: StatusCategory) => {
    switch (category) {
      case "TODO":
        return "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case "DONE":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      default:
        return "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]";
    }
  };

  const getStatusIcon = (category: StatusCategory) => {
    switch (category) {
      case "TODO":
        return <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />;
      case "IN_PROGRESS":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "DONE":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />;
    }
  };

  const sortedStatuses = Array.isArray(workflow.statuses)
    ? [...workflow.statuses].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Workflow Details Section */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold text-[var(--foreground)]">
            Workflow Details
          </CardTitle>
          {!isEditingDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingDetails(true)}
              disabled={isUpdating}
              className="flex items-center gap-2 bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <Edit3 className="w-4 h-4" />
              Edit Details
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingDetails ? (
            // Edit Form
            <div className="space-y-4">
              {/* Workflow Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[var(--foreground)]">
                  Workflow Name *
                </Label>
                <Input
                  id="name"
                  value={detailsFormData.name}
                  onChange={(e) =>
                    setDetailsFormData({
                      ...detailsFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter workflow name"
                  disabled={isSavingDetails}
                  className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
                />
                {detailsErrors.name && (
                  <p className="text-sm text-[var(--destructive)]">
                    {detailsErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-[var(--foreground)]"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={detailsFormData.description}
                  onChange={(e) =>
                    setDetailsFormData({
                      ...detailsFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter workflow description"
                  disabled={isSavingDetails}
                  className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] min-h-[80px] resize-none"
                  rows={3}
                />
                {detailsErrors.description && (
                  <p className="text-sm text-[var(--destructive)]">
                    {detailsErrors.description}
                  </p>
                )}
              </div>

              {/* Default Workflow */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={detailsFormData.isDefault}
                  onCheckedChange={(checked) =>
                    setDetailsFormData({
                      ...detailsFormData,
                      isDefault: checked as boolean,
                    })
                  }
                  disabled={isSavingDetails}
                  className="border-[var(--border)]"
                />
                <Label htmlFor="isDefault" className="text-[var(--foreground)]">
                  Set as default workflow
                </Label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSaveDetails}
                  disabled={isSavingDetails}
                  className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
                >
                  {isSavingDetails ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Details
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelDetailsEdit}
                  disabled={isSavingDetails}
                  className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-medium text-[var(--foreground)]">
                    {workflow.name}
                  </h3>
                  {workflow.isDefault && (
                    <Badge
                      variant="default"
                      className="bg-[var(--primary)] text-[var(--primary-foreground)]"
                    >
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-[var(--muted-foreground)]">
                  {workflow.description || "No description provided"}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                <span>
                  Created: {new Date(workflow.createdAt).toLocaleDateString()}
                </span>
                <span>
                  Updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                </span>
                <span>
                  Statuses: {workflow.statuses ? workflow.statuses.length : 0}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Editor Header */}
      <Card className="bg-[var(--card)] border-[var(--border)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Visual Status Flow Editor
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Drag and drop statuses to reorder them. The order defines the
              typical flow of tasks through your workflow.
            </p>

            {/* Legend */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[var(--muted-foreground)] rounded-full"></div>
                <span className="text-[var(--muted-foreground)]">To Do</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-[var(--muted-foreground)]">
                  In Progress
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-[var(--muted-foreground)]">Done</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasStatusChanges && (
              <Button
                onClick={handleSaveStatusOrder}
                disabled={isSavingStatuses || isUpdating}
                className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
              >
                {isSavingStatuses ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Order
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              disabled={
                isUpdating ||
                isSavingStatuses ||
                !Array.isArray(workflow.statuses) ||
                workflow.statuses.length === 0
              }
              className="flex items-center gap-2 bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
          </div>
        </div>
      </Card>

      {/* Status Changes Alert */}
      {hasStatusChanges && (
        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            You have unsaved changes to the status order. Don't forget to save
            your changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Visual */}
      <Card className="bg-[var(--card)] border-[var(--border)] p-6">
        {sortedStatuses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-[var(--muted)] flex items-center justify-center">
              <Play className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No Statuses Configured
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Add statuses to this workflow to create a visual flow.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto">
            {sortedStatuses.map((status, index) => (
              <React.Fragment key={status.id}>
                <div
                  className={`flex-shrink-0 w-64 p-4 border-2 border-dashed rounded-lg cursor-move transition-all ${
                    dragOverIndex === index
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]"
                  } ${
                    draggedStatus?.id === status.id
                      ? "opacity-50 rotate-1 scale-105"
                      : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, status)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {/* Status Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full border border-[var(--border)]"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-medium text-[var(--foreground)] truncate">
                        {status.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status.category)}
                      <span className="text-sm text-[var(--muted-foreground)]">
                        #{status.position ?? status.order ?? index}{" "}
                        {/* ✅ Show position or fallback to order/index */}
                      </span>
                      <GripVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
                    </div>
                  </div>

                  {/* Status Details */}
                  <div className="space-y-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs rounded-full ${getCategoryColor(
                        status.category
                      )}`}
                    >
                      {status.category.replace("_", " ")}
                    </Badge>

                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>{status.isDefault ? "Default" : "Custom"}</span>
                      <div className="flex items-center space-x-1">
                        <GripVertical className="w-3 h-3" />
                        <span>Drag to reorder</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                {index < sortedStatuses.length - 1 && (
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-full min-h-[120px]">
                    <ArrowRight className="w-6 h-6 text-[var(--muted-foreground)]" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </Card>

      {/* Workflow Rules */}
      <Card className="bg-[var(--card)] border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Workflow Rules
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Transition Rules
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Tasks can move forward to any subsequent status</li>
              <li>• Tasks can move backward to previous statuses</li>
              <li>• Some transitions may require specific permissions</li>
              <li>
                • Automated transitions can be configured for certain conditions
              </li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Status Requirements
            </h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• At least one status must be marked as default</li>
              <li>
                • Each workflow must have at least one status in each category
              </li>
              <li>• Status names must be unique within a workflow</li>
              <li>• Default status cannot be deleted</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
