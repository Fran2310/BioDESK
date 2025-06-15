// src/medic-test/medic-test-catalog.service.ts
import { Injectable } from '@nestjs/common';
import { CreateMedicTestDto } from './dto/create-medic-test.dto';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';

@Injectable()
export class CatalogLabService {
  constructor(private readonly labDbManageService: LabDbManageService) {}

  async createMedicTestCatalog(labId: number, dto: CreateMedicTestDto) {
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    const { name, description, price, supplies, properties } = dto;

    // Creamos un array homogéneo con objetos válidos para Prisma
    const propertiesToCreate = properties.map((prop) => {
      const base: any = {
        name: prop.name,
        ...(prop.unit && { unit: prop.unit }),
      };

      if (prop.valuesRef && prop.valuesRef.length > 0) {
        base.valueReferences = {
          create: prop.valuesRef.map((v) => ({
            range: v.range,
            gender: v.gender,
            ageGroup: v.ageGroup,
          })),
        };
      }

      return base;
    });

    const createdTest = await prisma.medicTestCatalog.create({
      data: {
        name,
        description,
        price,
        supplies,
        properties: {
          create: propertiesToCreate,
        },
      },
      include: {
        properties: {
          include: {
            valueReferences: true,
          },
        },
      },
    });

    return createdTest;
  }
}
