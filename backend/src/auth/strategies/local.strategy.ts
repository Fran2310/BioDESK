// /src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { validate } from 'class-validator';
import { Request } from 'express';
import { LoginDto } from '../dto/login.dto';
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  /*
    Validar email y password -> emitir JWT
  */
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    // Crea instancia del DTO para validación
    const loginDto = new LoginDto();
    loginDto.email = email;
    loginDto.password = password;

    // Valida usando class-validator
    const errors = await validate(loginDto);

    if (errors.length > 0) {
      // Personaliza mensajes de error si lo deseas
      const errorMessages = errors.map((error) =>
        Object.values(error.constraints || {}).join(', '),
      );
      throw new UnauthorizedException(
        `Datos inválidos: ${errorMessages.join(', ')}`,
      );
    }

    const user = await this.authService.validateUser(email, password);

    if (user === null) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (user === 'not_found') {
      throw new NotFoundException('Este correo no está registrado');
    }

    if (user === 'wrong_password') {
      throw new UnauthorizedException('La contraseña es incorrecta');
    }

    return user;
  }
}
