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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { LogActivity } from '../activity-log/decorator/log-activity.decorator';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @LogActivity({
    type: 'TASK_CREATED',
    entityType: 'Task',
    description: 'Create a new task',
    includeOldValue: false,
    includeNewValue: true,
  })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('sprintId') sprintId?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('parentTaskId') parentTaskId?: string,
  ) {
    return this.tasksService.findAll(
      projectId,
      sprintId,
      workspaceId,
      parentTaskId,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.tasksService.findByKey(key);
  }

  @Get('organization/:orgId')
  getTasksByOrganization(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.tasksService.findByOrganization(orgId);
  }

  @Patch(':id')
  @LogActivity({
    type: 'TASK_UPDATED',
    entityType: 'Task',
    description: 'Updated task details',
    includeOldValue: true,
    includeNewValue: true,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  // 🔹 NEW: Status Change Endpoint
  @Patch(':id/status')
  @LogActivity({
    type: 'TASK_STATUS_CHANGED',
    entityType: 'Task',
    description: 'Changed task status',
    includeOldValue: true,
    includeNewValue: true,
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('statusId', ParseUUIDPipe) statusId: string,
  ) {
    // Use the existing update service with status field
    return this.tasksService.update(id, { statusId });
  }

  // 🔹 NEW: Assignee Change Endpoint
  @Patch(':id/assignee')
  @LogActivity({
    type: 'TASK_ASSIGNED',
    entityType: 'Task',
    description: 'Changed task assignee',
    includeOldValue: true,
    includeNewValue: true,
  })
  updateAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assigneeId', ParseUUIDPipe) assigneeId: string,
  ) {
    return this.tasksService.update(id, { assigneeId });
  }

  @Patch(':id/unassign')
  @LogActivity({
    type: 'TASK_ASSIGNED',
    entityType: 'Task',
    description: 'Unassigned task',
    includeOldValue: true,
    includeNewValue: true,
  })
  unassignTask(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.update(id, { assigneeId: undefined });
  }

  @Delete(':id')
  @LogActivity({
    type: 'TASK_DELETED',
    entityType: 'Task',
    description: 'Deleted a task',
    includeOldValue: true,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }
}
