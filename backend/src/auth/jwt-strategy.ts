import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { jwtConstants } from 'backend/src/auth/constants';
import { IReqUser } from 'backend/src/shared/types';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any): Promise<IReqUser> {
    return { email: payload.email, userId: payload.sub };
  }
}

const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.access_token ?? null
};