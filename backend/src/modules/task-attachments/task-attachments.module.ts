import { Module } from '@nestjs/common';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskAttachmentsController } from './task-attachments.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaskAttachmentsController],
  providers: [TaskAttachmentsService],
  exports: [TaskAttachmentsService],
})
export class TaskAttachmentsModule {}
