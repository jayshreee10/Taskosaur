import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemUserSeederService } from './system-user.seeder.service';
import { UsersSeederService } from './users.seeder.service';
import { OrganizationsSeederService } from './organizations.seeder.service';
import { WorkspacesSeederService } from './workspaces.seeder.service';
import { ProjectsSeederService } from './projects.seeder.service';
import { WorkflowSeederService } from './workflow.seeder';
import { TaskStatusSeederService } from './taskstatus.seeder.service';

@Injectable()
export class SeederService {
  constructor(
    private prisma: PrismaService,
    private systemUserSeeder: SystemUserSeederService,
    private usersSeeder: UsersSeederService,
    private organizationsSeeder: OrganizationsSeederService,
    private workspacesSeeder: WorkspacesSeederService,
    private workflowsSeeder: WorkflowSeederService,
    private projectsSeeder: ProjectsSeederService,
    private taskStatusSeeder: TaskStatusSeederService,
  ) {}

  async seedCoreModules() {
    console.log('🌱 Starting core modules seeding...');

    try {
      // 0. Seed System User (must be first)
      const systemUser = await this.systemUserSeeder.seed();
      console.log('✅ System user seeded');

      // 1. Seed Users (foundation)
      const users = await this.usersSeeder.seed();
      console.log('✅ Users seeded');

      // 2. Seed Organizations (depends on users)
      const organizations = await this.organizationsSeeder.seed(users);
      console.log('✅ Organizations seeded');

      const workflows = await this.workflowsSeeder.seed(organizations);
      console.log('✅ Workflows seeded');

      // 3. Seed Workspaces (depends on organizations)
      const workspaces = await this.workspacesSeeder.seed(organizations, users);
      console.log('✅ Workspaces seeded');

      // 4. Seed Projects (depends on workspaces and users)
      const projects = await this.projectsSeeder.seed(workspaces, users);
      console.log('✅ Projects seeded');

      const taskStatuses = await this.taskStatusSeeder.seed(workflows, users);
      console.log('✅ Task statuses seeded');

      console.log('🎉 Core modules seeding completed successfully!');

      return {
        systemUser,
        users,
        organizations,
        workspaces,
        projects,
        workflows,
        taskStatuses
      };
    } catch (error) {
      console.error('❌ Error seeding core modules:', error);
      throw error;
    }
  }

  async clearCoreModules() {
    console.log('🧹 Clearing core modules...');

    try {

      await this.taskStatusSeeder.clear();
      console.log('✅ Task statuses cleared');

      await this.workflowsSeeder.clear();
      console.log('✅ Workflows cleared');

      await this.projectsSeeder.clear();
      console.log('✅ Projects cleared');

      await this.workspacesSeeder.clear();
      console.log('✅ Workspaces cleared');

      await this.organizationsSeeder.clear();
      console.log('✅ Organizations cleared');

      await this.usersSeeder.clear();
      console.log('✅ Users cleared');

      // Clear system user last (in case other operations depend on it)
      await this.systemUserSeeder.clear();
      console.log('✅ System user cleared');

      console.log('🎉 Core modules cleared successfully!');
    } catch (error) {
      console.error('❌ Error clearing core modules:', error);
      throw error;
    }
  }
}
