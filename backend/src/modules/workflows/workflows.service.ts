import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Workflow, StatusCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createWorkflowDto: CreateWorkflowDto,
    userId: string,
  ): Promise<Workflow> {
    return this.prisma.$transaction(async (tx) => {
      // If this is set as default, unset other defaults in the same organization
      if (createWorkflowDto.isDefault) {
        await tx.workflow.updateMany({
          where: {
            organizationId: createWorkflowDto.organizationId,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const workflow = await tx.workflow.create({
        data: {
          ...createWorkflowDto,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
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
              statuses: true,
              transitions: true,
            },
          },
        },
      });

      // Create default statuses for new workflow
      const defaultStatuses = [
        {
          name: 'To Do',
          color: '#42526E',
          category: StatusCategory.TODO,
          position: 1,
        },
        {
          name: 'In Progress',
          color: '#0052CC',
          category: StatusCategory.IN_PROGRESS,
          position: 2,
        },
        {
          name: 'Done',
          color: '#00875A',
          category: StatusCategory.DONE,
          position: 3,
        },
      ];

      await tx.taskStatus.createMany({
        data: defaultStatuses.map((status) => ({
          ...status,
          workflowId: workflow.id,
          createdBy: userId,
          updatedBy: userId,
        })),
      });

      return workflow;
    });
  }

  async findAll(organizationId?: string): Promise<Workflow[]> {
    const whereClause = organizationId ? { organizationId } : {};

    return this.prisma.workflow.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            statuses: true,
            transitions: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Workflow> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        statuses: {
          orderBy: {
            position: 'asc',
          },
        },
        transitions: {
          include: {
            fromStatus: {
              select: {
                id: true,
                name: true,
                color: true,
                category: true,
              },
            },
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
        _count: {
          select: {
            statuses: true,
            transitions: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async update(
    id: string,
    updateWorkflowDto: UpdateWorkflowDto,
    userId: string,
  ): Promise<Workflow> {
    return this.prisma.$transaction(async (tx) => {
      // If this is set as default, unset other defaults in the same organization
      if (updateWorkflowDto.isDefault) {
        const currentWorkflow = await tx.workflow.findUnique({
          where: { id },
          select: { organizationId: true },
        });

        if (currentWorkflow) {
          await tx.workflow.updateMany({
            where: {
              organizationId: currentWorkflow.organizationId,
              isDefault: true,
              id: { not: id },
            },
            data: { isDefault: false },
          });
        }
      }

      try {
        const workflow = await tx.workflow.update({
          where: { id },
          data: {
            ...updateWorkflowDto,
            updatedBy: userId,
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
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
                statuses: true,
                transitions: true,
              },
            },
          },
        });

        return workflow;
      } catch (error) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Workflow not found');
        }
        throw error;
      }
    });
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.workflow.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Workflow not found');
      }
      throw error;
    }
  }

  async getDefaultWorkflow(organizationId: string): Promise<Workflow | null> {
    return this.prisma.workflow.findFirst({
      where: {
        organizationId,
        isDefault: true,
      },
      include: {
        statuses: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }
}
