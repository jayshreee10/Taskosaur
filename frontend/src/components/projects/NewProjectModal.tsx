'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  HiMagnifyingGlass, 
  HiRocketLaunch, 
  HiXMark, 
  HiSwatch,
  HiPhoto,
  HiFolder,
  HiCog,
  HiLightBulb,
  HiChartBar,
  HiGlobeAlt,
  HiDevicePhoneMobile,
  HiComputerDesktop,
  HiPaintBrush,
  HiChevronDown,
  HiArrowLeft,
  HiArrowRight
} from 'react-icons/hi2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getWorkspaces } from '@/utils/apiUtils';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: {
    name: string;
    slug: string;
    description: string;
    workspaceId: string;
    color: string;
    avatar: string;
  }) => void;
}

export function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedAvatar, setSelectedAvatar] = useState('rocket');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Color options for project
  const projectColors = [
    { name: 'blue', class: 'from-blue-500 to-blue-600', bg: 'bg-blue-500' },
    { name: 'purple', class: 'from-purple-500 to-purple-600', bg: 'bg-purple-500' },
    { name: 'green', class: 'from-green-500 to-green-600', bg: 'bg-green-500' },
    { name: 'orange', class: 'from-orange-500 to-orange-600', bg: 'bg-orange-500' },
    { name: 'red', class: 'from-red-500 to-red-600', bg: 'bg-red-500' },
    { name: 'pink', class: 'from-pink-500 to-pink-600', bg: 'bg-pink-500' },
    { name: 'indigo', class: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-500' },
    { name: 'teal', class: 'from-teal-500 to-teal-600', bg: 'bg-teal-500' },
  ];

  // Avatar options for project
  const projectAvatars = [
    { name: 'rocket', icon: HiRocketLaunch },
    { name: 'folder', icon: HiFolder },
    { name: 'lightbulb', icon: HiLightBulb },
    { name: 'chart', icon: HiChartBar },
    { name: 'globe', icon: HiGlobeAlt },
    { name: 'mobile', icon: HiDevicePhoneMobile },
    { name: 'desktop', icon: HiComputerDesktop },
    { name: 'brush', icon: HiPaintBrush },
    { name: 'cog', icon: HiCog },
  ];

  // Fetch workspaces when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
    }
  }, [isOpen]);

  // Auto-generate slug from project name
  useEffect(() => {
    if (projectName) {
      const slug = projectName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setProjectSlug(slug);
    }
  }, [projectName]);

  const fetchWorkspaces = async () => {
    try {
      const currentOrganizationId = localStorage.getItem('currentOrganizationId');
      if (currentOrganizationId) {
        const workspacesData = await getWorkspaces(currentOrganizationId);
        setWorkspaces(workspacesData || []);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const filteredWorkspaces = useMemo(() => {
    if (!workspaceSearch.trim()) return workspaces;
    return workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
      workspace.description?.toLowerCase().includes(workspaceSearch.toLowerCase())
    );
  }, [workspaces, workspaceSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace || !projectName.trim() || !projectSlug.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        name: projectName.trim(),
        slug: projectSlug.trim(),
        description: projectDescription.trim(),
        workspaceId: selectedWorkspace.id,
        color: selectedColor,
        avatar: selectedAvatar,
      });
      handleClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedWorkspace(null);
    setWorkspaceSearch('');
    setShowWorkspaceDropdown(false);
    setProjectName('');
    setProjectSlug('');
    setProjectDescription('');
    setSelectedColor('blue');
    setSelectedAvatar('rocket');
    setCurrentStep(1);
    setShowAdvanced(false);
    onClose();
  };

  const getSelectedColorClass = () => {
    return projectColors.find(color => color.name === selectedColor)?.class || 'from-blue-500 to-blue-600';
  };

  const getSelectedAvatarIcon = () => {
    return projectAvatars.find(avatar => avatar.name === selectedAvatar)?.icon || HiRocketLaunch;
  };

  const canProceedToNext = () => {
    if (currentStep === 1) {
      return selectedWorkspace && projectName.trim();
    }
    return true;
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 4;
    
    if (selectedWorkspace) completed++;
    if (projectName.trim()) completed++;
    if (projectSlug.trim()) completed++;
    if (projectDescription.trim()) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const selectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setWorkspaceSearch(workspace.name);
    setShowWorkspaceDropdown(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Enhanced Header with progress */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-[var(--primary)]/3 to-transparent" />
          <div className="relative px-6 py-6">
            <DialogHeader>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getSelectedColorClass()} flex items-center justify-center shadow-lg shadow-black/25 flex-shrink-0 transition-all duration-300`}>
                  {React.createElement(getSelectedAvatarIcon(), { className: "w-6 h-6 text-white" })}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold text-[var(--foreground)] mb-2">
                    Create New Project
                  </DialogTitle>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {currentStep === 1 
                      ? "Let's start with the basics - choose a workspace and name your project."
                      : "Now customize how your project looks and add optional details."
                    }
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">Setup Progress</span>
                  <span className="font-medium text-[var(--foreground)]">{getCompletionPercentage()}% Complete</span>
                </div>
                <div className="w-full h-2 bg-[var(--muted)]/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${getCompletionPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    currentStep === 1 
                      ? 'bg-[var(--primary)] text-white shadow-sm' 
                      : 'bg-[var(--accent)]/50 text-[var(--muted-foreground)]'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    Basic Info
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    currentStep === 2 
                      ? 'bg-[var(--primary)] text-white shadow-sm' 
                      : 'bg-[var(--accent)]/50 text-[var(--muted-foreground)]'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    Customize
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  {/* Workspace Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <HiFolder className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      <Label htmlFor="workspace" className="text-base font-semibold text-[var(--foreground)]">
                        Select Workspace
                      </Label>
                      <span className="text-xs font-medium text-[var(--destructive)] bg-[var(--destructive)]/10 px-2 py-1 rounded-full">Required</span>
                    </div>
                    
                    <div className="relative">
                      <div className="relative">
                        <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                        <Input
                          id="workspace"
                          placeholder="Search for a workspace..."
                          value={workspaceSearch}
                          onChange={(e) => setWorkspaceSearch(e.target.value)}
                          onFocus={() => setShowWorkspaceDropdown(true)}
                          className="pl-12 h-14 text-base border-2 border-[var(--border)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all duration-200 rounded-xl"
                          required
                        />
                      </div>
                      
                      {showWorkspaceDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowWorkspaceDropdown(false)}
                          />
                          <Card className="absolute top-full left-0 right-0 mt-3 z-20 border-2 border-[var(--border)] bg-[var(--background)] shadow-2xl shadow-black/20 max-h-64 overflow-y-auto rounded-2xl">
                            <CardContent className="p-4">
                              {filteredWorkspaces.length > 0 ? (
                                <div className="space-y-2">
                                  {filteredWorkspaces.map((workspace) => (
                                    <div
                                      key={workspace.id}
                                      onClick={() => selectWorkspace(workspace)}
                                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--accent)]/50 cursor-pointer transition-all duration-200 hover:shadow-md border-2 border-transparent hover:border-[var(--primary)]/20"
                                    >
                                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center text-white font-bold shadow-lg shadow-[var(--primary)]/25 flex-shrink-0">
                                        {workspace.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-base font-semibold text-[var(--foreground)] leading-tight mb-1">
                                          {workspace.name}
                                        </div>
                                        {workspace.description && (
                                          <div className="text-sm text-[var(--muted-foreground)] line-clamp-1 leading-relaxed">
                                            {workspace.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-8 text-center">
                                  <div className="w-16 h-16 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mx-auto mb-4">
                                    <HiMagnifyingGlass className="w-8 h-8 text-[var(--muted-foreground)]" />
                                  </div>
                                  <p className="text-base font-medium text-[var(--foreground)] mb-2">No workspaces found</p>
                                  <p className="text-sm text-[var(--muted-foreground)]">Try adjusting your search terms</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                    
                    {selectedWorkspace && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 rounded-xl border-2 border-[var(--primary)]/20 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">
                          {selectedWorkspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-[var(--foreground)]">
                            {selectedWorkspace.name}
                          </div>
                          <div className="text-sm text-[var(--primary)] font-medium">
                            ✓ Selected workspace
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Project Name */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <HiRocketLaunch className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      <Label htmlFor="projectName" className="text-base font-semibold text-[var(--foreground)]">
                        Project Name
                      </Label>
                      <span className="text-xs font-medium text-[var(--destructive)] bg-[var(--destructive)]/10 px-2 py-1 rounded-full">Required</span>
                    </div>
                    <Input
                      id="projectName"
                      placeholder="Enter a descriptive project name..."
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="h-14 text-base border-2 border-[var(--border)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all duration-200 rounded-xl"
                      required
                    />
                    {projectName && (
                      <div className="flex items-center gap-2 text-sm text-[var(--primary)] animate-in slide-in-from-bottom-2 duration-200">
                        <div className="w-4 h-4 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                        </div>
                        Looking good! Auto-generating URL slug...
                      </div>
                    )}
                  </div>

                  {/* Auto-generated Slug Preview */}
                  {projectName && (
                    <div className="p-4 bg-[var(--accent)]/20 rounded-xl border border-[var(--border)]/30 animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <HiGlobeAlt className="w-4 h-4 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--foreground)] mb-2">Your project URL will be:</p>
                          <div className="p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]/50 font-mono text-sm text-[var(--muted-foreground)]">
                            /{selectedWorkspace?.name.toLowerCase().replace(/\s+/g, '-') || 'workspace'}/{projectSlug || 'project-slug'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Customization */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  {/* Project Appearance */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <HiSwatch className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">Choose Your Style</h3>
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium text-[var(--foreground)]">
                        Color Theme
                      </Label>
                      <div className="grid grid-cols-4 gap-4">
                        {projectColors.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setSelectedColor(color.name)}
                            className={`group relative w-full h-16 rounded-2xl bg-gradient-to-br ${color.class} transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                              selectedColor === color.name 
                                ? 'ring-4 ring-[var(--primary)] ring-offset-4 ring-offset-[var(--background)] scale-105 shadow-xl' 
                                : 'hover:ring-2 hover:ring-white/50'
                            }`}
                          >
                            {selectedColor === color.name && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-full shadow-lg animate-in zoom-in-50 duration-200" />
                              </div>
                            )}
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="text-xs font-medium text-white/90 capitalize truncate">
                                {color.name}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Avatar Selection */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium text-[var(--foreground)]">
                        Project Icon
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {projectAvatars.map((avatar) => {
                          const IconComponent = avatar.icon;
                          return (
                            <button
                              key={avatar.name}
                              type="button"
                              onClick={() => setSelectedAvatar(avatar.name)}
                              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                                selectedAvatar === avatar.name
                                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg scale-105'
                                  : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/30'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getSelectedColorClass()} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                                <IconComponent className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-sm font-medium text-[var(--foreground)] capitalize">
                                {avatar.name}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="p-6 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/10 rounded-2xl border-2 border-[var(--border)]/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                        </div>
                        <p className="text-sm font-medium text-[var(--foreground)]">Live Preview</p>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getSelectedColorClass()} flex items-center justify-center shadow-2xl`}>
                          {React.createElement(getSelectedAvatarIcon(), { className: "w-8 h-8 text-white" })}
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-bold text-[var(--foreground)] leading-tight mb-1">
                            {projectName || 'Your Project Name'}
                          </div>
                          <div className="text-sm text-[var(--muted-foreground)] mb-2">
                            in {selectedWorkspace?.name || 'Selected Workspace'}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${projectColors.find(c => c.name === selectedColor)?.bg} text-white`}>
                              {projectColors.find(c => c.name === selectedColor)?.name} theme
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/50 text-[var(--foreground)] capitalize">
                              {selectedAvatar} icon
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options Toggle */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-3 w-full p-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/20 transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <HiCog className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-[var(--foreground)]">
                          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          Add description and customize URL slug
                        </div>
                      </div>
                      <div className={`transform transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>
                        <HiChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </div>
                    </button>

                    {showAdvanced && (
                      <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        {/* Custom Slug */}
                        <div className="space-y-3">
                          <Label htmlFor="projectSlug" className="text-sm font-medium text-[var(--foreground)]">
                            Custom URL Slug
                          </Label>
                          <Input
                            id="projectSlug"
                            placeholder="custom-project-slug"
                            value={projectSlug}
                            onChange={(e) => setProjectSlug(e.target.value)}
                            className="h-12 border-2 border-[var(--border)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all duration-200 rounded-xl font-mono text-sm"
                          />
                        </div>

                        {/* Project Description */}
                        <div className="space-y-3">
                          <Label htmlFor="projectDescription" className="text-sm font-medium text-[var(--foreground)]">
                            Project Description
                          </Label>
                          <textarea
                            id="projectDescription"
                            placeholder="Describe your project goals, scope, and key deliverables..."
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            rows={4}
                            maxLength={500}
                            className="flex w-full rounded-xl border-2 border-[var(--border)] bg-transparent px-4 py-3 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/10 focus-visible:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200"
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--muted-foreground)]">
                              {projectDescription.length}/500 characters
                            </span>
                            <span className={`font-medium ${projectDescription.length > 450 ? 'text-[var(--destructive)]' : 'text-[var(--muted-foreground)]'}`}>
                              {500 - projectDescription.length} remaining
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Enhanced Footer with Navigation */}
        <div className="px-6 py-6 bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/20 border-t border-[var(--border)]/30">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Help Text */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {currentStep === 1 ? "Step 1 of 2" : "Final Step"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {currentStep === 1 
                    ? "Choose workspace and name your project" 
                    : "Customize appearance and add details"
                  }
                </p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-3">
              {currentStep === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                  className="h-11 px-4 border-2 border-[var(--border)] hover:bg-[var(--accent)]/50 transition-all duration-200"
                >
                  <HiArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="h-11 px-6 border-2 border-[var(--border)] hover:bg-[var(--accent)]/50 transition-all duration-200"
              >
                Cancel
              </Button>

              {currentStep === 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToNext() || isLoading}
                  className="h-11 px-6 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Customize
                  <HiArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!selectedWorkspace || !projectName.trim() || !projectSlug.trim() || isLoading}
                  className="h-11 px-6 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 hover:from-[var(--primary)]/90 hover:to-[var(--primary)]/70 text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <HiRocketLaunch className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}