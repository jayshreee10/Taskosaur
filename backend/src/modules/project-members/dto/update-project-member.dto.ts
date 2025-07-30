import { IsEnum, IsOptional } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class UpdateProjectMemberDto {
  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}
