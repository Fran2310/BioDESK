import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Patch,
    Request,
    Query,
    ParseIntPipe,
    ParseBoolPipe,
  } from '@nestjs/common';
  import { RequestMedicTestService } from './request-medic-test.service';
  import { CreateRequestMedicTestDto } from './dto/create-request-medic-test.dto';
  import { UpdateRequestMedicTest } from './dto/update-request-medic-test.dto';
  import {
    ApiBearerAuth,
    ApiHeaders,
    ApiOperation,
    ApiQuery,
    ApiTags,
  } from '@nestjs/swagger';
  import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
  import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
  

//TODO Asegurar que el pacientId enviado si le pertenece el requestMedicId

  @ApiBearerAuth()
  @ApiTags('Peticiones de Exámenes Médicos')
  @ApiHeaders([X_LAB_ID_HEADER])
  @Controller('request-medic-tests')
  export class RequestMedicTestController {
    constructor(
      private readonly requestMedicTestService: RequestMedicTestService,
    ) {}
  
    @Post('create/:patientId')
    @ApiOperation({ summary: 'Crear una petición de examen médico para un paciente' })
    @CheckAbility({ actions: 'create', subject: 'RequestMedicTest' })
    create(
      @Param('patientId', ParseIntPipe) patientId: number,
      @Body() dto: CreateRequestMedicTestDto,
      @Request() req,
    ) {
      const labId = Number(req.headers['x-lab-id']);
      const performedByUserUuid = req.user.sub;
  
      return this.requestMedicTestService.createRequestMedicTest(
        labId,
        patientId,
        dto,
        performedByUserUuid,
      );
    }
  
    @Get('all')
    @ApiOperation({ summary: 'Obtener todas las peticiones de exámenes de un paciente o historial' })
    @CheckAbility({ actions: 'read', subject: 'RequestMedicTest' })
    @ApiQuery({ name: 'all-data', required: false, type: Boolean, description: 'Devuelve todos los campos, incluyendo resultados' })
    @ApiQuery({ name: 'patientId', required: false, type: Number, description: 'ID del paciente para buscar su historial activo' })
    @ApiQuery({ name: 'medicHistoryId', required: false, type: Number, description: 'ID del historial médico' })
    getAll(
      @Request() req,
      @Query('all-data', new ParseBoolPipe({ optional: true })) all_data = false,
      @Query('patientId', new ParseIntPipe({ optional: true })) patientId?: number,
      @Query('medicHistoryId', new ParseIntPipe({ optional: true })) medicHistoryId?: number,
    ) {
      const labId = Number(req.headers['x-lab-id']);
      return this.requestMedicTestService.getAllRequestsMedicTestFromOne(
        labId,
        all_data,
        medicHistoryId,
        patientId,
      );
    }
  
    @Get(':requestMedicTestId')
    @ApiOperation({ summary: 'Obtener una petición de examen médico por su ID' })
    @CheckAbility({ actions: 'read', subject: 'RequestMedicTest' })
    @ApiQuery({ name: 'all-data', required: false, type: Boolean, description: 'Devuelve todos los campos, incluyendo resultados' })
    getOne(
      @Request() req,
      @Param('requestMedicTestId', ParseIntPipe) requestMedicTestId: number,
      @Query('all-data', new ParseBoolPipe({ optional: true })) all_data = false,
    ) {
      const labId = Number(req.headers['x-lab-id']);
      return this.requestMedicTestService.getRequestMedicTest(
        labId,
        all_data,
        requestMedicTestId,
      );
    }
  
    @Patch('update/:requestMedicTestId')
    @ApiOperation({ summary: 'Actualizar una petición de examen médico' })
    @CheckAbility({ actions: 'update', subject: 'RequestMedicTest' })
    @ApiQuery({ name: 'patientId', required: true, type: Number, description: 'ID del paciente al que pertenece el examen' })
    update(
      @Request() req,
      @Param('requestMedicTestId', ParseIntPipe) requestMedicTestId: number,
      @Query('patientId', ParseIntPipe) patientId: number,
      @Body() dto: UpdateRequestMedicTest,
    ) {
      const labId = Number(req.headers['x-lab-id']);
      const performedByUserUuid = req.user.sub;
  
      return this.requestMedicTestService.updateRequestMedicTest(
        labId,
        requestMedicTestId,
        patientId,
        dto,
        performedByUserUuid,
      );
    }
  
    @Delete('delete/:requestMedicTestId')
    @ApiOperation({ summary: 'Eliminar una petición de examen médico' })
    @CheckAbility({ actions: 'delete', subject: 'RequestMedicTest' })
    @ApiQuery({ name: 'patientId', required: true, type: Number, description: 'ID del paciente al que pertenece el examen' })
    delete(
      @Request() req,
      @Param('requestMedicTestId', ParseIntPipe) requestMedicTestId: number,
      @Query('patientId', ParseIntPipe) patientId: number,
    ) {
      const labId = Number(req.headers['x-lab-id']);
      const performedByUserUuid = req.user.sub;
  
      return this.requestMedicTestService.deleteRequestMedicTest(
        labId,
        requestMedicTestId,
        patientId,
        performedByUserUuid,
      );
    }
  }