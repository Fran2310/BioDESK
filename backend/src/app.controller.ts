// src/app.controller.ts
import {
  Controller,
  Get,
  Post, // Necesitamos Post para la ruta de login
  Body, // Necesitamos Body para obtener el cuerpo de la solicitud
  Param, // <-- Añade esto para los parámetros de ruta
  UseInterceptors,
  ClassSerializerInterceptor,
  UnauthorizedException, // Necesitamos lanzar esta excepción si falla el login
} from '@nestjs/common';

import { AppService } from './app.service';
import { SystemPrismaService } from './system-prisma/system-prisma.service';
import { SystemUser } from '@prisma/client-system';
import { LabPrismaFactory } from './lab-prisma/lab-prisma.factory';
import { LabMigrationService } from './lab-prisma/lab-migration.service';
import { LabUser } from '@prisma/client-lab';

// Importa el AuthService
import { AuthService } from './auth/auth.service';
// Importa el DTO de Login que definimos en auth.controller.ts
// Asegúrate de que la ruta sea correcta dependiendo de dónde lo definiste.
// Si lo definiste dentro de la clase AuthController, quizás necesites moverlo a un archivo separado (ej: src/auth/dto/login.dto.ts) y exportarlo.
// Por ahora, asumiremos que lo importas desde auth.controller (ajústalo si lo moviste).
import { LoginDto } from './auth/auth.controller'; // <-- Asegúrate que esta ruta es correcta

@Controller() // Opcional: Puedes poner un prefijo como @Controller('api') si no quieres que estas rutas estén en la raíz
@UseInterceptors(ClassSerializerInterceptor)
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly systemPrismaService: SystemPrismaService, // Inyecta tu servicio de Prisma System
    private readonly labPrismaFactory: LabPrismaFactory, 
    private readonly labMigrationService: LabMigrationService, 
    private readonly authService: AuthService, // <--- Inyecta AuthService aquí
  ) {}

  @Get('') // Ejemplo por defecto
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system-users') // Ruta para obtener todos los usuarios del sistema
  async getAllSystemUsers(): Promise<SystemUser[]> { //TODO Cambiar nombres de tablas de "SystemUser" a "systemUser" para evitar confuciones
    console.log('Fetching all system users...');
    const users = await this.systemPrismaService.systemUser.findMany();
    console.log(`Found ${users.length} system users.`);
    return users;
  }

  @Get('lab/:dbName')
  async getLabUsers(@Param('dbName') dbName: string) {
    // Luego obtener los usuarios
    const prisma = this.labPrismaFactory.create(dbName); // Esta función crea un prisma client dado un dbName
    return prisma.labUser.findMany(); // ORM
  }

  @Post('lab/:dbName/init')
  async initLabDatabase(@Param('dbName') dbName: string) {
    await this.labMigrationService.migrateDatabase(dbName); // Esta función crea hace una migración dado un dbName
    return { message: `Database ${dbName} initialized successfully` };
  }
  }

  // No añadiremos una ruta protegida aquí todavía, como pediste.
  // Eso lo haríamos usando @UseGuards(JwtAuthGuard) en un método.
