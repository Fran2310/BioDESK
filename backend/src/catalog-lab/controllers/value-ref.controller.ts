import {
  Body,
  Controller,
  Delete,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeaders,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { ValueReferenceDto } from '../dto/value-ref.dto';
import { UpdateValueReferenceDto } from '../dto/update-value-ref.dto';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';
import { ValueReferenceService } from '../services/value-reference.service';

@ApiBearerAuth()
@ApiTags('[Catálogo de Exámenes] Valores de Referencia')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('medic-test-catalog/value-ref')
export class ValueRefController {
  constructor(
    private readonly valueReferenceService: ValueReferenceService,
    private readonly labDbManageService: LabDbManageService,
  ) {}

  @Post('create')
  @ApiOperation({
    summary: 'Crear un valor de referencia',
    description:
      'Crea un nuevo valor de referencia asociado a una propiedad de un examen del catálogo.',
  })
  @ApiQuery({
    name: 'propertyId',
    type: Number,
    required: true,
    description: 'ID de la propiedad del examen',
    example: 5,
  })
  @ApiBody({
    type: ValueReferenceDto,
    description: 'Datos del valor de referencia a registrar',
  })
  async createValueRef(
    @Query('propertyId', ParseIntPipe) propertyId: number,
    @Body() dto: ValueReferenceDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);
    const performedByUserUuid = req.user.sub;

    return this.valueReferenceService.createValueReference(
      prisma,
      labId,
      propertyId,
      dto,
      performedByUserUuid,
    );
  }

  @Patch('update')
  @ApiOperation({
    summary: 'Actualizar un valor de referencia',
    description:
      'Actualiza un valor de referencia existente para una propiedad del examen.',
  })
  @ApiQuery({
    name: 'propertyId',
    type: Number,
    required: true,
    example: 5,
    description: 'ID de la propiedad del examen',
  })
  @ApiQuery({
    name: 'valueRefId',
    type: Number,
    required: true,
    example: 12,
    description: 'ID del valor de referencia a actualizar',
  })
  @ApiBody({
    type: ValueReferenceDto,
    description: 'Datos nuevos para el valor de referencia',
  })
  async updateValueRef(
    @Query('propertyId', ParseIntPipe) propertyId: number,
    @Query('valueRefId', ParseIntPipe) valueRefId: number,
    @Body() dto: UpdateValueReferenceDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);
    const performedByUserUuid = req.user.sub;

    return this.valueReferenceService.updateValueReference(
      prisma,
      labId,
      propertyId,
      valueRefId,
      dto,
      performedByUserUuid,
    );
  }

  @Delete('delete')
  @ApiOperation({
    summary: 'Eliminar un valor de referencia',
    description:
      'Elimina un valor de referencia específico de una propiedad de examen.',
  })
  @ApiQuery({
    name: 'propertyId',
    type: Number,
    required: true,
    example: 5,
    description: 'ID de la propiedad del examen',
  })
  @ApiQuery({
    name: 'valueRefId',
    type: Number,
    required: true,
    example: 12,
    description: 'ID del valor de referencia a eliminar',
  })
  @ApiOperation({ summary: 'Eliminar un valor de referencia de una propiedad' })
  async deleteValueRef(
    @Query('propertyId', ParseIntPipe) propertyId: number,
    @Query('valueRefId', ParseIntPipe) valueRefId: number,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);
    const performedByUserUuid = req.user.sub;

    return this.valueReferenceService.deleteValueReference(
      prisma,
      labId,
      propertyId,
      valueRefId,
      performedByUserUuid,
    );
  }
}
