import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser, JwtPayload } from './types/jwt-payload';

/**
 * Estrategia Passport-JWT.
 *
 * - Rechaza tokens expirados (`ignoreExpiration: false`).
 * - El secret se valida al arranque por Joi (>=32 chars, no defaults),
 *   pero añadimos un chequeo defensivo porque ConfigService retorna
 *   `string | undefined` y queremos un error nítido si alguien
 *   pisa la config en runtime.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
    const secret = cfg.get<string>('JWT_SECRET');
    if (!secret) throw new Error('❌ JWT_SECRET no definido');

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };

    super(options);
  }

  /**
   * Passport inyecta el retorno en `req.user`. Tipamos la forma
   * para que el resto de la app consuma `AuthenticatedUser`.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
