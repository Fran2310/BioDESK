// /src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

/**
 * Servicio de autenticación que gestiona el registro, validación y login de usuarios.
 * Utiliza UserService para la gestión de usuarios y JwtService para la generación de tokens JWT.
 * - register: Registra un usuario administrador junto a un laboratorio y retorna el token de acceso y datos del laboratorio.
 * - validateUser: Valida las credenciales de un usuario por email y contraseña.
 * - login: Genera un token de acceso para usuarios asociados a laboratorios y retorna información de los laboratorios vinculados.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra un nuevo usuario administrador y su laboratorio asociado.
   * Genera un token JWT para el usuario registrado.
   * @param dto - Datos de registro que incluyen información del usuario y del laboratorio.
   * @returns Un objeto con el token de acceso y los datos del laboratorio creado.
   */
  async register(dto: RegisterDto) {
    const { uuid, labs } = await this.usersService.createUserAdminAndLab(dto);

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

  /**
   * Valida las credenciales de un usuario por email y contraseña.
   * @param email - Email del usuario a validar.
   * @param password - Contraseña del usuario a validar.
   * @returns El usuario si las credenciales son correctas, o un mensaje de error si no lo son.
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.getSystemUser({
      email: email,
      includeLabs: true, // Incluye los laboratorios asociados al usuario
    });
    if (!user) return 'not_found';

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return 'wrong_password';

    return user;
  }

  /**
   * Inicia sesión generando un token JWT para el usuario autenticado.
   * @param user - Usuario autenticado que contiene información de los laboratorios asociados.
   * @returns Un objeto con el token de acceso y los datos de los laboratorios asociados al usuario.
   */
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
