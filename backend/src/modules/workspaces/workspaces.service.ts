import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Workspace } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createWorkspaceDto: CreateWorkspaceDto,
    userId: string,
  ): Promise<Workspace> {
    try {
      return await this.prisma.workspace.create({
        data: {
          ...createWorkspaceDto,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
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
              projects: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Workspace with this slug already exists in this organization',
        );
      }
      throw error;
    }
  }

  async findAll(
    organizationId?: string,
    search?: string,
  ): Promise<Workspace[]> {
    const whereClause: any = {};

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }
    if (search && search.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }
    return this.prisma.workspace.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async findWithPagination(
    organizationId?: string,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    workspaces: Workspace[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    // Build where clause
    const whereClause: any = {};

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    // Add search filter
    if (search && search.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await this.prisma.workspace.count({
      where: whereClause,
    });

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Get paginated workspaces
    const workspaces = await this.prisma.workspace.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      workspaces,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
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
        projects: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
            color: true,
            status: true,
            priority: true,
            _count: {
              select: {
                tasks: true,
                members: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async findBySlug(organizationId: string, slug: string): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
    userId: string,
  ): Promise<Workspace> {
    try {
      const workspace = await this.prisma.workspace.update({
        where: { id },
        data: {
          ...updateWorkspaceDto,
          updatedBy: userId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
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
              projects: true,
            },
          },
        },
      });

      return workspace;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Workspace with this slug already exists in this organization',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Workspace not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.workspace.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Workspace not found');
      }
      throw error;
    }
  }
}
