import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
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
import { ChartDataResponse, ChartType, GetChartsQueryDto } from './dto/get-charts-query.dto';


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

  @Get(':id/charts')
  @ApiOperation({
    summary: 'Get organization charts data',
    description: 'Retrieve multiple chart data types for an organization in a single request'
  })
  @ApiParam({
    name: 'id',
    description: 'Organization UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiQuery({
    name: 'types',
    description: 'Chart types to retrieve (can specify multiple)',
    enum: ChartType,
    isArray: true,
    style: 'form',
    explode: true,
    example: [ChartType.KPI_METRICS, ChartType.PROJECT_PORTFOLIO]
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization chart data retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        'kpi-metrics': {
          totalWorkspaces: 5,
          activeWorkspaces: 4,
          totalProjects: 12,
          projectCompletionRate: 75.5
        },
        'project-portfolio': [
          { status: 'ACTIVE', _count: { status: 10 } },
          { status: 'COMPLETED', _count: { status: 5 } }
        ]
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid chart type or missing parameters'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions to access organization data'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found'
  })
  @Scope('ORGANIZATION', 'id')
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getOrganizationCharts(
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Query() query: GetChartsQueryDto,
    @CurrentUser() user: any,
  ): Promise<ChartDataResponse> {
    try {
      const chartRes = await this.orgChartsService.getMultipleChartData(
        organizationId,
        user.id,
        query.types)
      return chartRes;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve chart data');
    }
  }
  // --- charts (read) ---


}
