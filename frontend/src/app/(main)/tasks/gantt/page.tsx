import Link from 'next/link';
import { getTasks, getProjects } from '@/utils/apiUtils';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskGanttView from '@/components/tasks/views/TaskGanttView';
import { HiPlus } from 'react-icons/hi2';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default async function TasksGanttPage() {
  const tasksData = await getTasks();
  const projects = await getProjects();

  const defaultWorkspace = projects.length > 0 ? projects[0].workspace : { slug: 'default-workspace' };
  const defaultProject = projects.length > 0 ? projects[0] : { slug: 'default-project' };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              My Tasks
            </h1>
            <p className="text-sm text-muted-foreground">
              View project timelines and task dependencies using the Gantt chart.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Select defaultValue="all">
              <SelectTrigger className="min-w-[140px]">
                <SelectValue placeholder="Filter tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="assigned">Assigned to me</SelectItem>
                <SelectItem value="created">Created by me</SelectItem>
                <SelectItem value="subscribed">Subscribed</SelectItem>
              </SelectContent>
            </Select>

            <Link href={`/${defaultWorkspace.slug}/${defaultProject.slug}/tasks/new`}>
              <Button className="flex items-center gap-2">
                <HiPlus size={16} />
                Add Task
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-sm text-muted-foreground flex gap-4">
          <span>{tasksData?.length || 0} tasks</span>
          <span>•</span>
          <span>Timeline View</span>
        </div>

        <TaskViewTabs currentView="gantt" baseUrl="/tasks" />

        <Card>
          <CardContent className="p-0">
            <TaskGanttView
              tasks={tasksData}
              workspaceSlug={defaultWorkspace.slug}
              projectSlug={defaultProject.slug}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
