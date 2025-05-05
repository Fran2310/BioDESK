// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Para usar variables de entorno

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SystemPrismaModule } from '../system-prisma/system-prisma.module'; // Importa SystemPrismaModule
import { JwtStrategy } from './jwt.strategy'; // Importa la estrategia que crearemos
import { JwtAuthGuard } from './jwt-auth.guard'; // Importa el guard que crearemos

@Module({
  imports: [
    SystemPrismaModule, // Necesitamos acceso a SystemPrismaService
    PassportModule,
    JwtModule.registerAsync({ // Configuración asíncrona para usar ConfigService
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Obtiene la clave secreta de .env
        signOptions: { expiresIn: '60m' }, // Opcional: tiempo de expiración del token
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard], // Agrega AuthService, JwtStrategy y JwtAuthGuard
  exports: [AuthService, JwtModule, JwtAuthGuard], // Exporta lo que otros módulos podrían necesitar
})
export class AuthModule {}