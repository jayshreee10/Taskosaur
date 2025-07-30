import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { AutomationProcessor } from './automation.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { GatewayModule } from '../../gateway/gateway.module';

@Module({
  imports: [
    PrismaModule,
    GatewayModule,
    BullModule.registerQueue({
      name: 'automation',
    }),
  ],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationProcessor],
  exports: [AutomationService],
})
export class AutomationModule {}
