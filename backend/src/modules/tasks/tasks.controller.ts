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
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { getAuthUser } from 'src/common/request.utils';
import { Request } from 'express';
import { NotificationPriority, NotificationType, TaskPriority } from '@prisma/client';
import { AutoNotify } from 'src/common/decorator/auto-notify.decorator';
import { LogActivity } from 'src/common/decorator/log-activity.decorator';

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
  @AutoNotify({
    type: NotificationType.TASK_ASSIGNED,
    entityType: 'Task',
    priority: NotificationPriority.MEDIUM,
    title: 'New Task Created',
    message: 'A new task has been created and assigned to you',
  })
  create(@Req() req: Request, @Body() createTaskDto: CreateTaskDto) {
    const user = getAuthUser(req);
    return this.tasksService.create(createTaskDto, user.id);
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

  @Get('today')
  @ApiOperation({
    summary: "Get today's tasks filtered by assignee/reporter and organization",
  })
  getTodaysTasks(
    @Query('organizationId') organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Req() req: Request,
  ) {    
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      throw new BadRequestException(
        `Invalid organization ID format: ${organizationId}. Expected UUID.`,
      );
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const validatedPage = Math.max(1, pageNum);
    const validatedLimit = Math.min(Math.max(1, limitNum), 100);

    const user = getAuthUser(req);

    return this.tasksService.findTodaysTasks(
      organizationId,
      {
        assigneeId: user.id,
        reporterId: user.id,
        userId: user.id,
      },
      validatedPage,
      validatedLimit,
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
  getTasksByOrganization(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Req() req: Request,
    @Query('priority') priority?: TaskPriority,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const user = getAuthUser(req);
    const assigneeId = user.id;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const validatedPage = Math.max(1, pageNum);
    const validatedLimit = Math.min(Math.max(1, limitNum), 100);

    return this.tasksService.findByOrganization(
      orgId,
      assigneeId,
      priority,
      search,
      validatedPage,
      validatedLimit,
    );
  }

  @Patch(':id')
  @LogActivity({
    type: 'TASK_UPDATED',
    entityType: 'Task',
    description: 'Updated task details',
    includeOldValue: true,
    includeNewValue: true,
  })
  @AutoNotify({
    type: NotificationType.TASK_STATUS_CHANGED,
    entityType: 'Task',
    priority: NotificationPriority.MEDIUM,
    title: 'Task Updated',
    message: 'A task you are involved in has been updated',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Patch(':id/status')
  @LogActivity({
    type: 'TASK_STATUS_CHANGED',
    entityType: 'Task',
    description: 'Changed task status',
    includeOldValue: true,
    includeNewValue: true,
  })
  @AutoNotify({
    type: NotificationType.TASK_STATUS_CHANGED,
    entityType: 'Task',
    priority: NotificationPriority.MEDIUM,
    title: 'Task Status Updated',
    message: 'Task status has been changed',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('statusId', ParseUUIDPipe) statusId: string,
  ) {
    return this.tasksService.update(id, { statusId });
  }

  @Patch(':id/assignee')
  @LogActivity({
    type: 'TASK_ASSIGNED',
    entityType: 'Task',
    description: 'Changed task assignee',
    includeOldValue: true,
    includeNewValue: true,
  })
  @AutoNotify({
    type: NotificationType.TASK_ASSIGNED,
    entityType: 'Task',
    priority: NotificationPriority.HIGH,
    title: 'Task Assigned',
    message: 'You have been assigned to a new task',
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
  @AutoNotify({
    type: NotificationType.TASK_ASSIGNED,
    entityType: 'Task',
    priority: NotificationPriority.LOW,
    title: 'Task Unassigned',
    message: 'You have been unassigned from a task',
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
  @AutoNotify({
    type: NotificationType.SYSTEM,
    entityType: 'Task',
    priority: NotificationPriority.LOW,
    title: 'Task Deleted',
    message: 'A task you were involved in has been deleted',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }

  // ✅ Additional endpoints you might want to add

  @Post(':id/comments')
  @LogActivity({
    type: 'TASK_COMMENTED',
    entityType: 'Task',
    description: 'Added comment to task',
    includeOldValue: false,
    includeNewValue: true,
  })
  @AutoNotify({
    type: NotificationType.TASK_COMMENTED,
    entityType: 'Task',
    priority: NotificationPriority.MEDIUM,
    title: 'New Comment',
    message: 'Someone commented on a task you are involved in',
  })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('comment') comment: string,
    @Req() req: Request,
  ) {
    const user = getAuthUser(req);
    return this.tasksService.addComment(id, comment, user.id);
  }

  @Patch(':id/priority')
  @LogActivity({
    type: 'TASK_UPDATED',
    entityType: 'Task',
    description: 'Changed task priority',
    includeOldValue: true,
    includeNewValue: true,
  })
  @AutoNotify({
    type: NotificationType.TASK_STATUS_CHANGED,
    entityType: 'Task',
    priority: NotificationPriority.MEDIUM,
    title: 'Task Priority Updated',
    message: 'Task priority has been changed',
  })
  updatePriority(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('priority') priority: TaskPriority,
  ) {
    return this.tasksService.update(id, { priority });
  }

  @Patch(':id/due-date')
  @LogActivity({
    type: 'TASK_UPDATED',
    entityType: 'Task',
    description: 'Changed task due date',
    includeOldValue: true,
    includeNewValue: true,
  })
  @AutoNotify({
    type: NotificationType.TASK_STATUS_CHANGED,
    entityType: 'Task',
    priority: NotificationPriority.MEDIUM,
    title: 'Task Due Date Updated',
    message: 'Task due date has been changed',
  })
  updateDueDate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('dueDate') dueDate: string,
  ) {
    return this.tasksService.update(id, { dueDate });
  }
}
