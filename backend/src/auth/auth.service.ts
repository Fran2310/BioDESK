// /src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { uuid, labs } = await this.usersService.createSystemUserAndLab(dto);

    const payload = { sub: uuid };

    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      labs: labs.map((lab) => ({
        id: lab.id,
        name: lab.name,
        rif: lab.rif,
        status: lab.status,
        createdAt: lab.createdAt,
      })),
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return 'not_found';

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return 'wrong_password';

    return user;
  }

  async login(user: any) {
    if (!user?.labs?.length) {
      throw new UnauthorizedException(
        'Este usuario no está asociado a ningún laboratorio.',
      );
    }

    const payload = {
      sub: user.uuid, // solo UUID en el token
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      labs: user.labs.map((lab) => ({
        id: lab.id,
        name: lab.name,
        status: lab.status,
        rif: lab.rif,
      })),
    };
  }
}
