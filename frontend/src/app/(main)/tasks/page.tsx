import Link from 'next/link';
import { getTasks, getProjects } from '@/utils/apiUtils';

import TaskListView from '@/components/tasks/views/TaskListView';

import {
  HiPlus,
  HiClipboardDocumentList,
} from 'react-icons/hi2';

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default async function TasksPage() {
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
              <HiClipboardDocumentList size={20} />
              My Tasks
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and track all your assigned tasks in one place.
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

        <div className="text-sm text-muted-foreground">
          {tasksData?.length || 0} tasks
        </div>

        {tasksData && tasksData.length > 0 ? (
          <TaskListView tasks={tasksData} projects={projects} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <HiClipboardDocumentList
                size={48}
                className="mx-auto text-muted-foreground mb-4"
              />
              <CardTitle className="text-sm font-medium mb-2">
                No tasks yet
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mb-6">
                Create your first task to get started with project management.
              </CardDescription>
              <Link href={`/${defaultWorkspace.slug}/${defaultProject.slug}/tasks/new`}>
                <Button className="flex items-center gap-2">
                  <HiPlus size={16} />
                  Create Task
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
