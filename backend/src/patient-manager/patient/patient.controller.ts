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
  ParseArrayPipe,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import {
  ApiBearerAuth,
  ApiHeaders,
  ApiOperation,
  ApiParam,
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

  @Post('')
  @ApiOperation({ summary: 'Crear un paciente para un laboratorio' })
  @CheckAbility({ actions: 'create', subject: 'Patient' })
  create(@Body() dto: CreatePatientDto, @Request() req) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    const performedByUserUuid = req.user.sub;

    return this.patientService.createPatient(+labId, dto, performedByUserUuid);
  }

  @Get('')
  @CheckAbility({ actions: 'read', subject: 'Patient' })
  @ApiOperation({ summary: 'Obtiene los datos de pacientes de un laboratorio' })
  @ApiQuery({
    name: 'search-term',
    required: false,
    description: 'Término a buscar. Si no está definido devuelve la lista paginada sin búsqueda',
    example: 'Miguel',
    type: String,
  })
  @ApiQuery({
    name: 'search-fields',
    required: false,
    description: 'Campos donde buscar (array de strings) si existe un search-term. Si no está vacío devuelve la lista paginada sin búsqueda',
    type: [String], // Esto indica que es un array de strings
    isArray: true, // Esto indica que el parámetro puede recibir múltiples valores
    example: ['name', 'gender', 'email'], // Ejemplo con valores
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
    type: Number,
  })
  @ApiQuery({
    name: 'all-data',
    required: false,
    type: Boolean,
  })
  getDataPatients(
    @Query('search-term') searchTerm,
    @Query('search-fields', new ParseArrayPipe({ 
      optional: true,
      items: String,
      separator: ','
    })) searchFields: string[] = [],
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('all-data', ParseBoolPipe) all_data = false,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    return this.patientService.getAllPatients(
      +labId, 
      limit, 
      offset, 
      all_data,
      searchTerm,
      searchFields,
    );
  }

  @Get(':patientId')
  @ApiOperation({ summary: 'Obtener datos de un paciente de un laboratorio' })
  @ApiParam({ 
    name: 'patientId',
    required: true,
    type: Number,
    description: 'Id del paciente para obtener todos sus datos',
  })
  @CheckAbility({ actions: 'read', subject: 'Patient' })
  getDataPatient(
    @Param('patientId') patientId: number, 
    @Request() req) {
    const labId = Number(req.headers['x-lab-id']); // Obtenemos labId del header
    return this.patientService.getPatient(+labId, +patientId);
  }

  @Patch(':patientId') // Cambia la ruta para incluir el parámetro de path
  @ApiOperation({
    summary: 'Actualizar datos de un paciente de un laboratorio',
  })
  @ApiParam({
    name: 'patientId',
    required: true,
    type: Number,
    description: 'Id del paciente para actualizar',
  })
  @CheckAbility({ actions: 'update', subject: 'Patient' })
  update(
    @Param('patientId') patientId: number, // Cambia de Query a Param
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
  
  @Delete(':patientId')
  @ApiOperation({
    summary: 'Eliminar un paciente de un laboratorio',
  })
  @ApiParam({ // Cambia de ApiQuery a ApiParam
    name: 'patientId',
    required: true,
    type: Number,
    description: 'Id del paciente para borrar',
  })
  @CheckAbility({ actions: 'delete', subject: 'Patient' })
  delete(
    @Param('patientId') patientId: number, 
    @Request() req) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.patientService.deletePatient(
      +labId,
      +patientId,
      performedByUserUuid,
    );
  }
}
