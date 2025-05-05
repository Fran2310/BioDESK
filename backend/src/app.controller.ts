// src/app.controller.ts
import {
  Controller,
  Get,
  Post, // Necesitamos Post para la ruta de login
  Body, // Necesitamos Body para obtener el cuerpo de la solicitud
  UseInterceptors,
  ClassSerializerInterceptor,
  UnauthorizedException, // Necesitamos lanzar esta excepción si falla el login
} from '@nestjs/common';

import { AppService } from './app.service';
import { SystemPrismaService } from './system-prisma/system-prisma.service';
import { SystemUser } from '@prisma/client-system';
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
    private readonly authService: AuthService, // <--- Inyecta AuthService aquí
  ) {}

  @Get('') // Ejemplo por defecto
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system-users') // Ruta para obtener todos los usuarios del sistema
  async getAllSystemUsers(): Promise<SystemUser[]> {
    console.log('Fetching all system users...');
    const users = await this.systemPrismaService.systemUser.findMany();
    console.log(`Found ${users.length} system users.`);
    return users;
  }

  // --- NUEVA FUNCIÓN DE EJEMPLO PARA PROBAR LOGIN ---
  @Post('test-login') // Define una nueva ruta POST específica para este ejemplo
  async testLogin(@Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    console.log('Received test login request for email:', loginDto.email);

    // 1. Usa el AuthService para validar las credenciales
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    // 2. Si validateUser retorna null (credenciales inválidas), lanza una excepción 401
    if (!user) {
      console.log('Test login failed: Invalid credentials');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Si el usuario es válido, usa AuthService para generar el token
    console.log('Test login successful, generating token...');
    const token = await this.authService.login(user);

    // 4. Retorna el token
    console.log('Generated token:', token);
    return token;
  }
  // -------------------------------------------------

  // No añadiremos una ruta protegida aquí todavía, como pediste.
  // Eso lo haríamos usando @UseGuards(JwtAuthGuard) en un método.
}