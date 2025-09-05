import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Scope } from 'src/common/decorator/scope.decorator';
import { OrganizationsService } from './organizations.service';
import { OrganizationChartsService } from './organizations-charts.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateOrganizationDto } from './dto/update-organization.dto';


@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly orgChartsService: OrganizationChartsService,
  ) { }

  // Creating an organization: only authenticated user; no existing org scope yet.
  @Post()
  @ApiOperation({ summary: 'Create organization' })
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.create(createOrganizationDto, user.id);
  }

  // List organizations the user can see; rely on service-level filtering.
  @Get()
  @ApiOperation({ summary: 'List organizations' })
  findAll() {
    return this.organizationsService.findAll();
  }

  // Owner-only operations
  @Patch('archive/:id')
  @Roles(Role.OWNER)
  @Scope('ORGANIZATION', 'id')
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveOrganization(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.archiveOrganization(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.OWNER)
  @Scope('ORGANIZATION', 'id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto, user.id);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @Scope('ORGANIZATION', 'id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id);
  }

  // Read endpoints (commonly MEMBER+); adjust if stricter is desired
  @Get(':id')
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.MEMBER, Role.MANAGER, Role.OWNER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get('slug/:slug')
  @Scope('ORGANIZATION', 'id')
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get organization statistics' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.MEMBER, Role.MANAGER, Role.OWNER, Role.VIEWER)
  getOrganizationStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.getOrganizationStats(id);
  }

  // --- charts (read) ---
  @Get(':id/charts/kpi-metrics')
  @ApiOperation({ summary: 'Get organization KPI metrics' })
  @ApiResponse({ status: 200, description: 'Organization KPI metrics retrieved successfully' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getKPIMetrics(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationKPIMetrics(id, user.id);
  }

  @Get(':id/charts/project-portfolio')
  @ApiOperation({ summary: 'Get project portfolio status' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getProjectPortfolio(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationProjectPortfolio(id, user.id);
  }

  @Get(':id/charts/team-utilization')
  @ApiOperation({ summary: 'Get team utilization metrics' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getTeamUtilization(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationTeamUtilization(id, user.id);
  }

  @Get(':id/charts/task-distribution')
  @ApiOperation({ summary: 'Get task priority distribution' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getTaskDistribution(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationTaskDistribution(id, user.id);
  }

  @Get(':id/charts/task-type')
  @ApiOperation({ summary: 'Get task type distribution' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getTaskTypeDistribution(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationTaskTypeDistribution(id, user.id);
  }

  @Get(':id/charts/sprint-metrics')
  @ApiOperation({ summary: 'Get sprint status metrics' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getSprintMetrics(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationSprintMetrics(id, user.id);
  }

  @Get(':id/charts/quality-metrics')
  @ApiOperation({ summary: 'Get quality metrics' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getQualityMetrics(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationQualityMetrics(id, user.id);
  }

  @Get(':id/charts/workspace-project-count')
  @ApiOperation({ summary: 'Get project count per workspace' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getWorkspaceProjectCount(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationWorkspaceProjectCount(id, user.id);
  }

  @Get(':id/charts/member-workload')
  @ApiOperation({ summary: 'Get member workload distribution' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getMemberWorkload(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationMemberWorkload(id, user.id);
  }

  @Get(':id/charts/resource-allocation')
  @ApiOperation({ summary: 'Get resource allocation matrix' })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  getResourceAllocation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user) {
    return this.orgChartsService.organizationResourceAllocation(id, user.id);
  }
}
