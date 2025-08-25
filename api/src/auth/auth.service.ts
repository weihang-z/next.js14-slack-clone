import {
    ConflictException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { PrismaService } from '../prisma/prisma.service';
  import * as bcrypt from 'bcrypt';
  import { ConfigService } from '@nestjs/config';
  
  type JwtPayload = { sub: string; email?: string };
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly jwt: JwtService,
      private readonly config: ConfigService,
    ) {}
  
    async register(input: { email: string; name: string; password: string }) {
      const { email, name, password } = input;
  
      const exists = await this.prisma.user.findUnique({ where: { email } });
      if (exists) throw new ConflictException('Email already registered');
  
      const hashed = await this.hash(password);
      const user = await this.prisma.user.create({
        data: { email, name, password: hashed }, // image 可后续更新
        select: { id: true, email: true, name: true, image: true, createdAt: true, updatedAt: true },
      });
  
      const { accessToken } = await this.signTokens({ sub: user.id, email: user.email });
      return { user, accessToken };
    }
  
    async login(input: { email: string; password: string }) {
      const { email, password } = input;
  
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, image: true, password: true, createdAt: true, updatedAt: true },
      });
      if (!user) throw new UnauthorizedException('Invalid credentials');
  
      const ok = await this.compare(password, user.password);
      if (!ok) throw new UnauthorizedException('Invalid credentials');
  
      const { password: _removed, ...safeUser } = user;
  
      const { accessToken } = await this.signTokens({ sub: safeUser.id, email: safeUser.email });
      return { user: safeUser, accessToken };
    }
  
    async signTokens(payload: JwtPayload) {
      const secret = this.config.get<string>('JWT_SECRET', '');
      const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '30m');
  
      const accessToken = await this.jwt.signAsync(payload, {
        secret,
        expiresIn: accessTtl,
        algorithm: 'HS256',
      });
  
      return { accessToken };
    }
  
    private async hash(plain: string) {
      const rounds = Number(this.config.get('BCRYPT_ROUNDS', '10'));
      return bcrypt.hash(plain, rounds);
    }
    private async compare(plain: string, hashed: string) {
      return bcrypt.compare(plain, hashed);
    }
  }
  