import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationChartsService } from './organizations-charts.service';
import { AuthModule } from '../auth/auth.module';
import { AccessControlService } from 'src/common/access-control.utils';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationChartsService, AccessControlService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
