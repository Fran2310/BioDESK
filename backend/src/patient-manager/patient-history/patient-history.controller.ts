import { Body, Controller, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiHeaders, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { PatientHistoryService } from './patient-history.service';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import { CreatePatientHistoryDto } from './dto/create-patient-history.dto';

@ApiBearerAuth()
@ApiTags('Historial de Paciente')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('patient-history')
export class PatientHistoryController {
  constructor(private readonly patientHistoryService: PatientHistoryService) {} 

  @Post('create')
  @ApiOperation({ summary: 'Crear un historial médico para un paciente' })
  @CheckAbility({ actions: 'create', subject: 'Patient' })
  create(
    @Body() dto: CreatePatientHistoryDto,
    @Request() req) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    const performedByUserUuid = req.user.sub;

    return this.patientHistoryService.createPatientHistory(+labId, dto, performedByUserUuid);
  }
}
