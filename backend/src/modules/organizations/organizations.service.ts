import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Organization } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    try {
      return await this.prisma.organization.create({
        data: {
          ...createOrganizationDto,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
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
              members: true,
              workspaces: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Organization with this slug already exists',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            workspaces: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        workspaces: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
            color: true,
            _count: {
              select: {
                projects: true,
                members: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            workspaces: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            workspaces: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    try {
      const organization = await this.prisma.organization.update({
        where: { id },
        data: {
          ...updateOrganizationDto,
          updatedBy: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
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
              members: true,
              workspaces: true,
            },
          },
        },
      });

      return organization;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Organization with this slug already exists',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Organization not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.organization.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Organization not found');
      }
      throw error;
    }
  }

  async getOrganizationStats(organizationId: string) {
  const organization = await this.prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, slug: true },
  });

  if (!organization) {
    throw new Error('Organization not found');
  }
  const activeProjects = await this.prisma.project.count({
    where: {
      workspace: {
        organizationId,
      },
      status: 'ACTIVE',
    },
  });

  // Get total workspaces count
  const totalWorkspaces = await this.prisma.workspace.count({
    where: { organizationId },
  });
  const taskStats = await this.prisma.task.groupBy({
    by: ['statusId'],
    where: {
      project: {
        workspace: {
          organizationId,
        },
      },
    },
    _count: {
      id: true,
    },
  });
  const statusCategories = await this.prisma.taskStatus.findMany({
    where: {
      workflow: {
        organizationId,
      },
    },
    select: {
      id: true,
      category: true,
    },
  });
  const statusCategoryMap = new Map(
    statusCategories.map(status => [status.id, status.category])
  );

  // Calculate task counts
  let totalTasks = 0;
  let openTasks = 0;
  let completedTasks = 0;

  taskStats.forEach(stat => {
    const count = stat._count.id;
    totalTasks += count;

    const category = statusCategoryMap.get(stat.statusId);
    if (category === 'DONE') {
      completedTasks += count;
    } else {
      openTasks += count;
    }
  });

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    statistics: {
      totalTasks,
      openTasks,
      completedTasks,
      activeProjects,
      totalWorkspaces,
    },
  };
}

}
