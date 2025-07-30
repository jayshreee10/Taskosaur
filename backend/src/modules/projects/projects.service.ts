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
    try {
      return await this.prisma.project.create({
        data: {
          ...createProjectDto,
          slug,
          createdBy: userId,
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
        tasks: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            priority: true,
            status: {
              select: {
                id: true,
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
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            taskNumber: 'desc',
          },
        },
        sprints: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        },
        labels: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
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
}
