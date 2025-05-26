// /src/auth/guards/local-auth.guard.ts
import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
// registra la estrategia local.strategy.ts
export class LocalAuthGuard extends AuthGuard('local') {}
