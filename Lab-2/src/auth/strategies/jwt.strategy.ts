import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { studentConfig } from '../../config/student.config.js';

export interface JwtPayload {
  sub: number;
  username: string;
  roles: string[];
  student: {
    lastName: string;
    initials: string;
    group: string;
    variant: number;
  };
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: studentConfig.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub || !payload.username) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
      student: payload.student,
      exp: payload.exp,
      iat: payload.iat,
    };
  }
}
