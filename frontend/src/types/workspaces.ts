/**
 * Types related to Workspaces
 */

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  description: string;
  projectCount: number;
  memberCount: number;
  recentActivity: string;
  avatar?: string;
  organizationId: string;
}