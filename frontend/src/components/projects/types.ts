export interface ProjectMember {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  project: {
    id: string;
    name: string;
  };
}

export interface OrganizationMember {
  id: string;
  role: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface ProjectMemberRole {
  value: string;
  label: string;
  variant: "default" | "success" | "warning" | "info" | "secondary";
}

export interface AddMemberData {
  userId: string;
  projectId: string;
  role: string;
}

export interface InviteMemberData {
  email: string;
  projectId: string;
  role: string;
}
