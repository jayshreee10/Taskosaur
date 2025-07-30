"use client";

import MembersManager from "@/components/shared/MembersManager";

interface ProjectMembersProps {
  projectId: string;
  organizationId: string;
  workspaceId: string;
  className?: string;
}

export default function ProjectMembers({
  projectId,
  organizationId,
  workspaceId,
  className = "",
}: ProjectMembersProps) {
  return (
    <MembersManager
      type="project"
      entityId={projectId}
      organizationId={organizationId}
      workspaceId={workspaceId}
      className={className}
    />
  );
}
