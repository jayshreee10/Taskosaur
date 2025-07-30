import { IsEnum, IsOptional } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class UpdateWorkspaceMemberDto {
  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}
