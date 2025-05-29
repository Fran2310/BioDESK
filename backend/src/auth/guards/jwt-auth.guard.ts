// /src/auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { getMetadataFlags } from 'src/common/utils/get-metadata-decorators.util';

@Injectable()
// registra la estrategia jwt.strategy.ts
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verifica si la ruta tiene el flag @Public
    //Obtener todos los flags
    const flags = getMetadataFlags(this.reflector, context, [IS_PUBLIC_KEY]);

    if (flags.isPublic) {
      // Si es pública, no requiere autenticación
      console.log('Ruta pública, no se requiere autenticación');
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException(
        'Token inválido o no enviado, inicie sesión',
      );
    }

    return user;
  }
}
