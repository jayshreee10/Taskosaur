"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  HiChevronDown, 
  HiCheck, 
  HiFolderPlus,
  HiBuildingOffice2,
  HiDocumentText,
  HiSparkles,
  HiRocketLaunch
} from "react-icons/hi2";
import { HiColorSwatch } from "react-icons/hi";
import { useWorkspace } from "@/contexts/workspace-context";
import { useProject } from "@/contexts/project-context";
import { getCurrentWorkspaceId } from "@/utils/hierarchyContext";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (projectData: {
    name: string;
    slug: string;
    description: string;
    workspaceId: string;
    color: string;
    avatar: string;
  }) => void;
}


export function NewProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: NewProjectModalProps) {
  const workspaceContext = useWorkspace();
  const projectContext = useProject();
  
  // Destructure context functions to prevent infinite re-renders
  const { getCurrentOrganizationId, getWorkspacesByOrganization, getWorkspaceById } = workspaceContext;
  const { createProject } = projectContext;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    workspace: null as any,
    color: "#2563eb",
  });

  // Generate URL slug from project name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const projectSlug = generateSlug(formData.name);

  // Dynamic color theming based on selected project color
  const themeColor = formData.color;
  const themeColorWithOpacity = (opacity: number) => `${themeColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  
  // CSS custom properties for dynamic theming
  const dynamicStyles = {
    '--dynamic-primary': themeColor,
    '--dynamic-primary-20': themeColorWithOpacity(0.2),
    '--dynamic-primary-10': themeColorWithOpacity(0.1),
    '--dynamic-primary-5': themeColorWithOpacity(0.05),
    '--dynamic-primary-80': themeColorWithOpacity(0.8),
    '--dynamic-primary-90': themeColorWithOpacity(0.9),
  } as React.CSSProperties;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);

  // Filter workspaces based on search
  const filteredWorkspaces = allWorkspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(workspaceSearch.toLowerCase())
  );

  // Load workspaces and auto-select current workspace
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const loadWorkspacesAndCurrent = async () => {
      if (!isMounted) return;
      
      setIsLoadingWorkspaces(true);
      try {
        // Load all workspaces
        const workspacesData = await getWorkspacesByOrganization();
        
        if (!isMounted) return;
        setAllWorkspaces(workspacesData || []);

        // Auto-select current workspace if available
        const workspaceId = getCurrentWorkspaceId();
        if (workspaceId && workspacesData) {
          const currentWorkspace = workspacesData.find(ws => ws.id === workspaceId);
          if (currentWorkspace && isMounted) {
            setFormData(prev => ({ ...prev, workspace: currentWorkspace }));
          } else if (isMounted) {
            // Fallback: try to get workspace by ID
            try {
              const workspace = await getWorkspaceById(workspaceId);
              if (workspace && isMounted) {
                setFormData(prev => ({ ...prev, workspace }));
              }
            } catch (error) {
              console.error("Failed to load current workspace:", error);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load workspaces:", error);
        if (isMounted) {
          setAllWorkspaces([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingWorkspaces(false);
        }
      }
    };

    loadWorkspacesAndCurrent();

    return () => {
      isMounted = false;
    };
  }, [isOpen]); // Only depend on isOpen to prevent infinite loops

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.workspace) return;

    setIsSubmitting(true);
    try {
      const projectData = {
        name: formData.name.trim(),
        slug: projectSlug,
        description: formData.description.trim(),
        color: formData.color,
        status: "ACTIVE" as const,
        priority: "MEDIUM" as const,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        workspaceId: formData.workspace.id,
        settings: {
          methodology: "scrum" as const,
          defaultTaskType: "task" as const,
          enableTimeTracking: false,
          allowSubtasks: true,
          workflowId: "default",
        },
      };

      await createProject(projectData);
      handleClose();
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      workspace: null,
      color: "#2563eb",
    });
    setWorkspaceSearch("");
    setAllWorkspaces([]);
    setWorkspaceOpen(false);
    onClose();
  };

  // Form validation
  const isValid = formData.name.trim().length > 0 && formData.workspace;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" style={dynamicStyles}>
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, var(--dynamic-primary), var(--dynamic-primary-80))` 
              }}
            >
              <HiFolderPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-[var(--foreground)]">
                Create new project
              </DialogTitle>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                Organize your tasks and collaborate with your team
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <HiSparkles 
                className="h-4 w-4 transition-colors duration-300" 
                style={{ color: 'var(--dynamic-primary)' }}
              />
              Project name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="border-2 transition-colors duration-300"
              style={{
                '--tw-ring-color': 'var(--dynamic-primary-20)',
                borderColor: 'var(--border)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--dynamic-primary)';
                e.target.style.boxShadow = `0 0 0 3px var(--dynamic-primary-20)`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
              autoFocus
            />
            {/* URL Preview */}
            {formData.name && (
              <div 
                className="flex items-center gap-2 mt-2 p-3 rounded-lg border transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, var(--dynamic-primary-5), var(--dynamic-primary-10))`,
                  borderColor: 'var(--dynamic-primary-20)'
                }}
              >
                <HiRocketLaunch 
                  className="h-4 w-4 transition-colors duration-300" 
                  style={{ color: 'var(--dynamic-primary)' }}
                />
                <div className="text-xs text-[var(--muted-foreground)]">URL:</div>
                <code 
                  className="text-xs font-mono bg-white/50 px-2 py-1 rounded border transition-colors duration-300"
                  style={{ color: 'var(--dynamic-primary)' }}
                >
                  {formData.workspace ? `/${formData.workspace.slug}` : '/workspace'}/{projectSlug || 'project-name'}
                </code>
              </div>
            )}
          </div>

          {/* Workspace */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <HiBuildingOffice2 
                className="h-4 w-4 transition-colors duration-300" 
                style={{ color: 'var(--dynamic-primary)' }}
              />
              Workspace <span className="text-red-500">*</span>
            </Label>
            <Popover open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal h-10 border-2 transition-all duration-300"
                  style={{
                    borderColor: 'var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--dynamic-primary-20)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--dynamic-primary)';
                    e.currentTarget.style.boxShadow = `0 0 0 3px var(--dynamic-primary-20)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  disabled={isLoadingWorkspaces}
                >
                  {isLoadingWorkspaces ? (
                    <span className="text-muted-foreground">Loading workspaces...</span>
                  ) : formData.workspace ? (
                    <span className="truncate text-[var(--foreground)]">{formData.workspace.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Select workspace</span>
                  )}
                  <HiChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] p-0 bg-[var(--popover)] border-[var(--border)] shadow-lg" 
                align="start"
              >
                <Command className="bg-[var(--popover)]">
                  <CommandInput
                    placeholder="Search workspaces..."
                    value={workspaceSearch}
                    onValueChange={setWorkspaceSearch}
                    className="border-b border-[var(--border)]"
                  />
                  <CommandEmpty className="py-4 text-center text-sm text-[var(--muted-foreground)]">
                    {isLoadingWorkspaces ? "Loading workspaces..." : 
                     filteredWorkspaces.length === 0 && workspaceSearch ? "No workspaces found." : 
                     "Type to search workspaces"}
                  </CommandEmpty>
                  <CommandGroup className="max-h-48 overflow-auto p-1">
                    {filteredWorkspaces.map((workspace) => (
                      <CommandItem
                        key={workspace.id}
                        value={workspace.name}
                        onSelect={() => {
                          setFormData(prev => ({ ...prev, workspace }));
                          setWorkspaceOpen(false);
                        }}
                        className="flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer hover:bg-[var(--accent)] text-[var(--foreground)]"
                      >
                        <span className="flex-1 truncate text-sm">{workspace.name}</span>
                        {formData.workspace?.id === workspace.id && (
                          <HiCheck className="h-4 w-4 text-[var(--primary)]" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
              <HiDocumentText 
                className="h-4 w-4 transition-colors duration-300" 
                style={{ color: 'var(--dynamic-primary)' }}
              />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this project is about..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[80px] resize-none border-2 transition-colors duration-300"
              style={{
                borderColor: 'var(--border)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--dynamic-primary)';
                e.target.style.boxShadow = `0 0 0 3px var(--dynamic-primary-20)`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
              <HiSparkles 
                className="h-3 w-3 transition-colors duration-300" 
                style={{ color: 'var(--dynamic-primary)' }}
              />
              Help your team understand the project's goals and scope.
            </p>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <HiColorSwatch 
                className="h-4 w-4 transition-colors duration-300" 
                style={{ color: 'var(--dynamic-primary)' }}
              />
              Project color
            </Label>
            <div 
              className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, var(--dynamic-primary-5), var(--dynamic-primary-10))`,
                borderColor: 'var(--dynamic-primary-20)'
              }}
            >
              <div className="relative">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 rounded-lg border-2 cursor-pointer bg-transparent shadow-sm transition-all duration-300"
                  style={{ borderColor: 'var(--dynamic-primary)' }}
                  title="Choose project color"
                />
                <div 
                  className="absolute inset-1 rounded-md pointer-events-none shadow-inner"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith('#') && value.length <= 7) {
                    setFormData(prev => ({ ...prev, color: value }));
                  }
                }}
                placeholder="#2563eb"
                className="flex-1 font-mono text-sm border-2 transition-colors duration-300"
                style={{
                  borderColor: 'var(--border)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--dynamic-primary)';
                  e.target.style.boxShadow = `0 0 0 3px var(--dynamic-primary-20)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
                maxLength={7}
              />
            </div>
            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
              <HiColorSwatch 
                className="h-3 w-3 transition-colors duration-300" 
                style={{ color: 'var(--dynamic-primary)' }}
              />
              Choose a color to help identify your project.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6 border-t border-[var(--border)]/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 border-2 transition-all duration-300"
              style={{
                borderColor: 'var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--dynamic-primary-20)';
                e.currentTarget.style.backgroundColor = 'var(--dynamic-primary-5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 shadow-lg hover:shadow-xl transition-all duration-300 text-white"
              style={{
                background: `linear-gradient(135deg, var(--dynamic-primary), var(--dynamic-primary-90))`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, var(--dynamic-primary-90), var(--dynamic-primary-80))`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, var(--dynamic-primary), var(--dynamic-primary-90))`;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Creating project...
                </>
              ) : (
                <>
                  <HiRocketLaunch className="h-4 w-4 mr-2" />
                  Create project
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}