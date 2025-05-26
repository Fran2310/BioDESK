// /src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
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
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
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
