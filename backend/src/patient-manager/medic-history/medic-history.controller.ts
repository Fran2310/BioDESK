import { Body, Controller, Delete, Get, ParseBoolPipe, ParseIntPipe, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiHeaders, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { MedicHistoryService } from './medic-history.service';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import { CreateMedicHistoryDto } from './dto/create-medic-history.dto';
import { UpdateMedicHistory } from './dto/update-medic-history.dto';

@ApiBearerAuth()
@ApiTags('Historial de Paciente')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('patients')
export class MedicHistoryController {
  constructor(private readonly medicHistoryService: MedicHistoryService) {} 

  @Post('create')
  @ApiOperation({ summary: 'Crear un historial médico para un paciente' })
  @CheckAbility({ actions: 'create', subject: 'medicHistory' })
  create(
    @Body() dto: CreateMedicHistoryDto,
    @Request() req) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    const performedByUserUuid = req.user.sub;

    return this.medicHistoryService.createMedicHistory(+labId, dto, performedByUserUuid);
  }

  @Get('medic-histories')
  @ApiOperation({ summary: 'Obtiene historiales médicos' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'all-data',
    required: false,
    type: Boolean,
  })
  @CheckAbility({ actions: 'read', subject: 'medicHistory' })
  getMedicHistories(
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('all-data', ParseBoolPipe) all_data = false,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    return this.medicHistoryService.getAllMedicHistories(+labId, limit, offset, all_data);
  }

  @Get('medic-history')
  @ApiOperation({ summary: 'Obtiene un historial médico de un paciente' })
  @ApiQuery({
    name: 'patientId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'all-data',
    required: false,
    type: Boolean,
  })
  @CheckAbility({ actions: 'read', subject: 'medicHistory' })
  getMedicHistory(
    @Query('patientId', ParseIntPipe) patientId,
    @Query('all-data', ParseBoolPipe) all_data = false,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    return this.medicHistoryService.getMedicHistory(+labId, all_data, patientId);
  }

  @Patch('update-history')
  @ApiOperation({
    summary: 'Actualizar datos de un paciente de un laboratorio',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    type: Number,
    description: 'Id del paciente para actualizar',
  })
  @ApiQuery({
    name: 'medicHistoryId',
    required: false,
    type: Number,
    description: 'Id del medic history para actualizar',
  })
  @CheckAbility({ actions: 'update', subject: 'medicHistory' })
  update(
    @Query('patientId') patientId: number,
    @Query('medicHistoryId') medicHistoryId: number,

    @Body() dto: UpdateMedicHistory,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.medicHistoryService.updateMedicHistory(
      +labId,
      dto,
      performedByUserUuid,
      +patientId,
      +medicHistoryId,
    );
  }

  @ApiOperation({ summary: 'Eliminar historial médico de un paciente' })
  @ApiQuery({
    name: 'patientId',
    required: false,
    type: Number,
    description: 'Id del paciente para eliminar su historial médico',
  })
  @ApiQuery({
    name: 'medicHistoryId',
    required: false,
    type: Number,
    description: 'Id del paciente para eliminarlo',
  })
  @CheckAbility({ actions: 'delete', subject: 'medicHistory' })
  @Delete('delete-history')
  deleteMedicHistory(
    @Query('patientId') patientId: number, 
    @Query('medicHistoryId') medicHistoryId: number, 
    @Request() req
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.medicHistoryService.deleteMedicHistory(
      +labId,
      performedByUserUuid,
      +patientId,
      +medicHistoryId,
    );
  }
}
