// src/modules/invitations/invitations.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getAuthUser } from 'src/common/request.utils';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Invitations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiOperation({ summary: 'Send invitation' })
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Req() req: Request,
  ) {
    const user = getAuthUser(req);
    return this.invitationsService.createInvitation(
      createInvitationDto,
      user.id,
    );
  }

  @Patch(':token/accept')
  @ApiOperation({ summary: 'Accept invitation' })
  async acceptInvitation(@Param('token') token: string, @Req() req: Request) {
    const user = getAuthUser(req);
    return this.invitationsService.acceptInvitation(token, user.id);
  }

  @Patch(':token/decline')
  @ApiOperation({ summary: 'Decline invitation' })
  async declineInvitation(@Param('token') token: string) {
    return this.invitationsService.declineInvitation(token);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user invitations' })
  async getUserInvitations(@Req() req: Request) {
    const user = getAuthUser(req);
    return this.invitationsService.getUserInvitations(user.email);
  }
  @Public()
  @Get('verify/:token')
  @ApiOperation({ summary: 'Verify invitation token' })
  async verifyInvitation(@Param('token') token: string) {
    return this.invitationsService.verifyInvitation(token);
  }
}
