// src/medic-test/medic-test.controller.ts
import {
  Body,
  Controller,
  Post,
  Request,
  BadRequestException,
  ParseIntPipe,
  Query,
  Get,
  ParseBoolPipe,
  Patch,
  Delete,
  Param,
  ParseArrayPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeaders,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogLabService } from '../services/catalog-lab.service';
import { CreateMedicTestDto } from '../dto/create-medic-test.dto';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import { UpdateMedicTestDto } from '../dto/update-medic-test.dto';

@ApiBearerAuth()
@ApiTags('Catálogo de Exámenes')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('medic-tests-catalog')
export class CatalogLabController {
  constructor(private readonly catalogLabService: CatalogLabService) {}

  @Get(':medicTestCatalogId')
  @CheckAbility({ actions: 'read', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Obtener un examen del catálogo por ID',
    description:
      'Retorna los datos de un examen específico según su ID. Puede incluir las propiedades del examen si se indica.',
  })
  @ApiParam({ name: 'medicTestCatalogId', required: false, type: Number, example: 1 })
  @ApiQuery({
    name: 'includeData',
    required: false,
    type: Boolean,
    example: true,
    description: 'Indica si se deben incluir las propiedades del examen',
  })
  async getTestById(
    @Request() req,
    @Param('medicTestCatalogId') medicTestCatalogId?: number,
    @Query('includeData', ParseBoolPipe) includeData = false,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    if (medicTestCatalogId && isNaN(medicTestCatalogId)) {
      throw new BadRequestException('El ID debe ser un número válido.');
    }
    return this.catalogLabService.getMedicTestCatalog(labId, {
      id: medicTestCatalogId,
      includeData,
    });
  }

  @Get('')
  @CheckAbility({ actions: 'read', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Listar exámenes del catálogo del laboratorio',
    description:
      'Permite obtener exámenes con paginación y opcionalmente incluir sus propiedades',
  })
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
    example: ['name', 'price', 'description'], // Ejemplo con valores
  })
  @ApiQuery({ name: 'offset', required: false, example: 0, type: Number })
  @ApiQuery({ name: 'limit', required: false, example: 20, type: Number })
  @ApiQuery({ name: 'includeData', required: false, type: Boolean })
  async getCatalogTests(
    @Request() req,
    @Query('search-term') searchTerm,
    @Query('search-fields', new ParseArrayPipe({ 
      optional: true,
      items: String,
      separator: ','
    })) searchFields: string[] = [],
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('includeData') includeData: boolean = false,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.catalogLabService.getAllMedicTestCatalog(labId, {
      offset,
      limit,
      includeData,
      searchTerm,
      searchFields,
    });
  }

  @Post('')
  @CheckAbility({ actions: 'create', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Registrar un nuevo examen en el catálogo del laboratorio',
    description:
      'Crea un examen con sus propiedades en la base de datos del laboratorio actual, en la consulta los campos unit (unidad de medida) y valuesRef (referencias de valores) son opcionales. Si se incluyen, deben ser válidos y seguir la estructura definida en el DTO. se recomienda que los valuesRef posean casos para los grupos de edad (AgeGroup) y género, revisar el DTO para conocer los tipos',
  })
  async create(@Body() dto: CreateMedicTestDto, @Request() req) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;
    return this.catalogLabService.createMedicTestCatalog(
      labId,
      dto,
      performedByUserUuid,
    );
  }

  @Patch(':medicTestCatalogId')
  @CheckAbility({ actions: 'update', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Actualizar un  examen en el catálogo del laboratorio',
    description:
      'Actualiza un examen existente en el catálogo del laboratorio. El ID del examen se pasa como parámetro de consulta. Los campos que no se envían en el cuerpo de la solicitud no se actualizarán. Asegúrate de enviar todos los campos del catalogo, ya que la actualizacion re-escribe todo el examen.',
  })
  @ApiParam({
    name: 'medicTestCatalogId',
    description: 'ID del examen a actualizar',
    required: true,
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateMedicTestDto })
  async updateMedicTestCatalog(
    @Query('medicTestCatalogId', ParseIntPipe) medicTestCatalogId: number,
    @Body() dto: UpdateMedicTestDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);

    const performedByUserUuid = req.user.sub;
    return this.catalogLabService.updateMedicTestCatalog(
      labId,
      medicTestCatalogId,
      dto,
      performedByUserUuid,
    );
  }

  @Delete(':medicTestCatalogId')
  @CheckAbility({ actions: 'delete', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Eliminar un examen del catálogo del laboratorio',
    description:
      'Elimina un examen del catálogo y todas sus propiedades y valores de referencia asociados en cascada. El ID del examen se pasa como parámetro de consulta.',
  })
  @ApiQuery({
    name: 'medicTestCatalogId',
    description: 'ID del examen a eliminar',
    required: true,
    type: Number,
    example: 1,
  })
  async deleteMedicTestCatalog(
    @Query('medicTestCatalogId', ParseIntPipe) medicTestCatalogId: number,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;
    return this.catalogLabService.deleteMedicTestCatalog(
      labId,
      medicTestCatalogId,
      performedByUserUuid,
    );
  }
}
