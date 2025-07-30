'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTasks, getProjects } from '@/utils/apiUtils';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskKanbanView from '@/components/tasks/views/TaskKanbanView';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Task } from '@/types/tasks';
import { Project } from '@/types/projects';
import { HiPlus, HiViewColumns } from 'react-icons/hi2';

export default function TasksKanbanPage() {
  const [tasksData, setTasksData] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasks, projectsData] = await Promise.all([getTasks(), getProjects()]);
        setTasksData(tasks);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching tasks or projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const defaultWorkspace = projects[0]?.workspace ?? { slug: 'default-workspace' };
  const defaultProject = projects[0] ?? { slug: 'default-project' };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center py-24">
            <Skeleton className="w-8 h-8 rounded-full animate-spin border-2 border-muted border-t-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <HiViewColumns size={20} />
                My Tasks
              </h1>
              <p className="text-sm text-muted-foreground">
                Organize and track your tasks using the kanban board view.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Select defaultValue="all">
                <SelectTrigger className="min-w-[140px]">
                  <SelectValue placeholder="Filter" />
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
            <span>Kanban Board View</span>
          </div>
        </div>

        <TaskViewTabs currentView="kanban" baseUrl="/tasks" />

        <Card className="p-0">
          <TaskKanbanView tasks={tasksData} projects={projects} />
        </Card>
      </div>
    </div>
  );
}
