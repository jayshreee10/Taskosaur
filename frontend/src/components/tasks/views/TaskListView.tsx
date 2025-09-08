import TaskTable from "@/components/ui/tables/TaskTable";
import { ColumnConfig, Task } from "@/types";

interface TaskListViewProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
  projectsOfCurrentWorkspace?: any[];
  onTaskRefetch?: () => void;
  columns?: ColumnConfig[];
  showAddTaskRow?: boolean;
  addTaskPriorities?: any[];
  addTaskStatuses?: any[];
  projectMembers?: any[];
  workspaceMembers?: any[];
}

export default function TaskListView({
  tasks,
  workspaceSlug,
  projectSlug,
  projects,
  projectsOfCurrentWorkspace,
  onTaskRefetch,
  columns,
  showAddTaskRow,

  addTaskStatuses,
  projectMembers,
  workspaceMembers,
}: TaskListViewProps) {

 

  return (
    <div className="rounded-md">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground"></div>
      </div>
      <TaskTable
        tasks={tasks}
        workspaceSlug={workspaceSlug}
        projectSlug={projectSlug}
        projects={projects}
        projectsOfCurrentWorkspace={projectsOfCurrentWorkspace}
        showProject={!projectSlug}
        columns={columns}
        onTaskRefetch={onTaskRefetch}
        showAddTaskRow={showAddTaskRow}
        addTaskStatuses={addTaskStatuses}
        projectMembers={projectMembers}
        workspaceMembers={workspaceMembers}
      />
    </div>
  );
}
