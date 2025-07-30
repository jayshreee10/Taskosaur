/**
 * Organization-related types
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  website?: string;
  settings?: Record<string, any>;
  ownerId: string;
  memberCount: number;
  workspaceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  };
}

export enum OrganizationRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  website?: string;
  settings?: Record<string, any>;
}

export interface UpdateOrganizationDto extends Partial<CreateOrganizationDto> {}

export interface OrganizationStats {
  totalMembers: number;
  totalWorkspaces: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  activeMembers: number;
  tasksThisWeek: number;
  projectsThisMonth: number;
}

export interface OrganizationSettings {
  general: {
    name: string;
    slug: string;
    description?: string;
    avatar?: string;
    website?: string;
  };
  preferences: {
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
  };
  features: {
    enableTimeTracking: boolean;
    enableAutomation: boolean;
    enableCustomFields: boolean;
    enableIntegrations: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    slackNotifications: boolean;
    webhookUrl?: string;
  };
  security: {
    requireTwoFactor: boolean;
    allowGuestAccess: boolean;
    sessionTimeout: number;
  };
}

export interface InviteMemberDto {
  email: string;
  role: OrganizationRole;
  message?: string;
}

export interface OrganizationActivity {
  id: string;
  type: 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'WORKSPACE_CREATED' | 'PROJECT_CREATED' | 'SETTINGS_UPDATED';
  description: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
}