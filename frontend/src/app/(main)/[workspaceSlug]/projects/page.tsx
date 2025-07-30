"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";
import { useAuth } from "@/contexts/auth-context";
import ProjectAvatar from "@/components/ui/avatars/ProjectAvatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HiPlus,
  HiSearch,
  HiExclamation,
  HiArrowLeft,
  HiFolder,
  HiEye,
  HiCog,
} from "react-icons/hi";

interface Props {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  searchQuery,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  searchQuery?: string;
}) => (
  <div className="text-center py-12">
    <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center mx-auto mb-4 text-stone-400 dark:text-stone-500">
      {icon}
    </div>
    <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">
      {title}
    </h3>
    <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 max-w-md mx-auto">
      {description}
    </p>
    {action}
  </div>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-64 mb-2"></div>
            <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-96"></div>
          </div>
          <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded w-32 mt-4 md:mt-0"></div>
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="p-4 border-b border-stone-200 dark:border-stone-800">
            <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-32"></div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-stone-200 dark:bg-stone-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-3/4"></div>
                    <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2"></div>
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

export default function WorkspaceProjectsPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { workspaceSlug } = resolvedParams;

  const [workspace, setWorkspace] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Enhanced refs to prevent duplicate API calls - Strict Mode compatible
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');
  const currentSlugRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace } = useProjectContext();
  const { isAuthenticated } = useAuth();

  // Store context functions in refs to avoid dependency issues
  const contextFunctionsRef = useRef({
    getWorkspaceBySlug,
    getProjectsByWorkspace,
    isAuthenticated
  });

  // Update refs when context functions change
  useEffect(() => {
    contextFunctionsRef.current = {
      getWorkspaceBySlug,
      getProjectsByWorkspace,
      isAuthenticated
    };
  }, [getWorkspaceBySlug, getProjectsByWorkspace, isAuthenticated]);

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

  const formatStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return { text: "Active", variant: "default" as const };
      case "PLANNING":
        return { text: "Planning", variant: "secondary" as const };
      case "ON_HOLD":
        return { text: "On Hold", variant: "outline" as const };
      case "COMPLETED":
        return { text: "Completed", variant: "secondary" as const };
      default:
        return { text: "Active", variant: "default" as const };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  const fetchData = useCallback(async () => {
    // Generate unique request ID for this page (including path to distinguish between workspace pages)
    const pageKey = `${workspaceSlug}/projects`;
    const requestId = `${pageKey}-${Date.now()}-${Math.random()}`;
    
    // Only prevent if we're truly initialized for this exact page
    if (!isMountedRef.current || 
        (currentSlugRef.current === pageKey && isInitializedRef.current && dataLoaded)) {
      console.log('🚫 [PROJECTS] Skipping fetch - already initialized or unmounted');
      return;
    }

    // Cancel any ongoing request with a small delay to handle rapid mount/unmount cycles
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    requestIdRef.current = requestId;
    currentSlugRef.current = pageKey;
    
    console.log('🔍 [PROJECTS] Initializing data fetch for slug:', workspaceSlug, 'requestId:', requestId);
    
    if (!workspaceSlug || !contextFunctionsRef.current.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDataLoaded(false);
      
      // Double-check we're still the active request
      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        console.log('🚫 [PROJECTS] Request cancelled or component unmounted');
        return;
      }

      console.log('🔍 [PROJECTS] Fetching workspace data for slug:', workspaceSlug);
      const workspaceData = await contextFunctionsRef.current.getWorkspaceBySlug(workspaceSlug);
      
      // Check again if we're still the active request
      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        console.log('🚫 [PROJECTS] Request cancelled after workspace fetch');
        return;
      }

      if (!workspaceData) {
        setError("Workspace not found");
        setIsLoading(false);
        return;
      }
      setWorkspace(workspaceData);

      console.log('🔍 [PROJECTS] Fetching projects for workspace:', workspaceData.id);
      const projectsData = await contextFunctionsRef.current.getProjectsByWorkspace(workspaceData.id);
      
      // Final check if we're still the active request
      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        console.log('🚫 [PROJECTS] Request cancelled after projects fetch');
        return;
      }

      setProjects(projectsData || []);
      setFilteredProjects(projectsData || []);
      
      isInitializedRef.current = true;
      setDataLoaded(true);
      console.log('✅ [PROJECTS] Successfully loaded workspace projects:', { 
        projectCount: projectsData?.length || 0 
      });
      
    } catch (error: any) {
      // Only handle error if we're still the active request
      if (requestIdRef.current === requestId && isMountedRef.current) {
        console.error("❌ [PROJECTS] Error fetching data:", error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          setError("Authentication required. Please log in again.");
        } else {
          setError("Failed to load workspace data");
        }
        isInitializedRef.current = false;
      }
    } finally {
      if (requestIdRef.current === requestId && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [workspaceSlug]); // Only depend on workspaceSlug

  useEffect(() => {
    // Reset initialization when page changes
    const pageKey = `${workspaceSlug}/projects`;
    if (currentSlugRef.current !== pageKey) {
      console.log('📍 [PROJECTS] Page changed, resetting for new page:', pageKey);
      isInitializedRef.current = false;
      setDataLoaded(false);
      setWorkspace(null);
      setProjects([]);
      setFilteredProjects([]);
    }
    
    if (workspaceSlug && !dataLoaded) {
      // Add a small delay to handle rapid mount/unmount cycles
      const timeoutId = setTimeout(() => {
        fetchData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [workspaceSlug, dataLoaded]); // Remove fetchData from dependencies to avoid infinite loops

  // Enhanced cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('🧹 [PROJECTS] Component unmounting, cleaning up');
      isMountedRef.current = false;
      isInitializedRef.current = false;
      currentSlugRef.current = '';
      requestIdRef.current = '';
      
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Enhanced manual retry function that resets refs and triggers fresh fetch
  const retryFetch = useCallback(() => {
    console.log('🔄 [PROJECTS] Manual retry triggered');
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Reset all state
    isInitializedRef.current = false;
    currentSlugRef.current = '';
    requestIdRef.current = '';
    setDataLoaded(false);
    setWorkspace(null);
    setProjects([]);
    setFilteredProjects([]);
    setError(null);
    setIsLoading(true);
    
    // The useEffect will automatically trigger a new fetch
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.key?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading || !dataLoaded) {
    return <LoadingSkeleton />;
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardHeader>
              <CardTitle className="flex items-start gap-3">
                <HiExclamation className="w-5 h-5 text-red-500 mt-0.5" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Error Loading Workspace
                </span>
              </CardTitle>
              <CardDescription className="text-sm text-red-600 dark:text-red-400">
                {error ||
                  "Workspace not found. Please check the URL and try again."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <HiArrowLeft size={12} />
                  Go back
                  </button>
                <button
                  onClick={retryFetch}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Try again
                </button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">
              {workspace.name} Projects
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Manage all projects in the {workspace.name} workspace.
            </p>
          </div>
          <Link href={`/${workspaceSlug}/projects/new`}>
            <Button className="flex items-center gap-2">
              <HiPlus size={14} />
              <span>New Project</span>
            </Button>
          </Link>
        </div>

        {/* Projects Table */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-stone-200 dark:border-stone-800">
            <CardTitle className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Projects ({filteredProjects.length})
            </CardTitle>
            <div className="relative max-w-xs w-full">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                name="search"
                id="search"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 transition-colors"
                placeholder="Search projects..."
              />
            </div>
          </CardHeader>

          <CardContent>
            {filteredProjects.length === 0 ? (
              <EmptyState
                icon={
                  searchQuery ? <HiSearch size={20} /> : <HiFolder size={20} />
                }
                title={searchQuery ? "No matching projects" : "No projects"}
                description={
                  searchQuery
                    ? `No projects match "${searchQuery}". Try a different search term.`
                    : "Get started by creating a new project."
                }
                searchQuery={searchQuery}
                action={!searchQuery ? <></> : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-800">
                <thead className="bg-stone-50 dark:bg-stone-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-[30%]"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-[10%]"
                    >
                      Key
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-[10%]"
                    >
                      Tasks
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-[15%]"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-[15%]"
                    >
                      Updated
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-[20%]"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-stone-900 divide-y divide-stone-200 dark:divide-stone-800">
                  {filteredProjects.map((project) => {
                    const projectSlug = generateProjectSlug(project.name);
                    const status = formatStatus(project.status);

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-normal break-words max-w-[300px]">
                          <div className="flex items-center gap-3">
                            <ProjectAvatar project={project} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                <Link
                                  href={`/${workspaceSlug}/${projectSlug}`}
                                  className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                                >
                                  {project.name}
                                </Link>
                              </div>
                              <div className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                                {project.description ||
                                  `${project.name} project`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="secondary">{project.key}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-stone-500 dark:text-stone-400">
                            {project._count?.tasks || 0} tasks
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={status.variant}>{status.text}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-stone-500 dark:text-stone-400">
                          {formatDate(project.updatedAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/${workspaceSlug}/${projectSlug}`}
                              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1"
                              title="View Project"
                            >
                              <HiEye size={14} />
                            </Link>
                            <Link
                              href={`/${workspaceSlug}/${projectSlug}/settings`}
                              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                              title="Project Settings"
                            >
                              <HiCog size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
