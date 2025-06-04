// src/lab-prisma/lab-prisma.controller.ts
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { InitDatabaseDto } from './dto/init-db.dto';
import { LabPrismaFactory } from './lab-prisma.factory';
import { LabDbManageService } from './services/lab-db-manage.service';
import { normalizeDbName } from '../common/utils/normalize-db-name';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('[Testing] LabPrisma')
@Controller('lab')
export class LabPrismaController {
  constructor(
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly labDbManageService: LabDbManageService,
  ) {}

  //obtiene todos los usuarios (LabUser) de esa base dinámica.
  @ApiBearerAuth()
  @Get(':dbName')
  @ApiOperation({
    summary: 'obtiene todos los usuarios (LabUser) de la base de datos dbName',
  })
  @ApiParam({
    name: 'dbName',
    description:
      'Nombre del laboratorio a consultar. Debe ser un nombre válido',
  })
  async getUsers(@Param('dbName') dbName: string) {
    const normalizedDbName = normalizeDbName(dbName);
    const prisma = this.labPrismaFactory.createInstanceDB(normalizedDbName);
    return prisma.role.findMany();
  }

  //crea una db y corre una migración para la DB dbName
  @ApiBearerAuth()
  @Post('init')
  @ApiOperation({
    summary: 'Inicializa una nueva base de datos',
    description: `Crea una nueva base de datos de laboratorio aplicando transformaciones automáticas:
  1. Añade prefijo "lab_" si no existe
  2. Reemplaza espacios por guiones bajos
  3. Normaliza el nombre para uso seguro en SQL
  NOTA: Esta operación es para pruebas, la base de datos del laboratorio se genera automaticamente en el endpoind Labs del modulo Lab.`,
  })
  async initDatabase(@Body() dto: InitDatabaseDto) {
    const { dbName } = dto;
    const wasCreated = await this.labDbManageService.createDatabase(dbName);
    const normalizedDbName = normalizeDbName(dbName);
    await this.labDbManageService.migrateDatabase(normalizedDbName);

    return {
      message: wasCreated
        ? `Database ${dbName} was created and initialized.`
        : `Database ${dbName} already existed. Migration ensured.`,
    };
  }
}
