// src/activity-log/activity-log.module.ts
import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
