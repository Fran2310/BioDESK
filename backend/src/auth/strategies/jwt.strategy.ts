// /src/auth/strategies/jwt.strategy.ts
import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { LabService } from 'src/lab/lab.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly labService: LabService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('❌ JWT_SECRET no está definido en el entorno.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    try {
      const labId = req.headers['x-lab-id'];
      
      if (!labId) {
        throw new BadRequestException('Header x-lab-id es requerido');
      }

      const labIdNumber = Number(labId);
      if (isNaN(labIdNumber)) {
        throw new UnauthorizedException('x-lab-id debe ser un número válido');
      }

      // Se comprueba el cache del usuario
      const UserCachedData = await this.labService.getUserCached(payload.sub);
      if (UserCachedData) {
        if (UserCachedData.labId != labIdNumber) {
          await this.labService.selectedLab(payload.sub, labIdNumber);
        }
      } else {
        await this.labService.selectedLab(payload.sub, labIdNumber);
      }

      return { sub: payload.sub };
    } catch (error) {
      throw error;
    }
  }
}
