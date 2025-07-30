import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailTemplate, EmailPriority } from '../email/dto/email.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtPayload } from './strategies/jwt.strategy';
import { SYSTEM_USER_ID } from '../../common/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    
    // Prevent system user from authenticating
    if (user && user.id === SYSTEM_USER_ID) {
      throw new UnauthorizedException('System user cannot be used for authentication');
    }
    
    if (
      user &&
      user.password &&
      user.status === 'ACTIVE' && // Only active users can login
      (await bcrypt.compare(password, user.password))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Update refresh token in database
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username || undefined,
        role: user.role,
        avatar: user.avatar || undefined,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if username is taken (if provided)
    if (registerDto.username) {
      const existingUsername = await this.usersService.findByUsername(
        registerDto.username,
      );
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    // Create new user
    const user = await this.usersService.create(registerDto);

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Update refresh token in database
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username || undefined,
        role: user.role,
        avatar: user.avatar || undefined,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decoded = this.jwtService.verify(refreshToken);

      // Type guard to ensure decoded payload has required properties
      if (!decoded || typeof decoded !== 'object' || !('sub' in decoded)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = decoded as JwtPayload;
      const user = await this.usersService.findOne(payload.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
      });

      // Update refresh token in database
      await this.usersService.updateRefreshToken(user.id, newRefreshToken);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username || undefined,
          role: user.role,
          avatar: user.avatar || undefined,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Generate and send password reset token to user's email
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists or not
      // Just return success to prevent email enumeration
      return;
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24); // Token expires in 24 hours

    // Save reset token to database
    await this.usersService.updateResetToken(
      user.id,
      resetToken,
      resetTokenExpiry,
    );

    // Send password reset email
    const resetUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;

    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Reset Your Taskosaur Password',
      template: EmailTemplate.PASSWORD_RESET,
      data: {
        userName: user.firstName,
        resetUrl,
        expiresIn: '24 hours',
      },
      priority: EmailPriority.HIGH,
    });
  }

  /**
   * Verify if reset token is valid and not expired
   */
  async verifyResetToken(token: string): Promise<boolean> {
    if (!token || token.trim() === '') {
      return false;
    }

    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      return false;
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      // Clean up expired token
      await this.usersService.updateResetToken(user.id, null, null);
      return false;
    }

    return true;
  }

  /**
   * Reset user password using valid reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || token.trim() === '') {
      throw new BadRequestException('Invalid reset token');
    }

    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      // Clean up expired token
      await this.usersService.updateResetToken(user.id, null, null);
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.usersService.updateResetToken(user.id, null, null);

    // Optionally, invalidate all refresh tokens for security
    await this.usersService.updateRefreshToken(user.id, null);
  }
}
