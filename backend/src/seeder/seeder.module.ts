import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemUserSeederService } from './system-user.seeder.service';
import { UsersSeederService } from './users.seeder.service';
import { OrganizationsSeederService } from './organizations.seeder.service';
import { WorkspacesSeederService } from './workspaces.seeder.service';
import { ProjectsSeederService } from './projects.seeder.service';
import { WorkflowSeederService } from './workflow.seeder';
import { TaskStatusSeederService } from './taskstatus.seeder.service';

@Module({
  imports: [PrismaModule],
  providers: [
    SeederService,
    SystemUserSeederService,
    UsersSeederService,
    OrganizationsSeederService,
    WorkspacesSeederService,
    ProjectsSeederService,
    WorkflowSeederService,
    TaskStatusSeederService,
  ],
  exports: [SeederService],
})
export class SeederModule {}
