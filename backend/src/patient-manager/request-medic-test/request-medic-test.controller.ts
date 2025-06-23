import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    Request,
    Query,
    ParseIntPipe,
    ParseBoolPipe,
    ParseArrayPipe,
    ParseEnumPipe,
  } from '@nestjs/common';
  import { RequestMedicTestService } from './request-medic-test.service';
  import { CreateRequestMedicTestDto } from './dto/create-request-medic-test.dto';
  import { UpdateRequestMedicTest } from './dto/update-request-medic-test.dto';
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
import { State } from 'src/casl/dto/test-state.dto';
  

//TODO Asegurar que el pacientId enviado si le pertenece el requestMedicId

  @ApiBearerAuth()
  @ApiTags('Peticiones de Exámenes Médicos')
  @ApiHeaders([X_LAB_ID_HEADER])
  @Controller('')
  export class RequestMedicTestController {
    constructor(
      private readonly requestMedicTestService: RequestMedicTestService,
    ) {}
  
  @Post('request-medic-tests')
  @ApiOperation({ summary: 'Crear una petición de examen médico para un paciente' })
  @CheckAbility({ actions: 'create', subject: 'RequestMedicTest' })
  create(
    @Body() dto: CreateRequestMedicTestDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.requestMedicTestService.createRequestMedicTest(
      labId,
      dto,
      performedByUserUuid,
    );
  }

  @Get(':medicHistoryId/request-medic-tests')
  @ApiOperation({ summary: 'Obtener todas las peticiones de exámenes de un historial médico' })
  @CheckAbility({ actions: 'read', subject: 'RequestMedicTest' })
  @ApiQuery({
    name: 'search-term',
    required: false,
    description: 'Término a buscar. Si no está definido devuelve la lista paginada sin búsqueda',
    example: '',
    type: String,
  })
  @ApiQuery({
    name: 'search-fields',
    required: false,
    description: 'Campos donde buscar (array de strings) si existe un search-term. Si está vacío devuelve la lista paginada sin búsqueda',
    type: [String], // Esto indica que es un array de strings
    isArray: true, // Esto indica que el parámetro puede recibir múltiples valores
    example: ['state', 'priority', 'observation'], // Ejemplo con valores
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
  @ApiQuery({ name: 'all-data', required: false, type: Boolean, description: 'Devuelve todos los campos, incluyendo resultados' })
  @ApiParam({ name: 'medicHistoryId', required: true, type: Number, description: 'ID del paciente para buscar su historial activo' })
  getAllFromOne(
    @Request() req,
    @Query('search-term') searchTerm,
    @Query('search-fields', new ParseArrayPipe({ 
      optional: true,
      items: String,
      separator: ','
    })) searchFields: string[] = [],
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('all-data', new ParseBoolPipe({ optional: true })) all_data = false,
    @Param('medicHistoryId', new ParseIntPipe({ optional: true })) medicHistoryId: number,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.requestMedicTestService.getAllRequestsMedicTestFromOne(
      labId,
      limit,
      offset,
      all_data,
      medicHistoryId,
      searchTerm,
      searchFields,
    );
  }

  @Get('request-medic-tests')
  @ApiOperation({ summary: 'Obtener todas las peticiones de exámenes de todos los pacientes' })
  @CheckAbility({ actions: 'read', subject: 'RequestMedicTest' })
  @ApiQuery({
    name: 'search-term',
    required: false,
    description: 'Término a buscar. Si no está definido devuelve la lista paginada sin búsqueda',
    example: '',
    type: String,
  })
  @ApiQuery({
    name: 'search-fields',
    required: false,
    description: 'Campos donde buscar (array de strings) si existe un search-term. Si está vacío devuelve la lista paginada sin búsqueda',
    type: [String], // Esto indica que es un array de strings
    isArray: true, // Esto indica que el parámetro puede recibir múltiples valores
    example: ['state', 'priority', 'observation'], // Ejemplo con valores
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
  @ApiQuery({ name: 'all-data', required: false, type: Boolean, description: 'Devuelve todos los campos, incluyendo resultados' })
  getAllFromAll(
    @Request() req,
    @Query('search-term') searchTerm,
    @Query('search-fields', new ParseArrayPipe({ 
      optional: true,
      items: String,
      separator: ','
    })) searchFields: string[] = [],
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('all-data', new ParseBoolPipe({ optional: true })) all_data = false,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.requestMedicTestService.getAllRequestsMedicTestFromAll(
      labId,
      limit,
      offset,
      all_data,
      searchTerm,
      searchFields,
    );
  }


  @Get('request-medic-tests/:requestMedicTestId')
  @ApiOperation({ summary: 'Obtener una petición de examen médico por su ID' })
  @CheckAbility({ actions: 'read', subject: 'RequestMedicTest' })
  getOne(
    @Request() req,
    @Param('requestMedicTestId', ParseIntPipe) requestMedicTestId: number,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.requestMedicTestService.getRequestMedicTest(
      labId,
      requestMedicTestId,
    );
  }

  @Put('request-medic-tests/:requestMedicTestId')
  @ApiOperation({ summary: 'Actualizar una petición de examen médico' })
  @CheckAbility({ actions: 'update', subject: 'RequestMedicTest' })
  update(
    @Request() req,
    @Param('requestMedicTestId', ParseIntPipe) requestMedicTestId: number,
    @Body() dto: UpdateRequestMedicTest,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.requestMedicTestService.updateRequestMedicTest(
      labId,
      requestMedicTestId,
      dto,
      performedByUserUuid,
    );
  }

  @Delete('request-medic-tests/:requestMedicTestId')
  @ApiOperation({ summary: 'Eliminar una petición de examen médico' })
  @CheckAbility({ actions: 'delete', subject: 'RequestMedicTest' })
  delete(
    @Request() req,
    @Param('requestMedicTestId', ParseIntPipe) requestMedicTestId: number,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.requestMedicTestService.deleteRequestMedicTest(
      labId,
      requestMedicTestId,
      performedByUserUuid,
    );
  }

  @Put('request-medic-tests/:requestMedicTestId/:state')
  @ApiOperation({ summary: 'Cambiar el estado de una petición de examen médico' })
  @ApiParam({
    name: 'state',
    required: true,
    example: 'IN_PROCESS',
    enum: State,
  })
  @CheckAbility({ actions: 'set_state', subject: 'RequestMedicTest' })
  changeState(
    @Request() req,
    @Param('requestMedicTestId', ParseIntPipe) requestMedicTestId: number,
    @Param('state', new ParseEnumPipe(State)) state: State,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.requestMedicTestService.changeStateRequestMedicTest(
      labId,
      requestMedicTestId,
      state,
      performedByUserUuid,
    );
  }
}