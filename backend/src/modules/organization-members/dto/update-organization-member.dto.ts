import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role as OrganizationRole } from '@prisma/client';

export class UpdateOrganizationMemberDto {
  @ApiPropertyOptional({
    description: 'Role of the user within the organization',
    enum: OrganizationRole,
    example: OrganizationRole.MANAGER,
  })
  @IsEnum(OrganizationRole)
  @IsOptional()
  role?: OrganizationRole;
}
