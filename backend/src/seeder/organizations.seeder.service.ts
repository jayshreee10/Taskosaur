import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationRole, Organization } from '@prisma/client';

@Injectable()
export class OrganizationsSeederService {
  constructor(private prisma: PrismaService) {}

  async seed(users: any[]) {
    console.log('🌱 Seeding organizations...');

    if (!users || users.length === 0) {
      throw new Error('Users must be seeded before organizations');
    }

    // Find admin/super admin user to be owner
    const adminUser =
      users.find(
        (user) => user.role === 'SUPER_ADMIN' || user.role === 'ADMIN',
      ) || users[0];

    const organizationsData = [
      {
        name: 'Taskosaur Inc.',
        slug: 'taskosaur-inc',
        description:
          'A comprehensive task management solution for modern teams',
        website: 'https://taskosaur.com',
        avatar:
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150',
        ownerId: adminUser.id,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
        settings: {
          allowPublicSignup: false,
          defaultUserRole: 'MEMBER',
          requireEmailVerification: true,
          enableTimeTracking: true,
          enableAutomation: true,
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
          timezone: 'UTC',
        },
      },
      {
        name: 'Tech Innovators LLC',
        slug: 'tech-innovators',
        description: 'Innovation-driven technology consultancy',
        website: 'https://techinnovators.example.com',
        avatar:
          'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150',
        ownerId:
          users.find((user) => user.role === 'MANAGER')?.id || users[1]?.id,
        createdBy: users.find((user) => user.role === 'MANAGER')?.id || users[1]?.id,
        updatedBy: users.find((user) => user.role === 'MANAGER')?.id || users[1]?.id,
        settings: {
          allowPublicSignup: true,
          defaultUserRole: 'VIEWER',
          requireEmailVerification: true,
          enableTimeTracking: false,
          enableAutomation: false,
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          workingHours: {
            start: '08:30',
            end: '16:30',
          },
          timezone: 'America/New_York',
        },
      },
    ];

    const createdOrganizations: Organization[] = [];

    for (const orgData of organizationsData) {
      try {
        const organization = await this.prisma.organization.create({
          data: orgData,
        });

        // Add organization members
        await this.addMembersToOrganization(organization.id, users);

        createdOrganizations.push(organization);
        console.log(`   ✓ Created organization: ${organization.name}`);
      } catch (error) {
        console.log(
          `   ⚠ Organization ${orgData.slug} might already exist, skipping...`,
        );
        // Try to find existing organization
        const existingOrg = await this.prisma.organization.findUnique({
          where: { slug: orgData.slug },
        });
        if (existingOrg) {
          createdOrganizations.push(existingOrg);
        }
      }
    }

    console.log(
      `✅ Organizations seeding completed. Created/Found ${createdOrganizations.length} organizations.`,
    );
    return createdOrganizations;
  }

  private async addMembersToOrganization(organizationId: string, users: any[]) {
    // Define roles for users (first user is owner, already created)
    const memberRoles = [
      OrganizationRole.ADMIN, // Second user
      OrganizationRole.MANAGER, // Third user
      OrganizationRole.MEMBER, // Fourth user
      OrganizationRole.MEMBER, // Fifth user
      OrganizationRole.MEMBER, // Sixth user
      OrganizationRole.VIEWER, // Seventh user
      OrganizationRole.MEMBER, // Eighth user (if exists)
    ];

    // Skip the first user (owner) and add the rest as members
    for (let i = 1; i < users.length && i <= memberRoles.length; i++) {
      try {
        await this.prisma.organizationMember.create({
          data: {
            userId: users[i].id,
            organizationId,
            role: memberRoles[i - 1],
          },
        });
        console.log(
          `   ✓ Added ${users[i].email} to organization as ${memberRoles[i - 1]}`,
        );
      } catch (error) {
        console.log(
          `   ⚠ User ${users[i].email} might already be a member, skipping...`,
        );
      }
    }
  }

  async clear() {
    console.log('🧹 Clearing organizations...');

    try {
      // Delete organization members first (foreign key constraint)
      const deletedMembers = await this.prisma.organizationMember.deleteMany();
      console.log(`   ✓ Deleted ${deletedMembers.count} organization members`);

      // Delete organizations
      const deletedOrgs = await this.prisma.organization.deleteMany();
      console.log(`✅ Deleted ${deletedOrgs.count} organizations`);
    } catch (error) {
      console.error('❌ Error clearing organizations:', error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        website: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          select: {
            role: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            workspaces: true,
          },
        },
        createdAt: true,
      },
    });
  }
}
