import { IsEnum, IsOptional } from 'class-validator';
import { Role as WorkspaceRole } from '@prisma/client';

export class UpdateWorkspaceMemberDto {
  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}
