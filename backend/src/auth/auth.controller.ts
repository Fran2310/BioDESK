// /src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Public } from './decorators/public.decorator'; // Ruta pública, no requiere autenticación
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseInterceptors(FileInterceptor('logo'))
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.authService.register(dto, logo);
  }

  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Inicio de sesión',
    description: `Inicia sesión con email y contraseña.
      Devuelve un JSON con access_token JWT si las credenciales son correctas y una lista de laboratorios asociados al usuario.`,
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: LoginResponseDto,
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        labs: [
          {
            id: 1,
            name: 'Laboratorio Santos',
            status: 'active',
            rif: 'J-12345678-9',
          },
          {
            id: 2,
            name: 'Lab Grillos',
            status: 'active',
            rif: 'J-45678901-9',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'La contraseña es incorrecta',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found',
    schema: {
      example: {
        statusCode: 401,
        message: 'Este correo no está registrado',
      },
    },
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
