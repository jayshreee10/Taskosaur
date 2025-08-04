import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import slugify from 'slugify';
import { DEFAULT_SPRINT } from '../../constants/defaultWorkflow';
@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    // Use slug from DTO
    const baseSlug = slugify(createProjectDto.slug, {
      lower: true,
      strict: true,
    });
    let slug = baseSlug;

    // Find all projects with similar slug
    const existing = await this.prisma.project.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
    });

    if (existing.length > 0) {
      let maxSuffix = 0;
      existing.forEach((p) => {
        const match = p.slug.match(new RegExp(`^${baseSlug}-(\\d+)$`));
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSuffix) maxSuffix = num;
        }
      });
      slug = `${baseSlug}-${maxSuffix + 1}`;
    }

    // Fetch workspace to get organization ID
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: createProjectDto.workspaceId },
      select: { organizationId: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Find the default workflow for the organization
    const defaultWorkflow = await this.prisma.workflow.findFirst({
      where: {
        organizationId: workspace.organizationId,
        isDefault: true,
      },
    });

    if (!defaultWorkflow) {
      throw new NotFoundException(
        'Default workflow not found for organization',
      );
    }

    try {
      return await this.prisma.project.create({
        data: {
          ...createProjectDto,
          slug,
          workflowId: defaultWorkflow.id,
          createdBy: userId,
          updatedBy: userId,
          // Create default sprint inline
          sprints: {
            create: {
              name: DEFAULT_SPRINT.name,
              goal: DEFAULT_SPRINT.goal,
              status: DEFAULT_SPRINT.status,
              isDefault: DEFAULT_SPRINT.isDefault,
              createdBy: userId,
              updatedBy: userId,
            },
          },
        },
        include: {
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
          workflow: {
            select: {
              id: true,
              name: true,
              isDefault: true,
              statuses: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  category: true,
                  position: true,
                },
                orderBy: { position: 'asc' },
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
          sprints: {
            select: {
              id: true,
              name: true,
              goal: true,
              status: true,
              startDate: true,
              endDate: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              members: true,
              tasks: true,
              sprints: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Project with this key already exists in this workspace',
        );
      }
      throw error;
    }
  }

  async findAll(workspaceId?: string): Promise<Project[]> {
    const whereClause = workspaceId ? { workspaceId } : {};

    return this.prisma.project.findMany({
      where: whereClause,
      include: {
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
        _count: {
          select: {
            members: true,
            tasks: true,
            sprints: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
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
        workflow: {
          select: {
            id: true,
            name: true,
            isDefault: true,
            statuses: {
              select: {
                id: true,
                name: true,
                color: true,
                category: true,
                position: true,
              },
              orderBy: { position: 'asc' },
            },
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
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async findByKey(workspaceId: string, key: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug: key,
        },
      },
      include: {
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
        _count: {
          select: {
            members: true,
            tasks: true,
            sprints: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async findBySlug(slug: string) {
    return this.prisma.project.findUnique({
      where: { slug },
      include: {
        workspace: true,
        members: true,
        labels: true,
        sprints: true,
        tasks: true,
      },
    });
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: {
          ...updateProjectDto,
          updatedBy: userId,
        },
        include: {
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
              tasks: true,
              sprints: true,
            },
          },
        },
      });

      return project;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Project with this key already exists in this workspace',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }
  // Simple search without pagination
  async findBySearch(
    workspaceId?: string,
    organizationId?: string,
    search?: string,
  ): Promise<Project[]> {
    const whereClause: any = {};

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    } else if (organizationId) {
      whereClause.workspace = {
        organizationId,
      };
    }

    // Add search filter
    if (search && search.trim()) {
      whereClause.OR = [
        {
          name: {
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
        {
          key: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.project.findMany({
      where: whereClause,
      include: {
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
        _count: {
          select: {
            members: true,
            tasks: true,
            sprints: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Search with pagination
  async findWithPagination(
    workspaceId?: string,
    organizationId?: string,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    projects: Project[];
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

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    } else if (organizationId) {
      whereClause.workspace = {
        organizationId,
      };
    }

    // Add search filter
    if (search && search.trim()) {
      whereClause.OR = [
        {
          name: {
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
        {
          key: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get total count and paginated results
    const [totalCount, projects] = await Promise.all([
      this.prisma.project.count({ where: whereClause }),
      this.prisma.project.findMany({
        where: whereClause,
        include: {
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
          _count: {
            select: {
              members: true,
              tasks: true,
              sprints: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      projects,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
