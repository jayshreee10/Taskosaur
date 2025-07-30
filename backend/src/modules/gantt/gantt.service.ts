import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface GanttTask {
  id: string;
  title: string;
  start: Date | null;
  end: Date | null;
  progress: number;
  dependencies: string[];
  assignee: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
  priority: string;
  status: {
    name: string;
    color: string;
  };
  type: string;
  key: string;
  parent?: string;
  children?: GanttTask[];
}

export interface GanttData {
  tasks: GanttTask[];
  timeline: {
    start: Date;
    end: Date;
    duration: number; // in days
  };
  criticalPath: string[];
  milestones: {
    id: string;
    title: string;
    date: Date;
    type: 'sprint_start' | 'sprint_end' | 'project_milestone';
  }[];
}

@Injectable()
export class GanttService {
  constructor(private prisma: PrismaService) {}

  async getProjectGanttData(projectId: string): Promise<GanttData> {
    // Fetch all project data
    const [project, tasks, sprints, dependencies] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),
      this.prisma.task.findMany({
        where: { projectId },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          status: {
            select: { name: true, color: true },
          },
          dependsOn: {
            include: {
              blockingTask: {
                select: { id: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.sprint.findMany({
        where: { projectId },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      }),
      this.prisma.taskDependency.findMany({
        where: {
          dependentTask: { projectId },
        },
        select: {
          dependentTaskId: true,
          blockingTaskId: true,
          type: true,
        },
      }),
    ]);

    if (!project) {
      throw new Error('Project not found');
    }

    // Transform tasks to Gantt format
    const ganttTasks: GanttTask[] = tasks.map((task) => {
      const progress = this.calculateTaskProgress(task.status.name);
      const dependencies = task.dependsOn.map((dep) => dep.blockingTask.id);

      return {
        id: task.id,
        title: task.title,
        start: task.startDate,
        end: task.dueDate,
        progress,
        dependencies,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              name: `${task.assignee.firstName} ${task.assignee.lastName}`,
              avatar: task.assignee.avatar || undefined,
            }
          : null,
        priority: task.priority,
        status: task.status,
        type: task.type,
        key: task.slug,
        parent: task.parentTaskId || undefined,
      };
    });

    // Build task hierarchy
    const taskMap = new Map(ganttTasks.map((task) => [task.id, task]));
    const rootTasks: GanttTask[] = [];

    ganttTasks.forEach((task) => {
      if (task.parent) {
        const parent = taskMap.get(task.parent);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(task);
        }
      } else {
        rootTasks.push(task);
      }
    });

    // Calculate timeline
    const timeline = this.calculateTimeline(ganttTasks, project);

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(ganttTasks, dependencies);

    // Generate milestones
    const milestones = this.generateMilestones(sprints);

    return {
      tasks: rootTasks,
      timeline,
      criticalPath,
      milestones,
    };
  }

  async getSprintGanttData(sprintId: string): Promise<GanttData> {
    const [sprint, tasks] = await Promise.all([
      this.prisma.sprint.findUnique({
        where: { id: sprintId },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          projectId: true,
        },
      }),
      this.prisma.task.findMany({
        where: { sprintId },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          status: {
            select: { name: true, color: true },
          },
          dependsOn: {
            include: {
              blockingTask: {
                select: { id: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const ganttTasks: GanttTask[] = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      start: task.startDate || sprint.startDate,
      end: task.dueDate || sprint.endDate,
      progress: this.calculateTaskProgress(task.status.name),
      dependencies: task.dependsOn.map((dep) => dep.blockingTask.id),
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: `${task.assignee.firstName} ${task.assignee.lastName}`,
            avatar: task.assignee.avatar || undefined,
          }
        : null,
      priority: task.priority,
      status: task.status,
      type: task.type,
      key: task.slug,
    }));

    const timeline = this.calculateTimeline(ganttTasks, sprint);
    const criticalPath = this.calculateCriticalPath(ganttTasks, []);

    return {
      tasks: ganttTasks,
      timeline,
      criticalPath,
      milestones: [
        {
          id: sprint.id,
          title: `${sprint.name} Start`,
          date: sprint.startDate!,
          type: 'sprint_start',
        },
        {
          id: `${sprint.id}_end`,
          title: `${sprint.name} End`,
          date: sprint.endDate!,
          type: 'sprint_end',
        },
      ],
    };
  }

  async getResourceAllocation(projectId: string): Promise<any> {
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        assigneeId: { not: null },
        startDate: { not: null },
        dueDate: { not: null },
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Group tasks by assignee
    const resourceMap = new Map();

    tasks.forEach((task) => {
      if (!task.assignee) return;

      const assigneeId = task.assignee.id;
      if (!resourceMap.has(assigneeId)) {
        resourceMap.set(assigneeId, {
          assignee: {
            id: task.assignee.id,
            name: `${task.assignee.firstName} ${task.assignee.lastName}`,
            avatar: task.assignee.avatar,
          },
          tasks: [],
          workload: 0,
        });
      }

      const resource = resourceMap.get(assigneeId);
      resource.tasks.push({
        id: task.id,
        title: task.title,
        start: task.startDate,
        end: task.dueDate,
        storyPoints: task.storyPoints || 1,
      });

      // Calculate workload (could be based on story points, time estimates, etc.)
      resource.workload += task.storyPoints || 1;
    });

    return Array.from(resourceMap.values());
  }

  private calculateTaskProgress(statusName: string): number {
    // Map status names to progress percentages
    const statusProgressMap: { [key: string]: number } = {
      'To Do': 0,
      TODO: 0,
      Backlog: 0,
      'In Progress': 50,
      IN_PROGRESS: 50,
      Review: 80,
      REVIEW: 80,
      Testing: 90,
      TESTING: 90,
      Done: 100,
      DONE: 100,
      Completed: 100,
      COMPLETED: 100,
    };

    return statusProgressMap[statusName] || 0;
  }

  private calculateTimeline(
    tasks: GanttTask[],
    project: any,
  ): { start: Date; end: Date; duration: number } {
    const taskDates = tasks
      .filter((task) => task.start && task.end)
      .flatMap((task) => [task.start!, task.end!]);

    const projectStart = project.startDate;
    const projectEnd = project.endDate;

    const allDates = [
      ...taskDates,
      ...(projectStart ? [projectStart] : []),
      ...(projectEnd ? [projectEnd] : []),
    ];

    if (allDates.length === 0) {
      const now = new Date();
      return {
        start: now,
        end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        duration: 30,
      };
    }

    const start = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const end = new Date(Math.max(...allDates.map((d) => d.getTime())));
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    );

    return { start, end, duration };
  }

  private calculateCriticalPath(
    tasks: GanttTask[],
    dependencies: any[],
  ): string[] {
    // Simplified critical path calculation
    // In a real implementation, you'd use CPM (Critical Path Method) algorithm

    const taskMap = new Map(tasks.map((task) => [task.id, task]));
    const criticalTasks: string[] = [];

    // Find tasks with no dependencies that have the longest duration
    const rootTasks = tasks.filter((task) => task.dependencies.length === 0);

    // For now, return the longest sequence of dependent tasks
    let longestPath: string[] = [];

    rootTasks.forEach((rootTask) => {
      const path = this.findLongestPath(rootTask, taskMap, dependencies);
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    });

    return longestPath;
  }

  private findLongestPath(
    task: GanttTask,
    taskMap: Map<string, GanttTask>,
    dependencies: any[],
  ): string[] {
    const path = [task.id];

    // Find tasks that depend on this task
    const dependentTasks = dependencies
      .filter((dep) => dep.blockingTaskId === task.id)
      .map((dep) => taskMap.get(dep.dependentTaskId))
      .filter(Boolean);

    if (dependentTasks.length === 0) {
      return path;
    }

    // Recursively find the longest path from dependent tasks
    let longestSubPath: string[] = [];
    dependentTasks.forEach((depTask) => {
      const subPath = this.findLongestPath(depTask!, taskMap, dependencies);
      if (subPath.length > longestSubPath.length) {
        longestSubPath = subPath;
      }
    });

    return [...path, ...longestSubPath];
  }

  private generateMilestones(sprints: any[]): any[] {
    const milestones: any[] = [];

    sprints.forEach((sprint) => {
      if (sprint.startDate) {
        milestones.push({
          id: sprint.id,
          title: `${sprint.name} Start`,
          date: sprint.startDate,
          type: 'sprint_start',
        });
      }

      if (sprint.endDate) {
        milestones.push({
          id: `${sprint.id}_end`,
          title: `${sprint.name} End`,
          date: sprint.endDate,
          type: 'sprint_end',
        });
      }
    });

    return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
