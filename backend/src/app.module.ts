// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SystemPrismaModule } from './system-prisma/system-prisma.module'; // Importa tu módulo de Prisma System
import { LabPrismaModule } from './lab-prisma/lab-prisma.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }), // Hace que process.env sea accesible globalmente
    SystemPrismaModule,
    LabPrismaModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
