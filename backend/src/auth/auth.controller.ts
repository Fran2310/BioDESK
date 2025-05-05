// src/auth/auth.controller.ts
import { UnauthorizedException, Controller, Request, Post, UseGuards, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
// Importa el guard JWT
import { JwtAuthGuard } from './jwt-auth.guard';
import { SystemUser } from '@prisma/client-system'; // Importa el tipo SystemUser

// Define un DTO simple para las credenciales de login (puedes crearlo en un archivo separado)
export class LoginDto {
  email: string;
  password: string;
}

@Controller('auth') // Prefijo para todas las rutas de este controlador
export class AuthController {
  constructor(private authService: AuthService) {}

  // Ruta para iniciar sesión (POST /auth/login)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // 1. Validar las credenciales usando el servicio de autenticación
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (!user) {
        throw new UnauthorizedException('Credenciales inválidas'); // <-- Asegura que user NO es null aquí
      }

    // 3. Si la validación es exitosa, generar y retornar el token JWT
    return this.authService.login(user);
  }

  // --- Ejemplo de ruta protegida ---
  // Usa el guard JWT para proteger este endpoint
  @UseGuards(JwtAuthGuard)
  @Get('profile') // Ruta: GET /auth/profile
  getProfile(@Request() req): Omit<SystemUser, 'password'> {
    // Si el guard JwtAuthGuard permite la solicitud, 'req.user' contendrá
    // el objeto usuario retornado por el método 'validate' de JwtStrategy
    console.log('Accessed protected profile route');
    return req.user; // req.user ya es el objeto usuario sin la contraseña
  }
  // --------------------------------
}