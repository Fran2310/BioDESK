// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule para manejar variables de entorno
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SystemPrismaModule } from './system-prisma/system-prisma.module';
import { LabPrismaModule } from './lab-prisma/lab-prisma.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core'; // Importa APP_GUARD para usar guards globales
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // Importa el guard de autenticación JWT
import { LabHeaderGuard } from './auth/guards/lab-header.guard'; // Importa el guard para validar x-lab-id
import { CaslAbilityGuard } from './casl/guards/casl-ability.guard'; // Importa el guard de CASL
import { AuthModule } from './auth/auth.module';
import { SharedCacheModule } from './shared-cache/shared-cache.module';
import { LabModule } from './lab/lab.module';
import { CaslModule } from './casl/casl.module';
import { AuditModule } from './audit/audit.module';
import { RoleModule } from './role/role.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }), // Hace que process.env sea accesible globalmente
    SystemPrismaModule,
    LabPrismaModule,
    UserModule,
    AuthModule,
    SharedCacheModule,
    LabModule,
    CaslModule,
    AuditModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: LabHeaderGuard, // valida x-lab-id, si aplica
    },
    {
      provide: APP_GUARD,
      useClass: CaslAbilityGuard, // Importa el guard de CASL
    },
  ],
})
export class AppModule {}
