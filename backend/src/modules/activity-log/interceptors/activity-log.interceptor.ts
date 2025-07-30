// src/common/interceptors/activity-log.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService } from '../../activity-log/activity-log.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private activityLogService: ActivityLogService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    const activityConfig = this.reflector.get('activity-log', handler);

    if (!activityConfig) {
      return next.handle();
    }

    const userId = request.user?.id;
    const originalData = request.body;

    return next.handle().pipe(
      tap(async (result) => {
        if (userId && activityConfig) {
          await this.logActivity(activityConfig, userId, originalData, result);
        }
      }),
    );
  }

  private async logActivity(config: any, userId: string, oldValue: any, newValue: any) {
    await this.activityLogService.logActivity({
      type: config.type,
      description: config.description,
      entityType: config.entityType,
      entityId: newValue?.id || oldValue?.id,
      userId,
      oldValue: config.includeOldValue ? oldValue : undefined,
      newValue: config.includeNewValue ? newValue : undefined,
    });
  }
}
