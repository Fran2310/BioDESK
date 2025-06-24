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
import { intelligentSearch } from 'src/common/services/intelligentSearch.service';

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
    options: { id?: number; includeData: boolean },
  ) {
    const { id, includeData = false } = options;

    if (!id) {
      throw new BadRequestException(
        'Debe proporcionar un ID del examen.',
      );
    }

    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    const where = {
      id
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
        `No se encontró un examen con ID: ${id}`,
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
    options: { offset?: number; limit?: number; includeData?: boolean; searchTerm?: string; searchFields?: string[] },
  ) {
    try {
      const { offset = 0, limit = 20, includeData = false, searchTerm, searchFields } = options;
  
      const prisma = await this.labDbManageService.genInstanceLabDB(labId);
  
      // El modelo principal para la búsqueda es 'medicTestCatalog'
      const medicTestCatalogModel = prisma.medicTestCatalog;
  
      const defaultSearchFields = [
        'name', // Ejemplo: buscar por nombre del examen
        'price', // Ejemplo: buscar por código del examen
      ];
  
      // Opciones para incluir datos relacionados si includeData es true
      const includeOptions = includeData
        ? {
            properties: {
              include: {
                valueReferences: true,
              },
            },
          }
        : undefined;
  
      // Construimos el objeto de opciones para la búsqueda inteligente
      const searchOptions = {
        skip: offset,
        take: limit,
        include: includeOptions, // Pasamos las opciones de inclusión
        orderBy: {
          name: 'asc', // O 'id' o cualquier otro campo relevante para ordenar el catálogo
        },
      };
  
      // Lógica principal: usar intelligentSearch
      const { results: data, total } = await intelligentSearch(
        medicTestCatalogModel, // 1. El modelo a buscar (MedicTestCatalog)
        searchOptions,         
        searchTerm,           
        searchFields || defaultSearchFields, 
      );
  
      return {
        total,
        offset,
        limit,
        data,
      };
  
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      // Envuelve otros errores en un NotFoundException genérico
      throw new NotFoundException(`Error al obtener el catálogo de exámenes médicos: ${error.message}`);
    }
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
    dto: CreateMedicTestDto,
    performedByUserUuid: string,
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

      if (prop.valueReferences && prop.valueReferences.length > 0) {
        base.valueReferences = {
          create: prop.valueReferences.map((v) => ({
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
            valueReferences: p.valueReferences,
          })),
        },
      },
    });

    return createdTest;
  }

  /**
   * Valida que no exista otro examen con el mismo nombre (case-insensitive).
   * Si se pasa un testId, lo excluye de la búsqueda (para update).
   */
  private async validateUniqueTestName(
    prisma: any,
    name: string,
    testId?: number,
  ) {
    const where: any = { name: { equals: name, mode: 'insensitive' } };
    if (testId) {
      where.id = { not: testId };
    }
    const existing = await prisma.medicTestCatalog.findFirst({ where });
    if (existing) {
      throw new ConflictException(
        `Ya existe un examen con el nombre "${name}".`,
      );
    }
  }

  async updateMedicTestCatalog(
    labId: number,
    testId: number,
    dto: UpdateMedicTestDto,
    performedByUserUuid: string,
  ) {
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    // Validar nombre único (si se va a cambiar el nombre)
    if (dto.name) {
      await this.validateUniqueTestName(prisma, dto.name, testId);
    }

    // Obtener datos antes de la actualización
    const beforeUpdate = await prisma.medicTestCatalog.findUnique({
      where: { id: testId },
      include: {
        properties: {
          include: { valueReferences: true },
        },
      },
    });

    if (!beforeUpdate) {
      throw new NotFoundException(
        `No se encontró el examen con ID ${testId} en el catálogo.`,
      );
    }

    const updatedTest = await prisma.$transaction(async (tx) => {
      // eliminar propiedades y referencias de valores existentes
      await tx.medicTestProperty.deleteMany({
        where: { catalogId: testId },
      });

      // Actualizar el examen principal
      const updated = await tx.medicTestCatalog.update({
        where: { id: testId },
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          supplies: dto.supplies,
          properties: {
            create:
              dto.properties?.map((prop) => ({
                name: prop.name,
                unit: prop.unit,
                valueReferences: {
                  create:
                    prop.valueReferences?.map((v) => ({
                      range: v.range,
                      gender: v.gender,
                      ageGroup: v.ageGroup,
                    })) || [],
                },
              })) || [],
          },
        },
        include: {
          properties: { include: { valueReferences: true } },
        },
      });

      return updated;
    });

    // Auditoría (ahora incluye before y after)
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'update',
      entity: 'MedicTestCatalog',
      recordEntityId: updatedTest.id.toString(),
      details: `Actualizó el examen "${updatedTest.name}" en el catálogo del laboratorio`,
      operationData: { before: beforeUpdate, after: updatedTest },
    });

    return updatedTest;
  }

  /**
   * Elimina un examen del catálogo y todas sus relaciones (propiedades y valores de referencia) en cascada.
   */
  async deleteMedicTestCatalog(
    labId: number,
    testId: number,
    performedByUserUuid: string,
  ) {
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);

    // Validar que el examen exista antes de eliminar
    const existingTest = await prisma.medicTestCatalog.findUnique({
      where: { id: testId },
      include: {
        properties: {
          include: { valueReferences: true },
        },
      },
    });

    if (!existingTest) {
      throw new NotFoundException(
        `No se encontró el examen con ID ${testId} en el catálogo.`,
      );
    }

    // Eliminar el examen (las propiedades y valores de referencia se eliminan en cascada)
    await prisma.medicTestCatalog.delete({
      where: { id: testId },
    });

    // Auditoría
    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'delete',
      entity: 'MedicTestCatalog',
      recordEntityId: testId.toString(),
      details: `Eliminó el examen "${existingTest.name}" del catálogo del laboratorio`,
      operationData: { before: existingTest },
    });

    return { success: true, deletedId: testId };
  }
}
