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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeaders,
  ApiOperation,
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
@Controller('medic-test-catalog')
export class CatalogLabController {
  constructor(private readonly catalogLabService: CatalogLabService) {}

  @Get('get-by')
  @CheckAbility({ actions: 'read', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Obtener un examen del catálogo por ID o nombre',
    description:
      'Retorna los datos de un examen específico según su ID o nombre. Puede incluir las propiedades del examen si se indica.',
  })
  @ApiQuery({ name: 'id', required: false, type: Number, example: 1 })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    example: 'Hemograma',
  })
  @ApiQuery({
    name: 'includeData',
    required: false,
    type: Boolean,
    example: true,
    description: 'Indica si se deben incluir las propiedades del examen',
  })
  async getTestByIdOrName(
    @Request() req,
    @Query('id') id?: number,
    @Query('name') name?: string,
    @Query('includeData', ParseBoolPipe) includeData = false,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    if (id && isNaN(id)) {
      throw new BadRequestException('El ID debe ser un número válido.');
    }
    return this.catalogLabService.getMedicTestCatalog(labId, {
      id,
      name,
      includeData,
    });
  }

  @Get('get-all')
  @CheckAbility({ actions: 'read', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Listar exámenes del catálogo del laboratorio',
    description:
      'Permite obtener exámenes con paginación y opcionalmente incluir sus propiedades',
  })
  @ApiQuery({ name: 'offset', required: false, example: 0, type: Number })
  @ApiQuery({ name: 'limit', required: false, example: 20, type: Number })
  @ApiQuery({ name: 'includeData', required: false, type: Boolean })
  async getCatalogTests(
    @Request() req,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('includeData') includeData: boolean = false,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.catalogLabService.getAllMedicTestCatalog(labId, {
      offset,
      limit,
      includeData,
    });
  }

  @Post('create')
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

  @Patch('update')
  @CheckAbility({ actions: 'update', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Actualizar un  examen en el catálogo del laboratorio',
    description:
      'Actualiza un examen existente en el catálogo del laboratorio. El ID del examen se pasa como parámetro de consulta. Los campos que no se envían en el cuerpo de la solicitud no se actualizarán. Asegúrate de enviar todos los campos del catalogo, ya que la actualizacion re-escribe todo el examen.',
  })
  @ApiQuery({
    name: 'id',
    description: 'ID del examen a actualizar',
    required: true,
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateMedicTestDto })
  async updateMedicTestCatalog(
    @Query('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicTestDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);

    const performedByUserUuid = req.user.sub;
    return this.catalogLabService.updateMedicTestCatalog(
      labId,
      id,
      dto,
      performedByUserUuid,
    );
  }

  @Delete('delete')
  @CheckAbility({ actions: 'delete', subject: 'MedicTestCatalog' })
  @ApiOperation({
    summary: 'Eliminar un examen del catálogo del laboratorio',
    description:
      'Elimina un examen del catálogo y todas sus propiedades y valores de referencia asociados en cascada. El ID del examen se pasa como parámetro de consulta.',
  })
  @ApiQuery({
    name: 'id',
    description: 'ID del examen a eliminar',
    required: true,
    type: Number,
    example: 1,
  })
  async deleteMedicTestCatalog(
    @Query('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;
    return this.catalogLabService.deleteMedicTestCatalog(
      labId,
      id,
      performedByUserUuid,
    );
  }
}
