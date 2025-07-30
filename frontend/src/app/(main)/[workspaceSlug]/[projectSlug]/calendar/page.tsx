import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getWorkspaceBySlug, getProjectBySlug } from '@/utils/mockData';

interface Props {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export default async function ProjectCalendarPage(props: Props) {
  const params = await props.params;
  const { workspaceSlug, projectSlug } = params;
  
  // Fetch workspace data
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    notFound();
  }
  
  // Fetch project data
  const project = await getProjectBySlug(projectSlug);
  if (!project || project.workspace.slug !== workspaceSlug) {
    notFound();
  }
  
  // Redirect to the tasks page with calendar view
  redirect(`/${workspaceSlug}/${projectSlug}/tasks?view=calendar`);
}