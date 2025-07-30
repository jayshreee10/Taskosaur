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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <div className="w-12 h-12 bg-[var(--muted)] rounded-lg flex items-center justify-center mx-auto mb-4 text-[var(--muted-foreground)]">
      {icon}
    </div>
    <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
      {title}
    </h3>
    <p className="text-xs text-[var(--muted-foreground)] mb-4 max-w-md mx-auto">
      {description}
    </p>
    {action}
  </div>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <div className="h-6 bg-[var(--muted)] rounded w-64 mb-2"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-96"></div>
          </div>
          <div className="h-8 bg-[var(--muted)] rounded w-32 mt-4 md:mt-0"></div>
        </div>
        <Card className="overflow-hidden ">
          <CardHeader className="p-4 ">
            <div className="h-5 bg-[var(--muted)] rounded w-32"></div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-[var(--muted)] rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[var(--muted)] rounded w-3/4"></div>
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

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');
  const currentSlugRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace } = useProjectContext();
  const { isAuthenticated } = useAuth();

  const contextFunctionsRef = useRef({
    getWorkspaceBySlug,
    getProjectsByWorkspace,
    isAuthenticated
  });

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
    const pageKey = `${workspaceSlug}/projects`;
    const requestId = `${pageKey}-${Date.now()}-${Math.random()}`;
    
    if (!isMountedRef.current || 
        (currentSlugRef.current === pageKey && isInitializedRef.current && dataLoaded)) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    requestIdRef.current = requestId;
    currentSlugRef.current = pageKey;
    
    if (!workspaceSlug || !contextFunctionsRef.current.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDataLoaded(false);
      
      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        return;
      }

      const workspaceData = await contextFunctionsRef.current.getWorkspaceBySlug(workspaceSlug);
      
      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        return;
      }

      if (!workspaceData) {
        setError("Workspace not found");
        setIsLoading(false);
        return;
      }
      setWorkspace(workspaceData);

      const projectsData = await contextFunctionsRef.current.getProjectsByWorkspace(workspaceData.id);
      
      if (requestIdRef.current !== requestId || !isMountedRef.current) {
        return;
      }

      setProjects(projectsData || []);
      setFilteredProjects(projectsData || []);
      
      isInitializedRef.current = true;
      setDataLoaded(true);
      
    } catch (error: any) {
      if (requestIdRef.current === requestId && isMountedRef.current) {
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
  }, [workspaceSlug]);

  useEffect(() => {
    const pageKey = `${workspaceSlug}/projects`;
    if (currentSlugRef.current !== pageKey) {
      isInitializedRef.current = false;
      setDataLoaded(false);
      setWorkspace(null);
      setProjects([]);
      setFilteredProjects([]);
    }
    
    if (workspaceSlug && !dataLoaded) {
      const timeoutId = setTimeout(() => {
        fetchData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [workspaceSlug, dataLoaded]);

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

  const retryFetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    isInitializedRef.current = false;
    currentSlugRef.current = '';
    requestIdRef.current = '';
    setDataLoaded(false);
    setWorkspace(null);
    setProjects([]);
    setFilteredProjects([]);
    setError(null);
    setIsLoading(true);
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
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <Card className=" bg-[var(--destructive)]/5">
            <CardHeader>
              <CardTitle className="flex items-start gap-3">
                <HiExclamation className="w-5 h-5 text-[var(--destructive)] mt-0.5" />
                <span className="text-sm font-semibold text-[var(--destructive)]">
                  Error Loading Workspace
                </span>
              </CardTitle>
              <CardDescription className="text-sm text-[var(--destructive)]">
                {error ||
                  "Workspace not found. Please check the URL and try again."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 hover:underline flex items-center gap-1 transition-colors"
                >
                  <HiArrowLeft size={12} />
                  Go back
                </button>
                <button
                  onClick={retryFetch}
                  className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 hover:underline transition-colors"
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">
              {workspace.name} Projects
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage all projects in the {workspace.name} workspace.
            </p>
          </div>
          <Link href={`/${workspaceSlug}/projects/new`}>
            <Button className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90">
              <HiPlus size={14} />
              <span>New Project</span>
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden border-none">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 ">
            <CardTitle className="text-sm font-semibold text-[var(--foreground)]">
              Projects ({filteredProjects.length})
            </CardTitle>
            <div className="relative max-w-xs w-full">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                type="text"
                name="search"
                id="search"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
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
              <div className="rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Name</TableHead>
                      <TableHead className="w-[10%]">Key</TableHead>
                      <TableHead className="w-[10%]">Tasks</TableHead>
                      <TableHead className="w-[15%]">Status</TableHead>
                      <TableHead className="w-[15%]">Updated</TableHead>
                      <TableHead className="text-right w-[20%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const projectSlug = generateProjectSlug(project.name);
                      const status = formatStatus(project.status);

                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <ProjectAvatar project={project} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-[var(--foreground)]">
                                  <Link
                                    href={`/${workspaceSlug}/${projectSlug}`}
                                    className="hover:text-[var(--primary)] transition-colors"
                                  >
                                    {project.name}
                                  </Link>
                                </div>
                                <div className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                                  {project.description ||
                                    `${project.name} project`}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{project.key}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {project._count?.tasks || 0} tasks
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.text}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-[var(--muted-foreground)]">
                            {formatDate(project.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/${workspaceSlug}/${projectSlug}`}
                                className="text-[var(--primary)] hover:text-[var(--primary)]/80 p-1 transition-colors"
                                title="View Project"
                              >
                                <HiEye size={14} />
                              </Link>
                              <Link
                                href={`/${workspaceSlug}/${projectSlug}/settings`}
                                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 transition-colors"
                                title="Project Settings"
                              >
                                <HiCog size={14} />
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}