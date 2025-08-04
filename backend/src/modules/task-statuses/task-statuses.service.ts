import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskStatusDto } from './dto/create-task-status.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Injectable()
export class TaskStatusesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createTaskStatusDto: CreateTaskStatusDto,
    userId: string,
  ): Promise<TaskStatus> {
    try {
      return await this.prisma.taskStatus.create({
        data: {
          ...createTaskStatusDto,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              description: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          createdByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Status with this name already exists in this workflow',
        );
      }
      throw error;
    }
  }

  async findAll(workflowId?: string): Promise<TaskStatus[]> {
    const whereClause = workflowId ? { workflowId } : {};

    return this.prisma.taskStatus.findMany({
      where: whereClause,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            description: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async findOne(id: string): Promise<TaskStatus> {
    const taskStatus = await this.prisma.taskStatus.findUnique({
      where: { id },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            description: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        fromTransitions: {
          include: {
            toStatus: {
              select: {
                id: true,
                name: true,
                color: true,
                category: true,
              },
            },
          },
        },
        toTransitions: {
          include: {
            fromStatus: {
              select: {
                id: true,
                name: true,
                color: true,
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!taskStatus) {
      throw new NotFoundException('Task status not found');
    }

    return taskStatus;
  }

  async update(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    userId: string,
  ): Promise<TaskStatus> {
    try {
      const taskStatus = await this.prisma.taskStatus.update({
        where: { id },
        data: {
          ...updateTaskStatusDto,
          updatedBy: userId,
        },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              description: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          createdByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      return taskStatus;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Status with this name already exists in this workflow',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Task status not found');
      }
      throw error;
    }
  }
async updatePositions(
  statusUpdates: { id: string; position: number; }[],
  userId: string,
): Promise<TaskStatus[]> {
  try {
    // Use a transaction to ensure all updates happen atomically
    const updatedStatuses = await this.prisma.$transaction(
      statusUpdates.map(({ id, position }) =>
        this.prisma.taskStatus.update({
          where: { id },
          data: {
            position,
            updatedBy: userId,
          },
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
                description: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            createdByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            updatedByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        })
      )
    );

    return updatedStatuses;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new NotFoundException('One or more task statuses not found');
    }
    throw error;
  }
}

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.taskStatus.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Task status not found');
      }
      throw error;
    }
  }
}
