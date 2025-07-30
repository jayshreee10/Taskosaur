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
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { LogActivity } from '../activity-log/decorator/log-activity.decorator';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @LogActivity({
    type: 'PROJECT_CREATED',
    entityType: 'Project',
    description: 'Created a new project',
    includeNewValue: true,
  })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @Get()
  findAll(@Query('workspaceId') workspaceId?: string) {
    return this.projectsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Get('workspace/:workspaceId/key/:key')
  findByKey(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('key') key: string,
  ) {
    return this.projectsService.findByKey(workspaceId, key);
  }

  @Patch(':id')
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

  @Delete(':id')
   @LogActivity({
    type: 'PROJECT_DELETED',
    entityType: 'Project',
    description: 'Deleted a project',
    includeOldValue: true,
    includeNewValue: false,})
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }
}
