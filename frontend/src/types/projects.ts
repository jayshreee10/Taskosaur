/**
 * Types related to Projects
 */

export interface Project {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  workspace: {
    slug: string;
    id: string;
    name: string;
  };
}