// src/medic-test/medic-test-catalog.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMedicTestDto } from '../dto/create-medic-test.dto';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';
import { AuditService } from 'src/audit/audit.service';
import { Prisma } from '@prisma/client-lab';
import { UpdateMedicTestDto } from '../dto/update-medic-test.dto';
import { UpdateMedicTestPropertyDto } from '../dto/update-property.dto';
import { UpdateValueReferenceDto } from '../dto/update-value-ref.dto';
import { ValueReferenceDto } from '../dto/value-ref.dto';

@Injectable()
export class CatalogLabService {
  constructor(
    private readonly labDbManageService: LabDbManageService,
    private readonly auditService: AuditService,
  ) {}

  async validateMedicTestCatalog(prisma, testId: number) {
    const existingTest = await prisma.medicTestCatalog.findUnique({
      where: { id: testId },
      include: {
        properties: {
          include: {
            valueReferences: true,
          },
        },
      },
    });

    if (!existingTest) {
      throw new NotFoundException(
        `No se encontró el examen con ID ${testId} en el catálogo.`,
      );
    }

    return existingTest;
  }

  /**
   * Obtiene un examen del catálogo de pruebas médicas por ID o nombre para un laboratorio específico.
   *
   * Lanza una NotFoundException si no se proporciona ningún criterio de búsqueda o si no se encuentra el examen.
   * Lanza una ConflictException si se proporcionan ambos criterios (ID y nombre) simultáneamente.
   *
   * @param labId ID del laboratorio.
   * @param options Objeto con ID, nombre y si se deben incluir datos relacionados.
   * @returns El examen encontrado, incluyendo propiedades y referencias si se solicita.
   */
  async getMedicTestCatalog(
    labId: number,
    options: { id?: number; name?: string; includeData: boolean },
  ) {
    const { id, name, includeData = false } = options;

    if (!id && !name) {
      throw new BadRequestException(
        'Debe proporcionar un ID o nombre del examen.',
      );
    } else if (id && name) {
      throw new ConflictException(
        'No se puede proporcionar ambos criterios de busqueda ID y nombre del examen.',
      );
    }

    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    const where = id
      ? { id }
      : {
          name: {
            equals: name,
            mode: Prisma.QueryMode.insensitive, // que que no sea case sensitive
          },
        };

    const catalog = await prisma.medicTestCatalog.findFirst({
      where,
      include: includeData
        ? {
            properties: {
              include: {
                valueReferences: true,
              },
            },
          }
        : null,
    });

    if (!catalog) {
      throw new NotFoundException(
        `No se encontró un examen con ${id ? 'ID: ' + id : 'nombre: ' + name}`,
      );
    }

    return catalog;
  }

  /**
   * Recupera una lista paginada del catálogo de pruebas médicas para un laboratorio específico.
   *
   * @param labId - ID del laboratorio.
   * @param options - Opciones de paginación y de inclusión de datos adicionales.
   * @returns Un objeto con el total de registros, offset, limit y los datos solicitados.
   */
  async getAllMedicTestCatalog(
    labId: number,
    options: { offset?: number; limit?: number; includeData?: boolean },
  ) {
    const { offset = 0, limit = 20, includeData = false } = options;

    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    const [total, data] = await Promise.all([
      prisma.medicTestCatalog.count(),
      prisma.medicTestCatalog.findMany({
        skip: offset,
        take: limit,
        include: includeData
          ? {
              properties: {
                include: {
                  valueReferences: true,
                },
              },
            }
          : undefined,
      }),
    ]);

    return {
      total,
      offset,
      limit,
      data,
    };
  }

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

      if (prop.valuesReferences && prop.valuesReferences.length > 0) {
        base.valueReferences = {
          create: prop.valuesReferences.map((v) => ({
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
            valuesReferences: p.valueReferences,
          })),
        },
      },
    });

    return createdTest;
  }
}
