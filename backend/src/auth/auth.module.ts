// /src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LabModule } from 'src/lab/lab.module';
import { MailModule } from 'src/mail/mail.module';
import { SharedCacheModule } from 'src/shared-cache/shared-cache.module';

/**
 * Módulo de autenticación que configura los servicios, controladores y estrategias necesarias
 * para el registro, inicio de sesión y validación de usuarios mediante JWT y Passport.
 * Importa los módulos de usuario y laboratorio, y registra el módulo JWT de forma asíncrona
 * utilizando la configuración de entorno.
 */
@Module({
  imports: [
    LabModule,
    UserModule,
    PassportModule,
    SharedCacheModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'), //toma el secret del entorno
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, LocalAuthGuard],
  exports: [JwtModule],
})
export class AuthModule {}
