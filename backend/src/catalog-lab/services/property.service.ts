import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateMedicTestPropertyDto } from '../dto/update-property.dto';
import { LabPrismaService } from 'src/prisma-manage/lab-prisma/services/lab-prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { MedicTestPropertyDto } from '../dto/property.dto';

@Injectable()
export class PropertyService {
  constructor(private readonly auditService: AuditService) {}

  async validateMedicTestProperty(
    prisma: LabPrismaService,
    catalogId: number,
    propertyId: number,
  ) {
    const property = await prisma.medicTestProperty.findFirst({
      where: {
        id: propertyId,
        catalogId,
      },
    });

    if (!property) {
      throw new NotFoundException(
        `No se encontró la propiedad con ID ${propertyId} para el catálogo de examen ${catalogId}`,
      );
    }

    return property;
  }

  async createMedicTestProperty(
    prisma: LabPrismaService,
    catalogId: number,
    dto: MedicTestPropertyDto,
  ) {
    // Validar que no exista una propiedad con el mismo nombre
    const exists = await prisma.medicTestProperty.findFirst({
      where: {
        name: dto.name,
        catalogId,
      },
    });

    if (exists) {
      throw new ConflictException(
        `Ya existe una propiedad con el nombre "${dto.name}" para este examen`,
      );
    }

    const created = await prisma.medicTestProperty.create({
      data: {
        name: dto.name,
        unit: dto.unit ?? undefined,
        catalogId,
      },
    });

    return created;
  }

  async updateMedicTestProperty(
    prisma: LabPrismaService,
    catalogId: number,
    propertyId: number,
    dto: UpdateMedicTestPropertyDto,
  ) {
    const property = await this.validateMedicTestProperty(
      prisma,
      catalogId,
      propertyId,
    );

    // Validar si el nombre va a cambiar y ya existe
    if (dto.name && dto.name !== property.name) {
      const nameExists = await prisma.medicTestProperty.findFirst({
        where: {
          name: dto.name,
          catalogId,
          NOT: { id: propertyId },
        },
      });

      if (nameExists) {
        throw new ConflictException(
          `Ya existe otra propiedad con el nombre "${dto.name}"`,
        );
      }
    }

    const updated = await prisma.medicTestProperty.update({
      where: { id: propertyId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
      },
    });

    return updated;
  }

  async deleteMedicTestProperty(
    prisma: LabPrismaService,
    catalogId: number,
    propertyId: number,
  ) {
    const property = await this.validateMedicTestProperty(
      prisma,
      catalogId,
      propertyId,
    );

    await prisma.medicTestProperty.delete({
      where: { id: propertyId },
    });

    return { message: `Propiedad eliminada correctamente` };
  }
}
