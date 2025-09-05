import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationChartsService } from './organizations-charts.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationChartsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
