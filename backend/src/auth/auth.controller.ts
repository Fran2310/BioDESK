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
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseInterceptors(FileInterceptor('logo'))
  @Post('register')
  @ApiExtraModels(CreateUserDto, CreateLabDto) // Registrar los DTOs anidados
  @ApiConsumes('multipart/form-data')
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
            logo: {
              type: 'string',
              format: 'binary',
              description: 'Logo del laboratorio (max 5MB, size 512x512px)',
              maxLength: 5242880, // 5MB
              enum: ['image/png', 'image/svg+xml'], // Especificar tipos MIME
            },
          },
        },
      ],
    },
  })
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
