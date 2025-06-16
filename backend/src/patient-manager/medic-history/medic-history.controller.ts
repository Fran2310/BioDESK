import { Body, Controller, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiHeaders, ApiOperation, ApiTags } from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { MedicHistoryService } from './medic-history.service';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import { CreateMedicHistoryDto } from './dto/create-medic-history.dto';

@ApiBearerAuth()
@ApiTags('Historial de Paciente')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('medic-history')
export class MedicHistoryController {
  constructor(private readonly patientHistoryService: MedicHistoryService) {} 

  @Post('create')
  @ApiOperation({ summary: 'Crear un historial médico para un paciente' })
  @CheckAbility({ actions: 'create', subject: 'Patient' })
  create(
    @Body() dto: CreateMedicHistoryDto,
    @Request() req) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    const performedByUserUuid = req.user.sub;

    return this.patientHistoryService.createMedicHistory(+labId, dto, performedByUserUuid);
  }
}
