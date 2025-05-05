// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common'; // Importa InternalServerErrorException
import { ConfigService } from '@nestjs/config';
import { SystemPrismaService } from '../system-prisma/system-prisma.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private systemPrismaService: SystemPrismaService,
  ) {

    const jwtSecret = configService.get<string>('JWT_SECRET');

    // --- Comprobación manual ---
    // Verificamos si la clave secreta es undefined.
    // Si es así, lanzamos un error. Esto detendrá la aplicación al inicio
    // si la variable de entorno JWT_SECRET no está configurada.
    if (jwtSecret === undefined) {
        const errorMessage = 'JWT_SECRET environment variable is not defined. Application cannot start.';
        throw new InternalServerErrorException(errorMessage);
    }
    // -------------------------

    // Ahora que hemos comprobado que jwtSecret NO es undefined,
    // TypeScript sabe que es un string, y podemos pasarlo al constructor super().
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Aquí jwtSecret es string (gracias a la comprobación)
    });

    this.logger.debug('JwtStrategy initialized');
  }

  async validate(payload: any) {
    this.logger.debug('Validating JWT payload:', payload);

    if (!payload || payload.sub === undefined) {
         this.logger.warn('JWT payload missing required sub claim.');
         throw new UnauthorizedException('Invalid token payload.');
    }

    const user = await this.systemPrismaService.systemUser.findUnique({
      where: { id: payload.sub }, // Buscar por ID usando payload.sub
    });

    if (!user) {
      this.logger.warn(`User not found for sub: ${payload.sub}`);
      throw new UnauthorizedException('Usuario asociado al token no encontrado');
    }

     const { password, salt, ...result } = user;
     this.logger.debug(`User validated by JWT: ${user.email}`);
     return result;
  }
}