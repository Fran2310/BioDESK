import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeaders,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { MedicHistoryService } from './medic-history.service';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import { UpdateMedicHistory } from './dto/update-medic-history.dto';

@ApiBearerAuth()
@ApiTags('Historial de Paciente')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('patients')
export class MedicHistoryController {
  constructor(private readonly medicHistoryService: MedicHistoryService) {}

  // DEPRECATED: Endpoint para crear historial medico, responsabilidad delegada al crear el paciente
  /*
  @Post('medic-history')
  @ApiOperation({ summary: 'Crear un historial médico para un paciente' })
  @CheckAbility({ actions: 'create', subject: 'medicHistory' })
  create(
    @Body() dto: CreateMedicHistoryDto,
    @Request() req) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    const performedByUserUuid = req.user.sub;

    return this.medicHistoryService.createMedicHistory(+labId, dto, performedByUserUuid);
  }
  */

  @Get(':patientId/medic-history')
  @ApiOperation({ summary: 'Obtiene un historial médico de un paciente' })
  @ApiParam({
    name: 'patientId',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'includeData',
    required: false,
    type: Boolean,
  })
  @CheckAbility({ actions: 'read', subject: 'medicHistory' })
  getMedicHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query('includeData', ParseBoolPipe) includeData = false,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    return this.medicHistoryService.getMedicHistory(
      +labId,
      includeData,
      patientId,
    );
  }

  @Patch(':patientId/medic-history')
  @ApiOperation({
    summary: 'Actualizar historial médico de un paciente de un laboratorio',
  })
  @ApiParam({
    name: 'patientId',
    required: true,
    type: Number,
    description: 'Id del paciente para actualizar su historial',
  })
  @CheckAbility({ actions: 'update', subject: 'medicHistory' })
  update(
    @Param('patientId') patientId: number,
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
    );
  }

  // DEPRECATED: Endpoint para borrar historial medico, responsabilidad delegada al borrar paciente
  /*
  @Delete(':patientId/medic-history')
  @ApiOperation({ summary: 'Eliminar historial médico de un paciente' })
  @ApiParam({
    name: 'patientId',
    required: true,
    type: Number,
    description: 'Id del paciente para eliminar su historial médico',
  })
  @CheckAbility({ actions: 'delete', subject: 'medicHistory' })
  deleteMedicHistory(
    @Param('patientId') patientId: number, 
    @Request() req
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.medicHistoryService.deleteMedicHistory(
      +labId,
      performedByUserUuid,
      +patientId,
    );
  } 
  */
}
