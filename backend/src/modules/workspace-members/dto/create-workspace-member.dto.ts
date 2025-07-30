import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class CreateWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}

export class InviteWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}
