'use client';
import { Task } from '@/types';
import TaskTable from '@/components/ui/tables/TaskTable';

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
    <div className="bg-white dark:bg-stone-900 rounded-lg  overflow-hidden">
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