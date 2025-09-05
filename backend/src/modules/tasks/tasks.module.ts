import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccessControlService } from 'src/common/access-control.utils';

@Module({
  imports: [PrismaModule],
  controllers: [TasksController],
  providers: [TasksService, AccessControlService],
  exports: [TasksService],
})
export class TasksModule {}
