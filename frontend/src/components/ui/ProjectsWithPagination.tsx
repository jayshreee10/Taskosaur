import React, { useState } from "react";
import Link from "next/link";
import { HiPlus, HiFolder, HiExternalLink } from "react-icons/hi";
import { Badge, Button } from "@/components/ui";
import { Pagination } from "@/components/ui/pagination";

interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  workspaceId: string;
}

interface ProjectsWithPaginationProps {
  projects: Project[];
  workspaceSlug: string;
  getStatusVariant: (status: string) => string;
  generateProjectSlug: (name: string) => string;
}

const PAGE_SIZE = 3;

const ProjectsWithPagination: React.FC<ProjectsWithPaginationProps> = ({
  projects,
  workspaceSlug,
  getStatusVariant,
  generateProjectSlug,
}) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(projects.length / PAGE_SIZE);
  const paginatedProjects = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-[var(--card)] rounded-[var(--card-radius)] shadow-sm">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
            <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">Projects</h3>
          </div>
          <Link href={`/${workspaceSlug}/projects`} className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary)]/90 flex items-center gap-1">
            View all <HiExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-gray-500 ml-3">All projects in this workspace</p>
      </div>
      <div className="px-4 pb-4">
        {projects.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <div className="w-12 h-12 mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
              <HiFolder className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-[var(--accent-foreground)] mb-1">No projects found</p>
            <p className="text-xs text-gray-500 mb-3">Create your first project to get started.</p>
            <Link href={`/${workspaceSlug}/projects/new`} className="w-full flex justify-center">
              <Button
                variant="default"
                className="relative h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-sm hover:shadow-md transition-all duration-200 font-medium rounded-lg flex items-center gap-1 text-xs mx-auto"
              >
                <HiPlus className="w-3 h-3" />
                New Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedProjects.map((project) => (
              <div key={project.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg px-2 py-1 cursor-pointer">
                    {project.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--accent-foreground)] truncate">{project.name}</p>
                  <div className="project-meta">
                    <Badge
                      variant={getStatusVariant(project.status) as any}
                      className="capitalize"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <Link
                  href={`/${workspaceSlug}/${generateProjectSlug(project.name)}`}
                  className="project-link text-xs text-[var(--primary)] hover:underline"
                >
                  View
                </Link>
              </div>
            ))}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsWithPagination;
