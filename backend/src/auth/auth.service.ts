import { Injectable } from '@nestjs/common';
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
    const { user, lab } = await this.usersService.createSystemUserAndLab(dto);

    const payload = {
      sub: user.uuid,
      email: user.email,
      labDb: lab.dbName,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user,
      lab,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user.uuid,
      email: user.email,
      labDb: user.lab.dbName, //TODO Esto genera problemas porque se modificó la relación a m-n, el user ya no tiene un .lab
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
