import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '../redis/redis.module';
import Redis from 'ioredis';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import {
  LoginDto,
  RefreshTokenDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SendOtpDto,
} from './dto/login.dto';
import { hashPassword, comparePassword, generateOtp } from '../../common/utils/hash.util';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRedis() private redis: Redis,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { phoneNumber: dto.phoneNumber }],
    });
    if (exists) throw new ConflictException('Email or phone number already registered');

    const hashed = await hashPassword(dto.password);
    const user = this.userRepo.create({
      ...dto,
      password: hashed,
      role: dto.role || Role.TENANT,
    });
    await this.userRepo.save(user);

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: { id: true, email: true, password: true, role: true, fullName: true, isActive: true, phoneNumber: true },
    });
    if (!user || !(await comparePassword(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    const tokens = await this.generateTokens(user, ip, userAgent);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: { id: true, email: true, password: true, role: true, fullName: true, isActive: true },
    });
    if (user && (await comparePassword(password, user.password))) return user;
    return null;
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: { token: dto.refreshToken, isRevoked: false },
      relations: { user: true },
    });
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepo.update(tokenRecord.id, { isRevoked: true });
    const tokens = await this.generateTokens(tokenRecord.user);
    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokenRepo.update({ token: refreshToken }, { isRevoked: true });
    } else {
      await this.refreshTokenRepo.update({ userId, isRevoked: false }, { isRevoked: true });
    }
    return { message: 'Logged out successfully' };
  }

  async sendOtp(dto: SendOtpDto) {
    const otp = generateOtp(6);
    const key = `otp:${dto.phoneNumber}`;
    const ttl = parseInt(this.configService.get('OTP_TTL_SECONDS', '300'), 10);
    await this.redis.setex(key, ttl, otp);
    // In production: integrate with SMS provider (Twilio / MSG91)
    console.log(`[DEV] OTP for ${dto.phoneNumber}: ${otp}`);
    return { message: 'OTP sent successfully', expiresIn: ttl };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const key = `otp:${dto.phoneNumber}`;
    const storedOtp = await this.redis.get(key);
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.redis.del(key);
    await this.userRepo.update({ phoneNumber: dto.phoneNumber }, { isPhoneVerified: true });
    return { message: 'Phone verified successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User with this email not found');

    const resetToken = generateOtp(32);
    const key = `reset:${resetToken}`;
    await this.redis.setex(key, 3600, user.id);
    // In production: send email with reset link
    console.log(`[DEV] Password reset token: ${resetToken}`);
    return { message: 'Password reset email sent', token: resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const key = `reset:${dto.token}`;
    const userId = await this.redis.get(key);
    if (!userId) throw new BadRequestException('Invalid or expired reset token');

    const hashed = await hashPassword(dto.newPassword);
    await this.userRepo.update(userId, { password: hashed });
    await this.redis.del(key);
    return { message: 'Password reset successful' };
  }

  private async generateTokens(user: User, ip?: string, userAgent?: string) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessSecret'),
      expiresIn: this.configService.get('jwt.accessExpiresIn'),
    });

    const refreshTokenValue = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        token: refreshTokenValue,
        userId: user.id,
        expiresAt,
        ipAddress: ip,
        userAgent,
      }),
    );

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private sanitizeUser(user: User) {
    const { password, ...safe } = user as any;
    return safe;
  }
}
