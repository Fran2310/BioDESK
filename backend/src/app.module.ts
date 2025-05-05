// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SystemPrismaModule } from './system-prisma/system-prisma.module'; // Importa tu módulo de Prisma System

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: ['.env'],}), // Hace que process.env sea accesible globalmente
    SystemPrismaModule, // Agrega tu módulo de Prisma System a los imports
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}