import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from '@prisma/client';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Scope } from 'src/common/decorator/scope.decorator';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workspaces')
@Scope('ORGANIZATION', 'organizationId')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  // Only ORG MANAGER/OWNER can create workspaces
  @Post()
  @Roles(Role.MANAGER, Role.OWNER)
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.create(createWorkspaceDto, user.id);
  }

  // All members can view, but filtered by their membership
  @Get()
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  @Scope('ORGANIZATION', 'organizationId')
  findAll(
    @CurrentUser() user: any,
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string,
  ) {
    return this.workspacesService.findAll(user.id, organizationId, search);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search workspaces without pagination' })
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  searchWorkspaces(
    @CurrentUser() user: any,
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string,
  ) {
    return this.workspacesService.findAll(user.id, organizationId, search);
  }

  @Get('search/paginated')
  @ApiOperation({ summary: 'Search workspaces with pagination' })
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  searchWorkspacesWithPagination(
    @CurrentUser() user: any,
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const validatedPage = Math.max(1, pageNum);
    const validatedLimit = Math.min(Math.max(1, limitNum), 100);

    return this.workspacesService.findWithPagination(
      user.id,
      organizationId,
      search,
      validatedPage,
      validatedLimit,
    );
  }

  @Get(':id')
  @Scope('WORKSPACE', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.workspacesService.findOne(id, user.id);
  }

  @Get('recent/:workspaceId')
  @ApiOperation({ summary: 'Get recent activity for workspace' })
  @Scope('WORKSPACE', 'workspaceId')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getWorkspaceRecentActivity(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query('limit') limit: string = '10',
    @Query('page') page: string = '1',
    @CurrentUser() user: any,
  ) {
    const limitNum = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;
    const validatedLimit = Math.min(Math.max(1, limitNum), 50);
    const validatedPage = Math.max(1, pageNum);

    return this.activityLogService.getRecentActivityByWorkspaceOptimized(
      workspaceId,
      validatedLimit,
      validatedPage,
    );
  }

  @Get('organization/:organizationId/slug/:slug')
  @Scope('ORGANIZATION', 'organizationId')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  findBySlug(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.findBySlug(organizationId, slug, user.id);
  }

  @Patch(':id')
  @Scope('WORKSPACE', 'id')
  @Roles(Role.MANAGER, Role.OWNER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.update(id, updateWorkspaceDto, user.id);
  }

  @Delete(':id')
  @Scope('WORKSPACE', 'id')
  @Roles(Role.OWNER)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.remove(id);
  }

  @Patch('archive/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Scope('WORKSPACE', 'id')
  @Roles(Role.MANAGER, Role.OWNER)
  archiveWorkspace(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.archiveWorkspace(id);
  }

  // Chart endpoints - require workspace membership
  @Get('organization/:organizationId/workspace/:slug/charts/project-status')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getProjectStatusDistribution(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.workspaceProjectStatusDistribution(
      organizationId,
      slug,
      user.id,
    );
  }

  @Get('organization/:organizationId/workspace/:slug/charts/task-priority')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getTaskPriorityBreakdown(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.workspaceTaskPriorityBreakdown(
      organizationId,
      slug,
      user.id,
    );
  }

  @Get('organization/:organizationId/workspace/:slug/charts/kpi-metrics')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getKPIMetrics(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.workspaceKPIMetrics(
      organizationId,
      slug,
      user.id,
    );
  }

  @Get('organization/:organizationId/workspace/:slug/charts/task-type')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getTaskTypeDistribution(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.workspaceTaskTypeDistribution(
      organizationId,
      slug,
      user.id,
    );
  }

  @Get('organization/:organizationId/workspace/:slug/charts/sprint-status')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getSprintStatusOverview(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.workspaceSprintStatusOverview(
      organizationId,
      slug,
      user.id,
    );
  }

  @Get('organization/:organizationId/workspace/:slug/charts/monthly-completion')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getMonthlyTaskCompletion(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.workspaceMonthlyTaskCompletion(
      organizationId,
      slug,
      user.id,
    );
  }
}
