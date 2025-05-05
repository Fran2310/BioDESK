// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Importa bcrypt para comparar contraseñas
import { SystemPrismaService } from '../system-prisma/system-prisma.service'; // Importa el servicio de Prisma System
import { SystemUser } from '@prisma/client-system'; // Importa el tipo SystemUser


@Injectable()
export class AuthService {
  constructor(
    private systemPrisma: SystemPrismaService, // Inyecta SystemPrismaService
    private jwtService: JwtService, // Inyecta JwtService
  ) {}

  // Método para validar usuario por email y password
  async validateUser(email: string, pass: string): Promise<SystemUser | null> {
    // Busca el usuario en la base de datos del sistema usando Prisma
    const user = await this.systemPrisma.systemUser.findUnique({
      where: { email },
    });

    if (!user) {
      return null; // Usuario no encontrado
    }

    // Compara la contraseña proporcionada con la contraseña hasheada en la DB
    const isMatch = await bcrypt.compare(pass, user.password);

    if (!isMatch) {
      return null; // Contraseña incorrecta
    }

    // Si el usuario y la contraseña son correctos, retorna el objeto usuario
    // (sin la contraseña)
    const { password, ...result } = user;
    return result as SystemUser;
  }

  // Método para generar el JWT para un usuario validado
  async login(user: SystemUser) {
    // Define el payload del token (información que quieres incluir)
    // Usa 'sub' (subject) como un identificador único (ID del usuario)
    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload), // Firma el payload para crear el token
    };
  }
}