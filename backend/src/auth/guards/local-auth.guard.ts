// /src/auth/guards/local-auth.guard.ts
import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
/**
 * Guardia de autenticación que utiliza la estrategia 'local' para validar credenciales de usuario.
 * Se debe aplicar a rutas que requieran autenticación (login).
 */
@Injectable()
// registra la estrategia local.strategy.ts
export class LocalAuthGuard extends AuthGuard('local') {}
