// src/activity-log/activity-log.service.ts
import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async logActivity(data: {
    type: ActivityType;
    description: string;
    entityType: string;
    entityId: string;
    userId: string;
    oldValue?: any;
    newValue?: any;
  }) {
    return this.prisma.activityLog.create({
      data: {
        type: data.type,
        description: data.description,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
      },
    });
  }

  // Task-specific logging methods
  async logTaskCreated(task: any, userId: string) {
    return this.logActivity({
      type: 'TASK_CREATED',
      description: `Created task "${task.title}" [${task.key}]`,
      entityType: 'Task',
      entityId: task.id,
      userId,
      newValue: task,
    });
  }

  async logTaskUpdated(oldTask: any, newTask: any, userId: string) {
    return this.logActivity({
      type: 'TASK_UPDATED',
      description: `Updated task "${newTask.title}"`,
      entityType: 'Task',
      entityId: newTask.id,
      userId,
      oldValue: oldTask,
      newValue: newTask,
    });
  }

  async logTaskStatusChanged(task: any, oldStatus: string, newStatus: string, userId: string) {
    return this.logActivity({
      type: 'TASK_STATUS_CHANGED',
      description: `Changed task "${task.title}" status from "${oldStatus}" to "${newStatus}"`,
      entityType: 'Task',
      entityId: task.id,
      userId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
    });
  }

  async logTaskAssigned(task: any, assigneeId: string, userId: string) {
    return this.logActivity({
      type: 'TASK_ASSIGNED',
      description: `Assigned task "${task.title}" to user`,
      entityType: 'Task',
      entityId: task.id,
      userId,
      newValue: { assigneeId },
    });
  }
}
