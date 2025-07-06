import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { LabPrismaService } from 'src/prisma-manager/lab-prisma/services/lab-prisma.service';
import { ValueReferenceDto } from '../dto/value-ref.dto';
import { UpdateValueReferenceDto } from '../dto/update-value-ref.dto';

@Injectable()
export class ValueReferenceService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Valida la existencia de un valor de referencia asociado a una propiedad específica.
   * Lanza una NotFoundException si no se encuentra el valor de referencia con los IDs proporcionados.
   *
   * @param prisma Instancia de LabPrismaService para acceder a la base de datos.
   * @param propertyId ID de la propiedad del examen médico.
   * @param valueRefId ID del valor de referencia a validar.
   * @returns El valor de referencia encontrado.
   * @throws NotFoundException Si no existe el valor de referencia para los IDs dados.
   */
  async validateValueReference(
    prisma: LabPrismaService,
    propertyId: number,
    valueRefId: number,
  ) {
    const valueRef = await prisma.valueReference.findFirst({
      where: {
        id: valueRefId,
        medicTestPropertyId: propertyId,
      },
    });

    if (!valueRef) {
      throw new NotFoundException(
        `No se encontró el valor de referencia con ID ${valueRefId} para la propiedad ${propertyId}`,
      );
    }

    return valueRef;
  }

  /**
   * Crea un nuevo registro de rango de valor de referencia asociado a una propiedad de prueba médica.
   * Registra la acción en el servicio de auditoría con los detalles de la operación.
   *
   * @param prisma Instancia de LabPrismaService para operaciones de base de datos.
   * @param labId ID del laboratorio asociado.
   * @param propertyId ID de la propiedad de la prueba médica.
   * @param dto Datos del rango de valor de referencia a crear.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns El registro de valor de referencia creado.
   */
  async createValueReference(
    prisma: LabPrismaService,
    labId: number,
    propertyId: number,
    dto: ValueReferenceDto,
    performedByUserUuid: string,
  ) {
    const created = await prisma.valueReference.create({
      data: {
        range: dto.range,
        gender: dto.gender,
        ageGroup: dto.ageGroup,
        medicTestPropertyId: propertyId,
      },
    });

    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'create',
      entity: 'ValueReference',
      recordEntityId: created.id.toString(),
      details: `Se creó un nuevo rango de valor de referencia para la propiedad ${propertyId}`,
      operationData: {
        after: created,
      },
    });

    return created;
  }

  /**
   * Actualiza un registro de ValueReference asociado a una propiedad específica.
   * Valida la existencia y pertenencia del registro antes de actualizar los campos permitidos.
   * Registra la acción en el servicio de auditoría con los datos previos y posteriores a la actualización.
   *
   * @param prisma Instancia de LabPrismaService para operaciones de base de datos.
   * @param labId Identificador del laboratorio.
   * @param propertyId Identificador de la propiedad asociada.
   * @param valueRefId Identificador del valor de referencia a actualizar.
   * @param dto Datos de actualización (parcial) para el valor de referencia.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns El registro actualizado de ValueReference.
   */
  async updateValueReference(
    prisma: LabPrismaService,
    labId: number,
    propertyId: number,
    valueRefId: number,
    dto: UpdateValueReferenceDto,
    performedByUserUuid: string,
  ) {
    // Verificar que exista el valueReference y que pertenezca a la propiedad indicada
    const valueRef = await this.validateValueReference(
      prisma,
      propertyId,
      valueRefId,
    );

    const before = { ...valueRef };

    const updated = await prisma.valueReference.update({
      where: { id: valueRefId },
      data: {
        ...(dto.range && { range: dto.range }),
        ...(dto.gender && { gender: dto.gender }),
        ...(dto.ageGroup && { ageGroup: dto.ageGroup }),
      },
    });

    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'update',
      entity: 'ValueReference',
      recordEntityId: updated.id.toString(),
      details: `Actualizó un valor de referencia de la propiedad ${propertyId}`,
      operationData: {
        before,
        after: updated,
      },
    });

    return updated;
  }

  /**
   * Elimina un valor de referencia asociado a una propiedad específica en un laboratorio.
   * Registra la acción en el servicio de auditoría incluyendo los datos previos a la eliminación.
   *
   * @param prisma Instancia de LabPrismaService para operaciones de base de datos.
   * @param labId ID del laboratorio.
   * @param propertyId ID de la propiedad asociada.
   * @param valueRefId ID del valor de referencia a eliminar.
   * @param performedByUserUuid UUID del usuario que realiza la acción.
   * @returns Mensaje de confirmación de eliminación.
   */
  async deleteValueReference(
    prisma: LabPrismaService,
    labId: number,
    propertyId: number,
    valueRefId: number,
    performedByUserUuid: string,
  ) {
    const valueRef = await this.validateValueReference(
      prisma,
      propertyId,
      valueRefId,
    );

    const deleted = await prisma.valueReference.delete({
      where: { id: valueRefId },
    });

    await this.auditService.logAction(labId, performedByUserUuid, {
      action: 'delete',
      entity: 'ValueReference',
      recordEntityId: deleted.id.toString(),
      details: `Se eliminó un valor de referencia para la propiedad ${propertyId}`,
      operationData: {
        before: valueRef,
      },
    });

    return { message: `Valor de referencia eliminado correctamente.` };
  }
}
