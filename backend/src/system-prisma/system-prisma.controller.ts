// src/system-prisma/system-prisma.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SystemUser } from '@prisma/client-system';
import { SystemPrismaService } from './system-prisma.service';
@Controller('system')
export class SystemPrismaController {
  constructor(private readonly systemPrisma: SystemPrismaService) {}

  // Consulta y devuelve todos los usuarios de SystemUser desde la base central.
  @Get('users')
  async getAll(): Promise<SystemUser[]> {
    return this.systemPrisma.systemUser.findMany();
  }
}
