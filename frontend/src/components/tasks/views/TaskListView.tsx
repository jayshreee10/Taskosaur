'use client';
import TaskTable from '@/components/ui/tables/TaskTable';
import { Task } from '@/utils/api';

interface TaskListViewProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
}

export default function TaskListView({
  tasks,
  workspaceSlug,
  projectSlug,
  projects
}: TaskListViewProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border-none overflow-hidden">
      <TaskTable
        tasks={tasks}
        workspaceSlug={workspaceSlug}
        projectSlug={projectSlug}
        projects={projects}
        showProject={!projectSlug}
      />
    </div>
  );
}