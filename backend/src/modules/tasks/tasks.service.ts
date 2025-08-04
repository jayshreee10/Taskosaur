import { Injectable, NotFoundException } from '@nestjs/common';
import { Task, TaskPriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const project = await this.prisma.project.findUnique({
      where: { id: createTaskDto.projectId },
      select: { slug: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const sprintResult = await this.prisma.sprint.findFirst({where:{isDefault: true}})
    const sprintId = sprintResult?.id || null
    const taskCount = await this.prisma.task.count({
      where: { projectId: createTaskDto.projectId },
    });

    const taskNumber = taskCount + 1;
    const key = `${project.slug}-${taskNumber}`;

    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        createdBy: userId,
        taskNumber,
        slug: key,
        sprintId: sprintId,
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

  async findByOrganization(
    orgId: string,
    assigneeId?: string,
    priority?: TaskPriority,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    tasks: Task[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });

    const workspaceIds = workspaces.map((w) => w.id);
    if (workspaceIds.length === 0) {
      return {
        tasks: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const projects = await this.prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) {
      return {
        tasks: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    // Build whereClause
    const whereClause: any = {
      projectId: { in: projectIds },
    };

    // Priority filter
    if (priority) {
      whereClause.priority = priority;
    }

    // Search filter - ✅ Removed 'key' field
    if (search && search.trim()) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        // ❌ Removed key field since it doesn't exist
      ];
    }

    // Handle user filters with search
    if (assigneeId) {
      const userFilters = [
        { assigneeId: assigneeId },
        { reporterId: assigneeId },
        // ❌ Removed createdBy since it doesn't exist in Task model
      ];

      if (search && search.trim()) {
        // Combine search OR conditions with user AND conditions
        whereClause.AND = [
          { OR: whereClause.OR }, // Search conditions
          { OR: userFilters }, // User conditions
        ];
        delete whereClause.OR; // Remove top-level OR since we're using AND
      } else {
        // No search, just user filters
        whereClause.OR = userFilters;
      }
    }

    // ✅ Fixed count query - removed select parameter
    const totalCount = await this.prisma.task.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
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
      skip,
      take: limit,
    });

    return {
      tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findTodaysTasks(
    organizationId: string,
    filters: {
      assigneeId?: string;
      reporterId?: string;
      userId?: string;
    } = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    tasks: Task[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    // Get today's date range (start and end of today)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get workspaces for the organization
    const workspaces = await this.prisma.workspace.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const workspaceIds = workspaces.map((w) => w.id);
    if (workspaceIds.length === 0) {
      return {
        tasks: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const projects = await this.prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) {
      return {
        tasks: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    // Build where clause
    const whereClause: any = {
      projectId: { in: projectIds },
      OR: [
        // Tasks due today
        {
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        // Tasks created today
        {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        // Tasks updated today
        {
          updatedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        // Tasks completed today
        {
          completedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      ],
    };
    const userFilters: any[] = [];

    if (filters.assigneeId) {
      userFilters.push({ assigneeId: filters.assigneeId });
    }

    if (filters.reporterId) {
      userFilters.push({ reporterId: filters.reporterId });
    }

    if (filters.userId) {
      userFilters.push(
        { assigneeId: filters.userId },
        { reporterId: filters.userId },
        { createdBy: filters.userId },
      );
    }

    if (userFilters.length > 0) {
      whereClause.AND = [{ OR: whereClause.OR }, { OR: userFilters }];
      delete whereClause.OR;
    }

    // Get total count and paginated results
    const [totalCount, tasks] = await Promise.all([
      this.prisma.task.count({ where: whereClause }),
      this.prisma.task.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              workspace: {
                select: {
                  id: true,
                  name: true,
                  organizationId: true,
                },
              },
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
              email: true, // ✅ Added email for consistency
            },
          },
          status: {
            select: { id: true, name: true, color: true, category: true },
          },
          sprint: {
            select: { id: true, name: true, status: true },
          },
          parentTask: {
            select: { id: true, title: true, type: true }, // ✅ Added key field
          },
          _count: {
            select: { childTasks: true, comments: true, timeEntries: true },
          },
        },
        orderBy: [
          { dueDate: 'asc' }, // Tasks due soon first
          { updatedAt: 'desc' }, // Recently updated tasks
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // src/modules/tasks/tasks.service.ts
async addComment(taskId: string, comment: string, userId: string) {
  // First, verify the task exists
  const task = await this.prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true },
  });

  if (!task) {
    throw new NotFoundException('Task not found');
  }

  // Create the comment (assuming you have a TaskComment model)
  const newComment = await this.prisma.taskComment.create({
    data: {
      content: comment,
      taskId: taskId,
      authorId: userId,
    },
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
  });

  return newComment;
}

}
