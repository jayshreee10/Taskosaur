'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SprintBoard from '@/components/sprints/SprintBoard';
import SprintPlanning from '@/components/sprints/SprintPlanning';
import SprintProgress from '@/components/sprints/SprintProgress';
import SprintSelector from '@/components/sprints/SprintSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HiPlus,
  HiCalendar,
  HiChartBar,
  
  HiPlay,
  HiPause,
  HiCheck,
  HiClock,
  HiChevronLeft,
} from 'react-icons/hi2';
import { HiLightningBolt ,HiViewBoards } from "react-icons/hi";
import { Sprint, SprintStatus } from '@/types/tasks';

interface CreateSprintData {
  name: string;
  goal: string;
  status: string;
  startDate: string;
  endDate: string;
  projectId: string;
}

type SprintView = 'board' | 'planning' | 'progress';

const CreateSprintModal = ({ 
  isOpen, 
  onClose, 
  onCreateSprint,
  projectId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreateSprint: (data: CreateSprintData) => void;
  projectId: string;
}) => {
  const [formData, setFormData] = useState<CreateSprintData>({
    name: '',
    goal: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
    projectId: projectId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) return;

    setIsSubmitting(true);
    try {
      await onCreateSprint(formData);
      setFormData({
        name: '',
        goal: '',
        status: 'PLANNING',
        startDate: '',
        endDate: '',
        projectId: projectId
      });
      onClose();
    } catch (error) {
      console.error('Error creating sprint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--card)] border-none rounded-[var(--card-radius)] shadow-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] flex items-center gap-2">
            <HiLightningBolt className="w-5 h-5 text-[var(--primary)]" />
            Create New Sprint
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name" className="text-[var(--foreground)] font-medium">
                Sprint Name *
              </Label>
              <Input
                id="sprint-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter sprint name"
                className="border-input bg-background text-[var(--foreground)]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint-goal" className="text-[var(--foreground)] font-medium">
                Sprint Goal
              </Label>
              <Textarea
                id="sprint-goal"
                rows={3}
                value={formData.goal}
                onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="What is the main objective of this sprint?"
                className="border-input bg-background text-[var(--foreground)] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint-status" className="text-[var(--foreground)] font-medium">
                Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="h-9 border-none bg-[var(--primary)]/5 text-[var(--foreground)]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="border-none bg-[var(--card)]">
                  <SelectItem value="PLANNING">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[var(--accent)] text-[var(--primary)] border-none px-2 py-1 rounded font-medium text-xs">
                        Planning
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[var(--primary)]/10 text-[var(--primary)] border-none px-2 py-1 rounded font-medium text-xs">
                        Active
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[var(--muted)] text-[var(--muted-foreground)] border-none px-2 py-1 rounded font-medium text-xs">
                        Completed
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-[var(--foreground)] font-medium">
                  Start Date *
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="h-9 border-input bg-background text-[var(--foreground)]"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-[var(--foreground)] font-medium">
                  End Date *
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="h-9 border-input bg-background text-[var(--foreground)]"
                  required
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="h-9 w-20 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] transition-all duration-200"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="h-9 w-28 border-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium"
              disabled={isSubmitting || !formData.name.trim() || !formData.startDate || !formData.endDate}
            >
              {isSubmitting ? 'Creating...' : 'Create Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'PLANNING':
      return { 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-none',
        icon: HiClock 
      };
    case 'ACTIVE':
      return { 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-none',
        icon: HiPlay 
      };
    case 'COMPLETED':
      return { 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-none',
        icon: HiCheck 
      };
    case 'CANCELLED':
      return { 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-none',
        icon: HiPause 
      };
    default:
      return { 
        className: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-none',
        icon: HiClock 
      };
  }
};

export default function SprintsPage() {
  const params = useParams();
  const [activeView, setActiveView] = useState<SprintView>('board');
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const workspaceSlug = params?.workspaceSlug as string;
  const projectSlug = params?.projectSlug as string;

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockSprints: Sprint[] = [
      {
        id: '1',
        name: 'Sprint 1 - Foundation',
        goal: 'Set up project foundation and core features',
        status: SprintStatus.ACTIVE,
        startDate: '2024-01-15',
        endDate: '2024-01-29',
        projectId: projectSlug,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-10',
      },
      {
        id: '2',
        name: 'Sprint 2 - User Interface',
        goal: 'Complete UI components and user flows',
        status: SprintStatus.PLANNED,
        startDate: '2024-01-30',
        endDate: '2024-02-13',
        projectId: projectSlug,
        createdAt: '2024-01-11',
        updatedAt: '2024-01-20',
      }
    ];
    setTimeout(() => {
      setSprints(mockSprints);
      setSelectedSprint(mockSprints[0]);
      setIsLoading(false);
    }, 500);
  }, [projectSlug]);

  const handleSprintChange = (sprint: Sprint) => {
    setSelectedSprint(sprint);
  };

  const handleCreateSprint = async (data: CreateSprintData) => {
    // Mock API call - replace with actual implementation
    const newSprint: Sprint = {
      id: Date.now().toString(),
      name: data.name,
      goal: data.goal,
      status: data.status as SprintStatus,
      startDate: data.startDate,
      endDate: data.endDate,
      projectId: data.projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSprints(prev => [...prev, newSprint]);
    setSelectedSprint(newSprint);
  };

  // const viewConfig = [
  //   { id: 'board', label: 'Sprint Board', icon: HiViewBoards },
  //   { id: 'planning', label: 'Planning', icon: HiCalendar },
  //   { id: 'progress', label: 'Progress', icon: HiChartBar }
  // ];
  const viewConfig = [
    { id: 'board', label: 'Sprint Board', icon: HiViewBoards },
    // { id: 'planning', label: 'Planning', icon: HiCalendar },
    // { id: 'progress', label: 'Progress', icon: HiChartBar }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[var(--muted)] rounded w-1/3 mb-6"></div>
            <div className="h-10 bg-[var(--muted)] rounded mb-4"></div>
            <div className="bg-[var(--card)] rounded-[var(--card-radius)] border-none p-6">
              <div className="h-40 bg-[var(--muted)] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Compact Header - Following your theme patterns */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href={`/${workspaceSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              {workspaceSlug}
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link href={`/${workspaceSlug}/${projectSlug}`} className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors font-medium">
              {projectSlug}
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-[var(--foreground)] font-medium">Sprints</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href={`/${workspaceSlug}/${projectSlug}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 w-9 p-0 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)]"
                >
                  <HiChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                  <HiLightningBolt className="w-5 h-5 text-[var(--primary)]" />
                  Sprint Management
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Manage sprints for {projectSlug} project
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 z-50">
              <SprintSelector
                currentSprint={selectedSprint}
                sprints={sprints}
                onSprintChange={handleSprintChange}
              />
              <Button
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-4 border-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-2"
              >
                <HiPlus className="w-4 h-4" />
                Create Sprint
              </Button>
            </div>
          </div>
        </div>


        {/* View Toggle - Following your theme patterns */}
        <div className="flex items-center space-x-1">
          {viewConfig.map(view => {
            const IconComponent = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as SprintView)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeView === view.id
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {view.label}
              </button>
            );
          })}
        </div>

        {/* Sprint Content */}
        <div className="space-y-6 z-0">
          {activeView === 'board' && (
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none z-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiViewBoards className="w-5 h-5 text-[var(--primary)]" />
                  Sprint Board
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SprintBoard
                  projectId={projectSlug}
                  sprintId={selectedSprint?.id}
                />
              </CardContent>
            </Card>
          )}
          {/*
          {activeView === 'planning' && (
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiCalendar className="w-5 h-5 text-[var(--primary)]" />
                  Sprint Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SprintPlanning
                  projectId={projectSlug}
                  sprintId={selectedSprint?.id}
                />
              </CardContent>
            </Card>
          )}
          
          {activeView === 'progress' && (
            <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HiChartBar className="w-5 h-5 text-[var(--primary)]" />
                  Sprint Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SprintProgress selectedSprint={selectedSprint?.id ?? null} />
              </CardContent>
            </Card>
          )}
          */}
        </div>

        {/* Create Sprint Modal */}
        <CreateSprintModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateSprint={handleCreateSprint}
          projectId={projectSlug}
        />
      </div>
    </div>
  );
}