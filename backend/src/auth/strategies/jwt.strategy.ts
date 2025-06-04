// /src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Estrategia JWT para proteger rutas usando Passport en NestJS.
 * Obtiene la clave secreta desde ConfigService y valida el token recibido en el encabezado Authorization.
 * Si el token es válido, agrega el identificador del usuario (sub) al objeto req.user.
 * Lanza un error si la variable de entorno JWT_SECRET no está definida.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /*
    Validar token JWT para proteger rutas
  */
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('❌ JWT_SECRET no está definido en el entorno.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Aquí puedes controlar qué valores van en req.user
    return { sub: payload.sub };
  }
}
