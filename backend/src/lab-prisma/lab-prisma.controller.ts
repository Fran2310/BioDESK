// src/lab-prisma/lab-prisma.controller.ts
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { InitDatabaseDto } from './dto/init-db.dto';
import { LabPrismaFactory } from './lab-prisma.factory';
import { LabMigrationService } from './services/lab-migration.service';
import { normalizeDbName } from '../common/utils/normalize-db-name';

@Controller('lab')
export class LabPrismaController {
  constructor(
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly labMigrationService: LabMigrationService,
  ) {}

  //obtiene todos los usuarios (LabUser) de esa base dinámica.
  @Get(':dbName')
  async getUsers(@Param('dbName') dbName: string) {
    const normalizedDbName = normalizeDbName(dbName);
    const prisma = this.labPrismaFactory.createInstanceDB(normalizedDbName);
    return prisma.role.findMany();
  }

  //crea una db y corre una migración para la DB dbName
  @Post('init')
  async initDatabase(@Body() dto: InitDatabaseDto) {
    const { dbName } = dto;
    const wasCreated = await this.labMigrationService.createDatabase(dbName);
    await this.labMigrationService.migrateDatabase(dbName);

    return {
      message: wasCreated
        ? `Database ${dbName} was created and initialized.`
        : `Database ${dbName} already existed. Migration ensured.`,
    };
  }
}
