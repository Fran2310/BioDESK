// src/auth/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// Extiende AuthGuard y especifica la estrategia 'jwt' que definimos en JwtStrategy
export class JwtAuthGuard extends AuthGuard('jwt') {}