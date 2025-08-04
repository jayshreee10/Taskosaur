"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateWorkflowData } from "@/utils/api/workflowsApi";
import { Workflow } from "@/utils/api/organizationApi";


// Import types

interface CreateWorkflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workflowData: CreateWorkflowData) => Promise<Workflow>;
  organizationId: string;
  isProjectLevel?: boolean;
  isLoading?: boolean;
}

// Validation schema
const createWorkflowSchema = z.object({
  name: z.string()
    .min(1, "Workflow name is required")
    .min(3, "Workflow name must be at least 3 characters")
    .max(50, "Workflow name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Workflow name can only contain letters, numbers, spaces, hyphens, and underscores"),
  description: z.string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  isDefault: z.boolean().optional(),
});

type CreateWorkflowFormData = z.infer<typeof createWorkflowSchema>;

export default function CreateWorkflowForm({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  isProjectLevel = false,
  isLoading = false,
}: CreateWorkflowFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateWorkflowFormData>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
    },
  });

  const handleSubmit = async (data: CreateWorkflowFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      const workflowData: CreateWorkflowData = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        organizationId,
        isDefault: data.isDefault || false,
      };

      console.log("🆕 CreateWorkflowForm: Submitting workflow data:", workflowData);

      const newWorkflow = await onSuccess(workflowData);
      console.log("✅ CreateWorkflowForm: Workflow created successfully:", newWorkflow);

      // Reset form and close
      form.reset();
      onClose();
    } catch (err) {
      console.error("❌ CreateWorkflowForm: Failed to create workflow:", err);
      setError(err instanceof Error ? err.message : "Failed to create workflow");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    form.reset();
    setError(null);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-[var(--card)] border-[var(--border)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)]">
            Create {isProjectLevel ? "Project" : ""} Workflow
          </DialogTitle>
          <DialogDescription className="text-[var(--muted-foreground)]">
            {isProjectLevel 
              ? "Create a new workflow for this project. This will define the task statuses and flow for project tasks."
              : "Create a new workflow template. This can be used across multiple projects in your organization."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-[var(--destructive)]/10 border-[var(--destructive)]/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Workflow Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--foreground)]">
                    Workflow Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Development Workflow, Bug Triage Process"
                      disabled={isSubmitting || isLoading}
                      className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                    />
                  </FormControl>
                  <FormDescription className="text-[var(--muted-foreground)]">
                    Choose a clear, descriptive name for your workflow
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--foreground)]">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the purpose and usage of this workflow..."
                      disabled={isSubmitting || isLoading}
                      className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] min-h-[80px] resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription className="text-[var(--muted-foreground)]">
                    Optional: Provide context about when and how this workflow should be used
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Set as Default */}
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[var(--border)] p-4 bg-[var(--muted)]/30">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting || isLoading}
                      className="border-[var(--border)]"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-[var(--foreground)] font-medium">
                      Set as default workflow
                    </FormLabel>
                    <FormDescription className="text-[var(--muted-foreground)]">
                      {isProjectLevel 
                        ? "This workflow will be used by default for new tasks in this project"
                        : "This workflow will be used by default for new projects in your organization"
                      }
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isLoading}
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || !organizationId}
                className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workflow"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}