import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiHeaders,
} from '@nestjs/swagger';
import { PropertyService } from '../services/property.service';
import { MedicTestPropertyDto } from '../dto/property.dto';
import { LabDbManageService } from 'src/prisma-manager/lab-prisma/services/lab-db-manage.service';
import { UpdateMedicTestPropertyDto } from '../dto/update-property.dto';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('[Catálogo de Exámenes] Propiedades de Exámen')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('medic-test-catalog/property')
export class MedicTestPropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly labDbManageService: LabDbManageService,
  ) {}

  @Post('create')
  @ApiOperation({
    summary: 'Crear una propiedad para un examen del catálogo',
  })
  @ApiQuery({ name: 'catalogId', type: Number, required: true })
  @ApiBody({ type: MedicTestPropertyDto })
  async createProperty(
    @Query('catalogId', ParseIntPipe) catalogId: number,
    @Body() dto: MedicTestPropertyDto,
    @Req() req: Request,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);
    return this.propertyService.createMedicTestProperty(prisma, catalogId, dto);
  }

  @Patch('update')
  @ApiOperation({
    summary: 'Actualizar una propiedad de un examen del catálogo',
  })
  @ApiQuery({ name: 'catalogId', type: Number, required: true })
  @ApiQuery({ name: 'propertyId', type: Number, required: true })
  @ApiBody({ type: UpdateMedicTestPropertyDto })
  async updateProperty(
    @Query('catalogId', ParseIntPipe) catalogId: number,
    @Query('propertyId', ParseIntPipe) propertyId: number,
    @Body() dto: UpdateMedicTestPropertyDto,
    @Req() req: Request,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);
    return this.propertyService.updateMedicTestProperty(
      prisma,
      catalogId,
      propertyId,
      dto,
    );
  }

  @Delete('delete')
  @ApiOperation({
    summary: 'Eliminar una propiedad de un examen del catálogo',
  })
  @ApiQuery({ name: 'catalogId', type: Number, required: true })
  @ApiQuery({ name: 'propertyId', type: Number, required: true })
  async deleteProperty(
    @Query('catalogId', ParseIntPipe) catalogId: number,
    @Query('propertyId', ParseIntPipe) propertyId: number,
    @Req() req: Request,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.labDbManageService.genInstanceLabDB(labId);
    return this.propertyService.deleteMedicTestProperty(
      prisma,
      catalogId,
      propertyId,
    );
  }
}
