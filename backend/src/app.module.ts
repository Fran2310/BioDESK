// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SystemPrismaModule } from './system-prisma/system-prisma.module'; // Importa tu módulo de Prisma System
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: ['.env'],}), // Hace que process.env sea accesible globalmente
    SystemPrismaModule, AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}