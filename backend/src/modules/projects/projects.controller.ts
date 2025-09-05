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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { LogActivity } from 'src/common/decorator/log-activity.decorator';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Scope } from 'src/common/decorator/scope.decorator';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Create project - requires MANAGER/OWNER at workspace level
  @Post()
  @Roles(Role.MANAGER, Role.OWNER)
  @LogActivity({
    type: 'PROJECT_CREATED',
    entityType: 'Project',
    description: 'Created a new project',
    includeNewValue: true,
  })
  create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  // List all projects - filtered by user access
  @Get()
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  findAll(@CurrentUser() user: any, @Query('workspaceId') workspaceId?: string) {
    return this.projectsService.findAll(workspaceId, user.id);
  }

  @Get('/by-organization')
  @Scope('ORGANIZATION', 'organizationId')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  findByOrganizationId(
    @CurrentUser() user: any,
    @Query('organizationId') organizationId: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      organizationId,
      workspaceId,
      status,
      priority,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    };
    return this.projectsService.findByOrganizationId(filters, user.id);
  }

  // Search projects
  @Get('search')
  @ApiOperation({ summary: 'Search projects without pagination' })
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  searchProjects(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string,
  ) {
    return this.projectsService.findBySearch(workspaceId, organizationId, search, user.id);
  }

  // Search with pagination
  @Get('search/paginated')
  @ApiOperation({ summary: 'Search projects with pagination' })
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  searchProjectsWithPagination(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.projectsService.findWithPagination(
      workspaceId,
      organizationId,
      search,
      pageNum,
      limitNum,
      user.id
    );
  }

  // Find by workspace and key - requires workspace access
  @Get('workspace/:workspaceId/key/:key')
  @Scope('WORKSPACE', 'workspaceId')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  findByKey(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('key') key: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.findByKey(workspaceId, key, user.id);
  }

  // Find project by ID - requires project access
  @Get(':id')
  @Scope('PROJECT', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projectsService.findOne(id, user.id);
  }

  // Update project - requires MANAGER/OWNER
  @Patch(':id')
  @Scope('PROJECT', 'id')
  @Roles(Role.MANAGER, Role.OWNER)
  @LogActivity({
    type: 'PROJECT_UPDATED',
    entityType: 'Project',
    description: 'Updated project details',
    includeOldValue: true,
    includeNewValue: true,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.update(id, updateProjectDto, user.id);
  }

  // Delete project - OWNER only
  @Delete(':id')
  @Scope('PROJECT', 'id')
  @Roles(Role.OWNER)
  @LogActivity({
    type: 'PROJECT_DELETED',
    entityType: 'Project',
    description: 'Deleted a project',
    includeOldValue: true,
    includeNewValue: false,
  })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projectsService.remove(id, user.id);
  }

  // Archive project - MANAGER/OWNER
  @Patch('archive/:id')
  @Scope('PROJECT', 'id')
  @Roles(Role.MANAGER, Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveProject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projectsService.archiveProject(id, user.id);
  }

  // Chart endpoints - require project access
  @Get(':slug/charts/task-status')
  @Scope('PROJECT', 'slug')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getTaskStatusFlow(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.projectsService.projectTaskStatusFlow(slug, user.id);
  }

  @Get(':slug/charts/task-type')
  @Scope('PROJECT', 'slug')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getTaskTypeDistribution(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.projectsService.projectTaskTypeDistribution(slug, user.id);
  }

  @Get(':slug/charts/kpi-metrics')
  @Scope('PROJECT', 'slug')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getKPIMetrics(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.projectsService.projectKPIMetrics(slug, user.id);
  }

  @Get(':slug/charts/task-priority')
  @Scope('PROJECT', 'slug')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getTaskPriorityDistribution(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.projectsService.projectTaskPriorityDistribution(slug, user.id);
  }

  @Get(':slug/charts/sprint-velocity')
  @Scope('PROJECT', 'slug')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getSprintVelocityTrend(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.projectsService.projectSprintVelocityTrend(slug, user.id);
  }

  @Get(':slug/charts/sprint-burndown/:sprintId')
  @Scope('PROJECT', 'slug')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getSprintBurndown(
    @Param('slug') slug: string,
    @Param('sprintId', ParseUUIDPipe) sprintId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.projectSprintBurndown(sprintId, slug, user.id);
  }

  // Get project by slug
  @Get('by-slug/:slug')
  @Scope('PROJECT', 'slug')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getProjectBySlug(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.projectsService.getProjectBySlug(slug, user.id);
  }
}
