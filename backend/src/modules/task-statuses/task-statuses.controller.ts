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
import { TaskStatusesService } from './task-statuses.service';
import { CreateTaskStatusDto } from './dto/create-task-status.dto';
import {
  UpdatePositionItemDto,
  UpdatePositionsDto,
  UpdateTaskStatusDto,
} from './dto/update-task-status.dto';
import { Task, TaskStatus } from '@prisma/client';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('task-statuses')
export class TaskStatusesController {
  constructor(private readonly taskStatusesService: TaskStatusesService) {}

  @Post()
  create(
    @Body() createTaskStatusDto: CreateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.taskStatusesService.create(createTaskStatusDto, user.id);
  }

  @Get()
  findAll(@Query('workflowId') workflowId?: string) {
    return this.taskStatusesService.findAll(workflowId);
  }
  @Patch('positions')
  updatePositions(
    // ✅ This tells NestJS to expect an object with a 'statusUpdates' property.
    @Body() updatePositionsDto: UpdatePositionsDto,
    @CurrentUser() user: any,
  ) {
    // ✅ Then, extract the array from the DTO before passing it to your service.
    return this.taskStatusesService.updatePositions(
      updatePositionsDto.statusUpdates,
      user.id,
    );
  }
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskStatusesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.taskStatusesService.update(id, updateTaskStatusDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskStatusesService.remove(id);
  }
}
