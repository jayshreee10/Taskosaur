'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { getTasks, getProjects, getProjectBySlug } from '@/utils/apiUtils';
import { Task } from '@/types/tasks';
import { Project } from '@/types/projects';

import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskCalendarView from '@/components/tasks/views/TaskCalendarView';

import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function ProjectTasksCalendarPage() {
  const { slug } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [tasksData, projectsData, projectData] = await Promise.all([
          getTasks(),
          getProjects(),
          getProjectBySlug(slug as string),
        ]);

        const projectTasks = tasksData.filter(task => task.projectId === projectData?.id);

        setTasks(projectTasks);
        setProjects(projectsData);
        setCurrentProject(projectData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const defaultWorkspace = currentProject?.workspace || { slug: 'default-workspace' };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-96 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-semibold text-foreground">Project not found</h2>
        <p className="text-muted-foreground mt-2">
          The project you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {currentProject.name} Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tasks in this project
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="assigned">Assigned to me</SelectItem>
              <SelectItem value="created">Created by me</SelectItem>
              <SelectItem value="subscribed">Subscribed</SelectItem>
            </SelectContent>
          </Select>

          <Link href={`/${defaultWorkspace.slug}/${currentProject.slug}/tasks/new`} passHref>
            <Button>Add Task</Button>
          </Link>
        </div>
      </div>

      <TaskViewTabs currentView="calendar" baseUrl={`/projects/${slug}/tasks`} />

      <Card className="p-4">
        <TaskCalendarView
          tasks={tasks}
          workspaceSlug={defaultWorkspace.slug}
          projectSlug={currentProject.slug}
        />
      </Card>
    </div>
  );
}
