"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTask } from '@/contexts/task-context';
import { useProject } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import TaskListView from '@/components/tasks/views/TaskListView';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import {
  HiPlus,
  HiClipboardDocumentList,
  HiMagnifyingGlass,
  HiXMark,
  HiListBullet,
  HiViewColumns,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task } from '@/contexts/task-context';
import { Project } from '@/utils/api';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="h-6 bg-[var(--muted)] rounded w-32 mb-2"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-64"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-[var(--muted)] rounded w-32"></div>
            <div className="h-10 bg-[var(--muted)] rounded w-24"></div>
          </div>
        </div>
        <Card className="border-none bg-[var(--card)]">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-[var(--muted)] rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                    <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
    <Card className="max-w-md w-full mx-4 border-[var(--border)]">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-[var(--destructive)]/10 rounded-lg flex items-center justify-center mx-auto mb-6 text-[var(--destructive)]">
          <HiClipboardDocumentList size={24} />
        </div>
        <CardTitle className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Something went wrong
        </CardTitle>
        <CardDescription className="text-sm text-[var(--muted-foreground)] mb-6">
          {error}
        </CardDescription>
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default function TasksPage() {
  const { 
    getTasksByOrganization,
    isLoading: taskLoading,
  } = useTask();
  
  const { 
    getProjectsByUserId,
    isLoading: projectLoading 
  } = useProject();
  
  const { getCurrentUser } = useAuth();
  const { currentOrganization } = useOrganization();

  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);
  const [displayProjects, setDisplayProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const isInitializedRef = useRef(false);
  const currentUser = getCurrentUser();

  // Debounce search input
  const debouncedSearchQuery = useDebounce(searchInput, 500);

  const loadData = useCallback(async () => {
    if (!currentUser?.id || !currentOrganization?.id) return;

    try {
      setError(null);

      // Load projects for the current user (only on initial load)
      if (!isInitializedRef.current) {
        const projectsData = await getProjectsByUserId(currentUser.id);
        setDisplayProjects(projectsData || []);
      }

      // Prepare parameters for getTasksByOrganization
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(priorityFilter !== "all" && { priority: priorityFilter as "LOW" | "MEDIUM" | "HIGH" | "HIGHEST" }),
      };

      console.log('API Params being sent:', params);

      // Load tasks from organization with correct parameters
      const result = await getTasksByOrganization(currentOrganization.id, params);

      // Update state with the paginated response
      setDisplayTasks(result.tasks);
      setPagination(result.pagination);

      isInitializedRef.current = true;
    } catch (error) {
      console.error("Error loading tasks:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    }
  }, [
    currentUser?.id,
    currentOrganization?.id,
    currentPage,
    pageSize,
    searchQuery,
    priorityFilter,
    getTasksByOrganization,
    getProjectsByUserId
  ]);

  // Initial load
  useEffect(() => {
    if (currentUser?.id && currentOrganization?.id) {
      loadData();
    }
  }, [currentUser?.id, currentOrganization?.id]);

  // Update searchQuery when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // Filter changes effect - triggers on any search or priority change
  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('Filters changed, reloading data:', { searchQuery, priorityFilter });
      loadData();
    }
  }, [searchQuery, priorityFilter]);

  // Pagination changes
  useEffect(() => {
    if (isInitializedRef.current) {
      loadData();
    }
  }, [currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    if (isInitializedRef.current) {
      setCurrentPage(1);
    }
  }, [searchQuery, priorityFilter]);

  const handleRetry = useCallback(() => {
    isInitializedRef.current = false;
    setError(null);
    loadData();
  }, [loadData]);

  const handleSearch = useCallback((query: string) => {
    setSearchInput(query);
  }, []);

  const handlePriorityFilter = useCallback((priority: "all" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST") => {
    setPriorityFilter(priority);
  }, []);

  const getDefaultWorkspaceAndProject = () => {
    const defaultWorkspace = displayProjects.length > 0 && displayProjects[0].workspace 
      ? displayProjects[0].workspace 
      : { slug: 'default-workspace' };
    const defaultProject = displayProjects.length > 0 
      ? displayProjects[0] 
      : { slug: 'default-project' };
    
    return { defaultWorkspace, defaultProject };
  };

  const isLoading = taskLoading || projectLoading;

  if (isLoading && !isInitializedRef.current) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  const { defaultWorkspace, defaultProject } = getDefaultWorkspaceAndProject();

  return (
    <div className="min-h-screen h-full bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen h-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-md font-bold flex items-center gap-2 ">
              <HiClipboardDocumentList className='size-5' />
              My Tasks
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage and track all your assigned tasks in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href={`/tasks/new`}>
              <Button className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90">
                <HiPlus size={16} />
                Add Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
              <Input
                placeholder="Search tasks..."
                className="pl-10 border-[var(--border)] bg-[var(--background)]"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchInput && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <HiXMark size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
              <SelectTrigger className="min-w-[120px] border-[var(--border)] bg-[var(--background)]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="border-[var(--border)] bg-[var(--popover)]">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="HIGHEST">Highest</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-[var(--border)]">
                  <HiViewColumns size={16} className="mr-2" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-[var(--border)] bg-[var(--popover)]">
                <DropdownMenuItem onClick={() => setViewMode("list")}>
                  <HiListBullet size={16} className="mr-2" />
                  List View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("board")}>
                  <HiViewColumns size={16} className="mr-2" />
                  Board View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-4 -mt-2">
          <TaskViewTabs currentView="list" baseUrl="/tasks" />
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <Card className="border-none bg-[var(--card)]">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-4 w-4 bg-[var(--muted)] rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                      <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : displayTasks && displayTasks.length > 0 ? (
          <>
            <TaskListView 
              tasks={displayTasks} 
              projects={displayProjects}
            />
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 ">
                <div className="text-sm text-[var(--muted-foreground)]">
                  Showing {((pagination.currentPage - 1) * pageSize) + 1} to {Math.min(pagination.currentPage * pageSize, pagination.totalCount)} of {pagination.totalCount} tasks
                </div>
                <div className="flex items-center gap-2">
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-20 border-none bg-[var(--card)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-none bg-[var(--popover)]">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-none bg-[var(--card)]"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!pagination.hasPrevPage}
                  >
                    <HiChevronLeft size={16} />
                  </Button>
                  <span className="text-sm text-[var(--muted-foreground)] px-2">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-none bg-[var(--card)]"
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={!pagination.hasNextPage}
                  >
                    <HiChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="border-none bg-[var(--card)]">
            <CardContent className="p-8 text-center">
              <HiClipboardDocumentList
                size={48}
                className="mx-auto text-[var(--muted-foreground)] mb-4"
              />
              <CardTitle className="text-lg font-medium mb-2 text-[var(--foreground)]">
                {searchQuery || priorityFilter !== "all" 
                  ? "No tasks found" 
                  : "No tasks yet"
                }
              </CardTitle>
              <CardDescription className="text-sm text-[var(--muted-foreground)] mb-6">
                {searchQuery || priorityFilter !== "all"
                  ? "Try adjusting your filters or search query."
                  : "Create your first task to get started with project management."
                }
              </CardDescription>
              {(!searchQuery && priorityFilter === "all") && (
                <></>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
