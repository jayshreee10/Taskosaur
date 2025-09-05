import { IsEnum, IsOptional } from 'class-validator';
import { Role as OrganizationRole } from '@prisma/client';

export class UpdateOrganizationMemberDto {
  @IsEnum(OrganizationRole)
  @IsOptional()
  role?: OrganizationRole;
}
