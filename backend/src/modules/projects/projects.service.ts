import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Project, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import slugify from 'slugify';
import { DEFAULT_SPRINT } from '../../constants/defaultWorkflow';
import { AccessControlService } from 'src/common/access-control.utils';

type ProjectFilters = {
  organizationId: string;
  workspaceId?: string;
  status?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
};

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService, private accessControl: AccessControlService) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    // Verify workspace exists and user has access
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: createProjectDto.workspaceId },
      select: {
        organizationId: true,
        organization: { select: { ownerId: true } },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    // Check if user can create projects in this workspace
    if (workspace.organization.ownerId !== userId) {
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: workspace.organizationId,
          },
        },
        select: { role: true },
      });

      const wsMember = await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: createProjectDto.workspaceId,
          },
        },
        select: { role: true },
      });

      const canCreate =
        orgMember?.role === Role.MANAGER ||
        orgMember?.role === Role.OWNER ||
        wsMember?.role === Role.MANAGER ||
        wsMember?.role === Role.OWNER;

      if (!canCreate) {
        throw new ForbiddenException(
          'Insufficient permissions to create project in this workspace',
        );
      }
    }

    // Generate unique slug
    const baseSlug = slugify(createProjectDto.slug, {
      lower: true,
      strict: true,
    });
    let slug = baseSlug;

    const existing = await this.prisma.project.findMany({
      where: { slug: { startsWith: baseSlug } },
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

    // Get default workflow
    const defaultWorkflow = await this.prisma.workflow.findFirst({
      where: { organizationId: workspace.organizationId, isDefault: true },
    });

    if (!defaultWorkflow) {
      throw new NotFoundException(
        'Default workflow not found for organization',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            ...createProjectDto,
            slug,
            workflowId: createProjectDto.workflowId || defaultWorkflow.id,
            createdBy: userId,
            updatedBy: userId,
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
                  select: { id: true, name: true, slug: true },
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
            _count: { select: { members: true, tasks: true, sprints: true } },
          },
        });

        // Add creator as project member with MANAGER role
        await tx.projectMember.create({
          data: {
            userId,
            projectId: project.id,
            role: Role.MANAGER,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        return project;
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Project with this key already exists in this workspace',
        );
      }
      throw error;
    }
  }

  async findAll(workspaceId?: string, userId?: string): Promise<Project[]> {
    if (!userId) {
      throw new ForbiddenException('User context required');
    }

    const whereClause: any = { archive: false };

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
      // Add access filtering based on user membership
      whereClause.OR = [
        { workspace: { organization: { ownerId: userId } } },
        { workspace: { organization: { members: { some: { userId } } } } },
        { workspace: { members: { some: { userId } } } },
        { members: { some: { userId } } },
      ];
    } else {
      // Show only projects user has access to
      whereClause.OR = [
        { workspace: { organization: { ownerId: userId } } },
        { workspace: { organization: { members: { some: { userId } } } } },
        { workspace: { members: { some: { userId } } } },
        { members: { some: { userId } } },
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
              select: { id: true, name: true, slug: true },
            },
          },
        },
        members: userId
          ? {
              where: { userId },
              select: { role: true },
            }
          : false,
        _count: { select: { members: true, tasks: true, sprints: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrganizationId(
    filters: ProjectFilters,
    userId: string,
  ): Promise<Project[]> {
    const {
      organizationId,
      workspaceId,
      status,
      priority,
      page = 1,
      pageSize = 10,
    } = filters;

    // Check organization access
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    if (!org) throw new NotFoundException('Organization not found');

    const isOwner = org.ownerId === userId;
    let hasOrgAccess = isOwner;

    if (!isOwner) {
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
      });
      hasOrgAccess = !!orgMember;
    }

    if (!hasOrgAccess) {
      throw new ForbiddenException('No access to this organization');
    }

    const whereClause: any = {
      workspace: { organizationId },
      archive: false,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(workspaceId && { workspaceId }),
    };

    // If not elevated, filter to user's projects only
    if (!isOwner) {
      const orgMember = await this.prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
        select: { role: true },
      });

      const isElevated =
        orgMember?.role === Role.MANAGER || orgMember?.role === Role.OWNER;

      if (!isElevated) {
        whereClause.OR = [
          { workspace: { members: { some: { userId } } } },
          { members: { some: { userId } } },
        ];
      }
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
              select: { id: true, name: true, slug: true },
            },
          },
        },
        members: userId
          ? {
              where: { userId },
              select: { role: true },
            }
          : false,
        _count: { select: { members: true, tasks: true, sprints: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const { isElevated } = await this.accessControl.getProjectAccess(id, userId);

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            organization: {
              select: { id: true, name: true, slug: true },
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
        // Show tasks based on access level
        tasks: isElevated
          ? {
              select: {
                id: true,
                title: true,
                type: true,
                priority: true,
                status: true,
              },
              take: 10,
            }
          : {
              select: {
                id: true,
                title: true,
                type: true,
                priority: true,
                status: true,
              },
              where: { OR: [{ assigneeId: userId }, { reporterId: userId }] },
              take: 10,
            },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async findByKey(
    workspaceId: string,
    key: string,
    userId: string,
  ): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: key } },
      select: { id: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    // Check access
    await this.accessControl.getProjectAccess(project.id, userId);

    return this.findOne(project.id, userId);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    const { isElevated } = await this.accessControl.getProjectAccess(id, userId);

    if (!isElevated) {
      throw new ForbiddenException(
        'Insufficient permissions to update project',
      );
    }

    try {
      return await this.prisma.project.update({
        where: { id },
        data: { ...updateProjectDto, updatedBy: userId },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              organization: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          createdByUser: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          updatedByUser: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: { select: { members: true, tasks: true, sprints: true } },
        },
      });
    } catch (error: any) {
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

  async remove(id: string, userId: string): Promise<void> {
    const { role } = await this.accessControl.getProjectAccess(id, userId);

    if (role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can delete projects');
    }

    try {
      await this.prisma.project.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }

  async archiveProject(id: string, userId: string): Promise<void> {
    const { isElevated } = await this.accessControl.getProjectAccess(id, userId);

    if (!isElevated) {
      throw new ForbiddenException(
        'Insufficient permissions to archive project',
      );
    }

    try {
      await this.prisma.project.update({
        where: { id },
        data: { archive: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }

  // Chart methods with role-based filtering
  async projectTaskStatusFlow(projectSlug: string, userId: string) {
    console.log(projectSlug)
    const { isElevated } = await this.accessControl.getProjectAccessBySlug(
      projectSlug,
      userId,
    );

    const project = await this.prisma.project.findUnique({
      where: { slug: projectSlug },
      include: {
        workflow: {
          include: {
            statuses: {
              select: {
                id: true,
                name: true,
                color: true,
                category: true,
                position: true,
                _count: {
                  select: {
                    tasks: {
                      where: {
                        slug: projectSlug,
                        ...(isElevated
                          ? {}
                          : {
                              OR: [
                                { assigneeId: userId },
                                { reporterId: userId },
                              ],
                            }),
                      },
                    },
                  },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!project?.workflow) {
      throw new NotFoundException('Project workflow not found');
    }

    return project.workflow.statuses.map((status) => ({
      statusId: status.id,
      count: status._count.tasks,
      status: {
        id: status.id,
        name: status.name,
        color: status.color,
        category: status.category,
        position: status.position,
      },
    }));
  }

  async projectTaskTypeDistribution(projectSlug: string, userId: string) {
    const { isElevated } = await this.accessControl.getProjectAccessBySlug(
      projectSlug,
      userId,
    );

    const projectResult = await this.prisma.project.findUnique({
      where: { slug: projectSlug },
    });

    const taskWhere = {
      projectId: projectResult?.id,
      ...(isElevated
        ? {}
        : { OR: [{ assigneeId: userId }, { reporterId: userId }] }),
    };

    return this.prisma.task.groupBy({
      by: ['type'],
      where: taskWhere,
      _count: { type: true },
    });
  }

  async projectKPIMetrics(projectSlug: string, userId: string) {
    const { isElevated } = await this.accessControl.getProjectAccessBySlug(
      projectSlug,
      userId,
    );
    const projectResult = await this.prisma.project.findUnique({
      where: { slug: projectSlug },
    });
    const taskWhere = {
      projectId: projectResult?.id,
      ...(isElevated
        ? {}
        : { OR: [{ assigneeId: userId }, { reporterId: userId }] }),
    };

    const [totalTasks, completedTasks, activeSprints, totalBugs, resolvedBugs] =
      await Promise.all([
        this.prisma.task.count({ where: taskWhere }),
        this.prisma.task.count({
          where: { ...taskWhere, completedAt: { not: null } },
        }),
        this.prisma.sprint.count({
          where: {
            projectId: projectResult?.id,
            archive: false,
            status: 'ACTIVE',
          },
        }),
        this.prisma.task.count({ where: { ...taskWhere, type: 'BUG' } }),
        this.prisma.task.count({
          where: { ...taskWhere, type: 'BUG', completedAt: { not: null } },
        }),
      ]);

    return {
      totalTasks,
      completedTasks,
      activeSprints,
      totalBugs,
      resolvedBugs,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      bugResolutionRate: totalBugs > 0 ? (resolvedBugs / totalBugs) * 100 : 0,
    };
  }

  async projectTaskPriorityDistribution(projectSlug: string, userId: string) {
    const { isElevated } = await this.accessControl.getProjectAccessBySlug(
      projectSlug,
      userId,
    );

    const projectResult = await this.prisma.project.findUnique({
      where: { slug: projectSlug },
    });

    const taskWhere = {
      projectId: projectResult?.id,
      ...(isElevated
        ? {}
        : { OR: [{ assigneeId: userId }, { reporterId: userId }] }),
    };

    return this.prisma.task.groupBy({
      by: ['priority'],
      where: taskWhere,
      _count: { priority: true },
    });
  }

  async projectSprintVelocityTrend(projectSlug: string, userId: string) {
    const { isElevated } = await this.accessControl.getProjectAccessBySlug(
      projectSlug,
      userId,
    );

    const projectResult = await this.prisma.project.findUnique({
      where: { slug: projectSlug },
    });

    const sprints = await this.prisma.sprint.findMany({
      where: {
        projectId: projectResult?.id,
        status: 'COMPLETED',
        archive: false,
      },
      include: {
        tasks: {
          where: {
            completedAt: { not: null },
            ...(isElevated
              ? {}
              : { OR: [{ assigneeId: userId }, { reporterId: userId }] }),
          },
          select: { storyPoints: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return sprints.map((sprint) => ({
      ...sprint,
      velocity: sprint.tasks.reduce(
        (sum, task) => sum + (task.storyPoints || 0),
        0,
      ),
    }));
  }

  async projectSprintBurndown(
    sprintId: string,
    projectSlug: string,
    userId: string,
  ) {

    const { isElevated } = await this.accessControl.getProjectAccessBySlug(
      projectSlug,
      userId,
    );

    return this.prisma.task.findMany({
      where: {
        sprintId,
        project: { archive: false },
        sprint: { archive: false },
        ...(isElevated
          ? {}
          : { OR: [{ assigneeId: userId }, { reporterId: userId }] }),
      },
      select: {
        completedAt: true,
        storyPoints: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Additional helper methods for search functionality
  async findBySearch(
    workspaceId?: string,
    organizationId?: string,
    search?: string,
    userId?: string,
  ): Promise<Project[]> {
    if (!userId) {
      throw new ForbiddenException('User context required');
    }

    const whereClause: any = { archive: false };

    // Add scope filtering
    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    } else if (organizationId) {
      whereClause.workspace = { organizationId };
    }

    // Add user access filtering
    whereClause.OR = [
      { workspace: { organization: { ownerId: userId } } },
      { workspace: { organization: { members: { some: { userId } } } } },
      { workspace: { members: { some: { userId } } } },
      { members: { some: { userId } } },
    ];

    // Add search filter
    if (search && search.trim()) {
      const searchConditions = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];

      whereClause.AND = [{ OR: whereClause.OR }, { OR: searchConditions }];
      delete whereClause.OR;
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
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: { select: { members: true, tasks: true, sprints: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithPagination(
    workspaceId?: string,
    organizationId?: string,
    search?: string,
    page: number = 1,
    limit: number = 10,
    userId?: string,
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
    if (!userId) {
      throw new ForbiddenException('User context required');
    }

    const whereClause: any = { archive: false };

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    } else if (organizationId) {
      whereClause.workspace = { organizationId };
    }

    // Add user access filtering
    whereClause.OR = [
      { workspace: { organization: { ownerId: userId } } },
      { workspace: { organization: { members: { some: { userId } } } } },
      { workspace: { members: { some: { userId } } } },
      { members: { some: { userId } } },
    ];

    if (search && search.trim()) {
      const searchConditions = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];

      whereClause.AND = [{ OR: whereClause.OR }, { OR: searchConditions }];
      delete whereClause.OR;
    }

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
                select: { id: true, name: true, slug: true },
              },
            },
          },
          _count: { select: { members: true, tasks: true, sprints: true } },
        },
        orderBy: { createdAt: 'desc' },
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

  async getProjectBySlug(slug: string, userId: string): Promise<Project | null> {
    // Find project by slug
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        members: {
          select: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                status: true,
                lastLoginAt: true,
              },
            },
            role: true,
          },
        },
        _count: { select: { members: true, tasks: true, sprints: true } },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    // Optionally, add access control here if needed
    return project;
  }
}
