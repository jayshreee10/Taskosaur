import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, ActivityLogService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
