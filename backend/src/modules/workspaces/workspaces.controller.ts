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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService,
              private readonly activityLogService: ActivityLogService,
  ) {}

  @Post()
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.create(createWorkspaceDto, user.id);
  }

  @Get()
  findAll(@Query('organizationId') organizationId?: string) {
    return this.workspacesService.findAll(organizationId);
  }
  @Get('search')
  @ApiOperation({ summary: 'Search workspaces without pagination' })
  searchWorkspaces(
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string,
  ) {
    return this.workspacesService.findAll(organizationId, search);
  }
  @Get('search/paginated')
  @ApiOperation({ summary: 'Search workspaces with pagination' })
  searchWorkspacesWithPagination(
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
      organizationId,
      search,
      validatedPage,
      validatedLimit,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.findOne(id);
  }
@Get('recent/:workspaceId')
  @ApiOperation({ summary: 'Get recent activity for workspace' })
  getWorkspaceRecentActivity(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query('limit') limit: string = '10',
    @Query('page') page: string = '1',
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
  findBySlug(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('slug') slug: string,
  ) {
    return this.workspacesService.findBySlug(organizationId, slug);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.update(id, updateWorkspaceDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.remove(id);
  }
}
