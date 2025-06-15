import { Controller, Get, Post, Body, Param, Delete, Patch, Headers } from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Controller('patients') // Cambiado de 'labs/:labId/patients' a 'patients'
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(
    @Headers('x-lab-id') labId: string, // Obtenemos labId del header
    @Body() dto: CreatePatientDto
  ) {
    return this.patientService.create(+labId, dto);
  }

  @Get()
  findAll(@Headers('x-lab-id') labId: string) {
    return this.patientService.findAll(+labId);
  }

  @Get(':patientId')
  findOne(
    @Headers('x-lab-id') labId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.patientService.findOne(+labId, +patientId);
  }

  @Patch(':patientId')
  update(
    @Headers('x-lab-id') labId: string,
    @Param('patientId') patientId: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientService.update(+labId, +patientId, dto);
  }

  @Delete(':patientId')
  remove(
    @Headers('x-lab-id') labId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.patientService.remove(+labId, +patientId);
  }
}