import { Injectable, NotFoundException } from '@nestjs/common';
import { Task } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const project = await this.prisma.project.findUnique({
      where: { id: createTaskDto.projectId },
      select: { slug: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const taskCount = await this.prisma.task.count({
      where: { projectId: createTaskDto.projectId },
    });

    const taskNumber = taskCount + 1;
    const key = `${project.slug}-${taskNumber}`;

    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        taskNumber,
        slug: key,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            category: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            childTasks: true,
            comments: true,
            attachments: true,
            watchers: true,
          },
        },
      },
    });
  }

  async findAll(
    projectId?: string,
    sprintId?: string,
    workspaceId?: string,
    parentTaskId?: string, // ADDED: Support for parentTaskId filtering
  ): Promise<Task[]> {
    const whereClause: any = {};

    // Handle workspace filtering
    if (workspaceId) {
      // First, verify workspace exists
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true },
      });

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      // Get all projects under this workspace
      const projects = await this.prisma.project.findMany({
        where: { workspaceId },
        select: { id: true },
      });

      const projectIds = projects.map((project) => project.id);

      // Filter tasks by these project IDs
      whereClause.projectId = {
        in: projectIds,
      };
    } else {
      // Handle existing project and sprint filtering
      if (projectId) whereClause.projectId = projectId;
      if (sprintId) whereClause.sprintId = sprintId;
    }

    // ADDED: Handle parentTaskId filtering for main tasks vs subtasks
    if (parentTaskId !== undefined) {
      if (
        parentTaskId === 'null' ||
        parentTaskId === '' ||
        parentTaskId === null
      ) {
        // For main tasks (no parent) - tasks that are not subtasks
        whereClause.parentTaskId = null;
      } else {
        // For subtasks (with specific parent) - tasks that belong to a parent task
        whereClause.parentTaskId = parentTaskId;
      }
    }

    return this.prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            category: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        parentTask: {
          // ADDED: Include parent task info for subtasks
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            childTasks: true,
            comments: true,
          },
        },
      },
      orderBy: {
        taskNumber: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            category: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
        childTasks: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            priority: true,
            status: {
              select: {
                name: true,
                color: true,
                category: true,
              },
            },
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        labels: {
          include: {
            label: {
              select: {
                id: true,
                name: true,
                color: true,
                description: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        },
        _count: {
          select: {
            childTasks: true,
            comments: true,
            attachments: true,
            watchers: true,
            timeEntries: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async findByKey(key: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { slug: key },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            category: true,
          },
        },
        parentTask: {
          // ADDED: Include parent task info
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            childTasks: true,
            comments: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    try {
      const task = await this.prisma.task.update({
        where: { id },
        data: updateTaskDto,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          status: {
            select: {
              id: true,
              name: true,
              color: true,
              category: true,
            },
          },
          parentTask: {
            // ADDED: Include parent task info
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
            },
          },
          _count: {
            select: {
              childTasks: true,
              comments: true,
            },
          },
        },
      });

      return task;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // ENHANCED: Check if task has subtasks before deletion
      const taskWithSubtasks = await this.prisma.task.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              childTasks: true,
            },
          },
        },
      });

      if (!taskWithSubtasks) {
        throw new NotFoundException('Task not found');
      }

      // Optional: Prevent deletion if task has subtasks
      // Uncomment the following lines if you want to prevent deletion of tasks with subtasks
      /*
      if (taskWithSubtasks._count.childTasks > 0) {
        throw new ConflictException('Cannot delete task that has subtasks. Delete subtasks first.');
      }
      */

      await this.prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }

  // ADDED: New method to get subtasks for a specific parent task
  async findSubtasksByParent(parentTaskId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        parentTaskId: parentTaskId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            category: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            childTasks: true,
            comments: true,
          },
        },
      },
      orderBy: {
        taskNumber: 'asc',
      },
    });
  }

  // ADDED: New method to get only main tasks (no parent)
  async findMainTasks(
    projectId?: string,
    workspaceId?: string,
  ): Promise<Task[]> {
    const whereClause: any = {
      parentTaskId: null, // Only main tasks
    };

    if (workspaceId) {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true },
      });

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      const projects = await this.prisma.project.findMany({
        where: { workspaceId },
        select: { id: true },
      });

      const projectIds = projects.map((project) => project.id);
      whereClause.projectId = { in: projectIds };
    } else if (projectId) {
      whereClause.projectId = projectId;
    }

    return this.prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            category: true,
          },
        },
        _count: {
          select: {
            childTasks: true,
            comments: true,
          },
        },
      },
      orderBy: {
        taskNumber: 'desc',
      },
    });
  }

  async findByOrganization(orgId: string): Promise<Task[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });
    const workspaceIds = workspaces.map((w) => w.id);
    if (workspaceIds.length === 0) return [];
    const projects = await this.prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) return [];
    return this.prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        reporter: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        status: {
          select: { id: true, name: true, color: true, category: true },
        },
        sprint: { select: { id: true, name: true, status: true } },
        parentTask: {
          select: { id: true, title: true, slug: true, type: true },
        },
        _count: { select: { childTasks: true, comments: true } },
      },
      orderBy: { taskNumber: 'desc' },
    });
  }
}
