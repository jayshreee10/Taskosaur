import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Role = 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';

@Injectable()
export class OrganizationChartsService {
  constructor(private prisma: PrismaService) {}

  private async getOrgAccess(
    orgId: string,
    userId: string,
  ): Promise<{ isElevated: boolean; role: Role }> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { ownerId: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    if (org.ownerId === userId) {
      return { isElevated: true, role: 'OWNER' };
    }

    const member = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      select: { role: true },
    });

    if (!member)
      throw new ForbiddenException('Not a member of this organization');

    const isElevated = member.role === 'MANAGER' || member.role === 'OWNER';
    return { isElevated, role: member.role as Role };
  }

  // Reusable scoped where fragments when not elevated
  // - Projects: user must be a member
  // - Workspaces: user must be a member
  // - Tasks: assigned to or reported by the user
  private userScopedWhere(orgId: string, userId: string) {
    return {
      workspaceForUser: {
        organizationId: orgId,
        archive: false,
        members: { some: { userId } },
      },
      projectForUser: {
        archive: false,
        workspace: { organizationId: orgId, archive: false },
        members: { some: { userId } },
      },
      taskForUser: {
        project: { workspace: { organizationId: orgId }, archive: false },
        OR: [{ assigneeId: userId }, { reporterId: userId }],
      },
      sprintForUser: {
        archive: false,
        project: {
          archive: false,
          workspace: { organizationId: orgId, archive: false },
          members: { some: { userId } },
        },
      },
    };
  }

  // 1) KPI Metrics
  async organizationKPIMetrics(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    const now = new Date();

    if (isElevated) {
      const [
        totalWorkspaces,
        activeWorkspaces,
        totalProjects,
        activeProjects,
        completedProjects,
        totalMembers,
        totalTasks,
        completedTasks,
        overdueTasks,
        totalBugs,
        resolvedBugs,
        activeSprints,
      ] = await Promise.all([
        this.prisma.workspace.count({
          where: { organizationId: orgId, archive: false },
        }),
        this.prisma.workspace.count({
          where: { organizationId: orgId, archive: false },
        }),
        this.prisma.project.count({
          where: { workspace: { organizationId: orgId }, archive: false },
        }),
        this.prisma.project.count({
          where: {
            workspace: { organizationId: orgId },
            archive: false,
            status: 'ACTIVE',
          },
        }),
        this.prisma.project.count({
          where: {
            workspace: { organizationId: orgId },
            archive: false,
            status: 'COMPLETED',
          },
        }),
        this.prisma.organizationMember.count({
          where: { organizationId: orgId },
        }),
        this.prisma.task.count({
          where: {
            project: { workspace: { organizationId: orgId }, archive: false },
          },
        }),
        this.prisma.task.count({
          where: {
            project: { workspace: { organizationId: orgId }, archive: false },
            completedAt: { not: null },
          },
        }),
        this.prisma.task.count({
          where: {
            project: { workspace: { organizationId: orgId }, archive: false },
            dueDate: { lt: now },
            completedAt: null,
          },
        }),
        this.prisma.task.count({
          where: {
            project: { workspace: { organizationId: orgId }, archive: false },
            type: 'BUG',
          },
        }),
        this.prisma.task.count({
          where: {
            project: { workspace: { organizationId: orgId }, archive: false },
            type: 'BUG',
            completedAt: { not: null },
          },
        }),
        this.prisma.sprint.count({
          where: {
            project: { workspace: { organizationId: orgId }, archive: false },
            status: 'ACTIVE',
            archive: false,
          },
        }),
      ]);

      return {
        totalWorkspaces,
        activeWorkspaces,
        totalProjects,
        activeProjects,
        completedProjects,
        totalMembers,
        totalTasks,
        completedTasks,
        overdueTasks,
        totalBugs,
        resolvedBugs,
        activeSprints,
        projectCompletionRate:
          totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
        taskCompletionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        bugResolutionRate: totalBugs > 0 ? (resolvedBugs / totalBugs) * 100 : 0,
        overallProductivity:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      };
    }

    // Non-elevated: user-scoped
    const scoped = this.userScopedWhere(orgId, userId);

    const [
      totalWorkspaces,
      activeWorkspaces,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalBugs,
      resolvedBugs,
      activeSprints,
    ] = await Promise.all([
      this.prisma.workspace.count({ where: scoped.workspaceForUser }),
      this.prisma.workspace.count({ where: scoped.workspaceForUser }),
      this.prisma.project.count({ where: scoped.projectForUser }),
      this.prisma.project.count({
        where: { ...scoped.projectForUser, status: 'ACTIVE' },
      }),
      this.prisma.project.count({
        where: { ...scoped.projectForUser, status: 'COMPLETED' },
      }),
      this.prisma.task.count({ where: scoped.taskForUser }),
      this.prisma.task.count({
        where: { ...scoped.taskForUser, completedAt: { not: null } },
      }),
      this.prisma.task.count({
        where: {
          ...scoped.taskForUser,
          dueDate: { lt: now },
          completedAt: null,
        },
      }),
      this.prisma.task.count({ where: { ...scoped.taskForUser, type: 'BUG' } }),
      this.prisma.task.count({
        where: {
          ...scoped.taskForUser,
          type: 'BUG',
          completedAt: { not: null },
        },
      }),
      this.prisma.sprint.count({
        where: { ...scoped.sprintForUser, status: 'ACTIVE' },
      }),
    ]);

    return {
      totalWorkspaces,
      activeWorkspaces,
      totalProjects,
      activeProjects,
      completedProjects,
      totalMembers: 1,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalBugs,
      resolvedBugs,
      activeSprints,
      projectCompletionRate:
        totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      taskCompletionRate:
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      bugResolutionRate: totalBugs > 0 ? (resolvedBugs / totalBugs) * 100 : 0,
      overallProductivity:
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  // 2) Project Portfolio
  async organizationProjectPortfolio(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    const base = { workspace: { organizationId: orgId }, archive: false };
    const where = isElevated
      ? base
      : { ...base, members: { some: { userId } } };

    return this.prisma.project.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });
  }

  // 3) Team Utilization (roles distribution)
  async organizationTeamUtilization(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    if (isElevated) {
      return this.prisma.organizationMember.groupBy({
        by: ['role'],
        where: { organizationId: orgId },
        _count: { role: true },
      });
    }
    const me = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      select: { role: true },
    });
    return me ? [{ role: me.role, _count: { role: 1 } }] : [];
  }

  // 4) Task Distribution by Priority
  async organizationTaskDistribution(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    const base = {
      project: { workspace: { organizationId: orgId }, archive: false },
    };
    const where = isElevated
      ? base
      : { ...base, OR: [{ assigneeId: userId }, { reporterId: userId }] };

    return this.prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });
  }

  // 5) Task Type Distribution
  async organizationTaskTypeDistribution(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    const base = {
      project: { workspace: { organizationId: orgId }, archive: false },
    };
    const where = isElevated
      ? base
      : { ...base, OR: [{ assigneeId: userId }, { reporterId: userId }] };

    return this.prisma.task.groupBy({
      by: ['type'],
      where,
      _count: { type: true },
    });
  }

  // 6) Sprint Metrics
  async organizationSprintMetrics(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    const base = {
      archive: false,
      project: { workspace: { organizationId: orgId }, archive: false },
    };
    const where = isElevated
      ? base
      : {
          ...base,
          project: { ...base.project, members: { some: { userId } } },
        };

    return this.prisma.sprint.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });
  }

  // 7) Quality Metrics (bugs)
  async organizationQualityMetrics(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    const base = {
      project: { workspace: { organizationId: orgId }, archive: false },
      type: 'BUG' as const,
    };
    const where = isElevated
      ? base
      : { ...base, OR: [{ assigneeId: userId }, { reporterId: userId }] };

    const [totalBugs, resolvedBugs, criticalBugs, resolvedCriticalBugs] =
      await Promise.all([
        this.prisma.task.count({ where }),
        this.prisma.task.count({
          where: { ...where, completedAt: { not: null } },
        }),
        this.prisma.task.count({
          where: { ...where, priority: { in: ['HIGH', 'HIGHEST'] } },
        }),
        this.prisma.task.count({
          where: {
            ...where,
            priority: { in: ['HIGH', 'HIGHEST'] },
            completedAt: { not: null },
          },
        }),
      ]);

    return {
      totalBugs,
      resolvedBugs,
      criticalBugs,
      resolvedCriticalBugs,
      bugResolutionRate: totalBugs > 0 ? (resolvedBugs / totalBugs) * 100 : 0,
      criticalBugResolutionRate:
        criticalBugs > 0 ? (resolvedCriticalBugs / criticalBugs) * 100 : 0,
    };
  }

  // 8) Workspace Project Count
  async organizationWorkspaceProjectCount(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    const workspaceWhere = isElevated
      ? { organizationId: orgId, archive: false }
      : {
          organizationId: orgId,
          archive: false,
          members: { some: { userId } },
        };

    const workspaces = await this.prisma.workspace.findMany({
      where: workspaceWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { projects: { where: { archive: false } } } },
      },
      orderBy: { projects: { _count: 'desc' } },
    });

    return workspaces.map((w) => ({
      workspaceId: w.id,
      workspaceName: w.name,
      workspaceSlug: w.slug,
      projectCount: w._count.projects,
    }));
  }

  // 9) Member Workload Distribution
  async organizationMemberWorkload(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);

    const userWhere = isElevated
      ? { organizationMembers: { some: { organizationId: orgId } } }
      : {
          id: userId,
          organizationMembers: { some: { organizationId: orgId } },
        };

    const members = await this.prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            assignedTasks: {
              where: {
                project: {
                  workspace: { organizationId: orgId },
                  archive: false,
                },
                completedAt: null,
              },
            },
            reportedTasks: {
              where: {
                project: {
                  workspace: { organizationId: orgId },
                  archive: false,
                },
              },
            },
          },
        },
      },
      orderBy: isElevated ? { assignedTasks: { _count: 'desc' } } : undefined,
    });

    return members.map((m) => ({
      memberId: m.id,
      memberName: `${m.firstName} ${m.lastName}`,
      activeTasks: m._count.assignedTasks,
      reportedTasks: m._count.reportedTasks,
    }));
  }

  // 10) Resource Allocation Matrix
  async organizationResourceAllocation(orgId: string, userId: string) {
    const { isElevated } = await this.getOrgAccess(orgId, userId);
    const where = isElevated
      ? { workspace: { organizationId: orgId } }
      : { workspace: { organizationId: orgId, members: { some: { userId } } } };

    return this.prisma.workspaceMember.groupBy({
      by: ['workspaceId', 'role'],
      where,
      _count: { role: true },
      orderBy: [{ workspaceId: 'asc' }, { role: 'asc' }],
    });
  }
}
