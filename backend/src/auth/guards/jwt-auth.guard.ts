// /src/auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// registra la estrategia jwt.strategy.ts
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verifica si la ruta tiene el flag @Public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err, user) {
    if (err || !user) {
      if (err instanceof ForbiddenException) {
        throw new ForbiddenException(err.message);
      }
      if (err instanceof BadRequestException) {
        throw new BadRequestException(err.message);
      }
      throw new UnauthorizedException('Token inválido o no enviado.');
    }
    return user;
  }
}
