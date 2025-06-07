// src/system-prisma/system-prisma.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SystemUser } from '@prisma/client-system';
import { SystemPrismaService } from './system-prisma.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipLabIdCheck } from 'src/auth/decorators/skip-lab-id-check.decorator';

@ApiTags('[Testing] SystemPrisma')
@Controller('system')
export class SystemPrismaController {
  constructor(private readonly systemPrisma: SystemPrismaService) {}

  // Consulta y devuelve todos los usuarios de SystemUser desde la base central.
  @SkipLabIdCheck()
  @ApiBearerAuth()
  @Get('users')
  @ApiOperation({
    summary: 'devuelve todos los usuarios de SystemUser desde la base central',
  })
  async getAll(): Promise<SystemUser[]> {
    return this.systemPrisma.systemUser.findMany();
  }
}
