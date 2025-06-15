// src/medic-test/medic-test-catalog.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateMedicTestDto } from './dto/create-medic-test.dto';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class CatalogLabService {
  constructor(
    private readonly labDbManageService: LabDbManageService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Crea un nuevo registro en el catálogo de pruebas médicas para un laboratorio específico.
   *
   * @param labId - ID del laboratorio donde se creará la prueba.
   * @param dto - Datos de la prueba médica a registrar, incluyendo nombre, descripción, precio, insumos y propiedades.
   * @returns El objeto de la prueba médica creada, incluyendo sus propiedades y referencias de valores.
   */
  async createMedicTestCatalog(
    labId: number,
    performedByUserUuid: string,
    dto: CreateMedicTestDto,
  ) {
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);
    const { name, description, price, supplies, properties } = dto;

    // Verificar si ya existe un examen con el mismo nombre
    const existing = await prisma.medicTestCatalog.findFirst({
      where: { name },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un examen en el catalogo registrado con el nombre: ${name}`,
      );
    }

    // Preparar propiedades (Crear un array homogéneo con objetos válidos para Prisma)
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

    // 🧪 Crear el examen
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

    // 🧾 Auditoría
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'create',
      entity: 'MedicTestCatalog',
      recordEntityId: createdTest.id.toString(),
      details: `Se creó el examen "${createdTest.name}" en el catálogo del laboratorio`,
      operationData: {
        after: {
          name: createdTest.name,
          description: createdTest.description,
          price: createdTest.price,
          supplies: createdTest.supplies,
          properties: createdTest.properties.map((p) => ({
            name: p.name,
            unit: p.unit,
            valuesRef: p.valueReferences,
          })),
        },
      },
    });

    return createdTest;
  }
}
