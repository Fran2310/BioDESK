// /src/auth/auth.controller.ts
import { Controller, Post, Body, Request, UseGuards, BadRequestException, Get } from '@nestjs/common';
import { Public } from './decorators/public.decorator'; // Ruta pública, no requiere autenticación
import { AuthService } from './auth.service';
import { MailService } from 'src/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  @Public()
  @Post('register')
  @ApiExtraModels(CreateUserDto, CreateLabDto) // Registrar los DTOs anidados
  @ApiOperation({
    summary: 'Registro de usuario',
    description: `Registra un nuevo usuario admin a un laboratorio asociado.
      Devuelve un JSON con access_token JWT si los datos son correctos y una lista de laboratorios asociados al usuario.`,
  })
  @ApiBody({
    description: 'Datos de registro',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateUserDto) },
        {
          properties: {
            lab: { $ref: getSchemaPath(CreateLabDto) },
          },
        },
      ],
    },
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
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

  @Public()
  @Post('send-token')
  @ApiOperation({
    summary: 'Solicitud de token para reestablecer la contraseña',
    description: `Envía un token de recuperación al email proporcionado. El token expira luego de 1 hora`,
  })
  @ApiBody({
    description: 'Email del usuario que solicita el token',
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'usuario@ejemplo.com',
          description: 'Email registrado en el sistema'
        }
      }
    },
    examples: {
      example1: {
        value: { email: 'usuario@ejemplo.com' }
      }
    }
  })
  async sendTokenForResetPassword(@Body('email') email: string) {
    try {
      await this.mailService.sendChangePasswordEmail(email);
      return { message: 'Token enviado al correo correctamente' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description: `Restablece la contraseña de un usuario utilizando un token de recuperación válido.
      Requiere el email del usuario, el token enviado al correo y la nueva contraseña.`,
  })
  @ApiBody({ 
    type: ResetPasswordDto,
    examples: {
      example1: {
        value: {
          email: 'usuario@ejemplo.com',
          token: 'ABC123',
          newPassword: 'NuevaContraseñaSegura123'
        }
      }
    } 
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      await this.authService.resetPassword(dto);
      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
