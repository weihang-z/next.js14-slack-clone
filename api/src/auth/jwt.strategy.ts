import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.cookies?.accessToken || null,
      ]),
      secretOrKey: config.get<string>('JWT_SECRET', ''),
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string }) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token missing sub');
    }

    return { userId: payload.sub };
  }
}
