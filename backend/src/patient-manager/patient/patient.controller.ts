import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Headers,
  Request,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import {
  ApiBearerAuth,
  ApiHeaders,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';

@ApiBearerAuth()
@ApiTags('Pacientes')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('create')
  @ApiOperation({ summary: 'Crear un paciente para un laboratorio' })
  @CheckAbility({ actions: 'create', subject: 'Patient' })
  create(@Body() dto: CreatePatientDto, @Request() req) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    const performedByUserUuid = req.user.sub;

    return this.patientService.createPatient(+labId, dto, performedByUserUuid);
  }

  @CheckAbility({ actions: 'read', subject: 'Patient' })
  @Get('data-patients')
  @ApiOperation({ summary: 'Obtiene los datos de pacientes de un laboratorio' })
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
  getDataPatients(
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('all-data', ParseBoolPipe) all_data = false,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    return this.patientService.getAllPatients(+labId, limit, offset, all_data);
  }

  @Get('data-patient')
  @ApiOperation({ summary: 'Obtener datos de un paciente de un laboratorio' })
  @ApiQuery({
    name: 'patientId',
    required: true,
    type: String,
    description: 'Id del paciente para obtener todos sus datos',
  })
  @CheckAbility({ actions: 'read', subject: 'Patient' })
  getDataPatient(@Query('patientId') patientId: number, @Request() req) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    return this.patientService.getPatient(+labId, +patientId);
  }

  @Patch('update')
  @ApiOperation({
    summary: 'Actualizar datos de un paciente de un laboratorio',
  })
  @ApiQuery({
    name: 'patientId',
    required: true,
    type: String,
    description: 'Id del paciente para actualizar',
  })
  @CheckAbility({ actions: 'update', subject: 'Patient' })
  update(
    @Query('patientId') patientId: number,
    @Body() dto: UpdatePatientDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.patientService.updatePatient(
      +labId,
      +patientId,
      dto,
      performedByUserUuid,
    );
  }

  @ApiOperation({ summary: 'Eliminar un paciente de un laboratorio' })
  @ApiQuery({
    name: 'patientId',
    required: true,
    type: String,
    description: 'Id del paciente para eliminarlo',
  })
  @CheckAbility({ actions: 'delete', subject: 'Patient' })
  @Delete('delete')
  delete(@Query('patientId') patientId: number, @Request() req) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.patientService.deletePatient(
      +labId,
      +patientId,
      performedByUserUuid,
    );
  }
}
