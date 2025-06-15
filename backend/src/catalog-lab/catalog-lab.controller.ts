// src/medic-test/medic-test.controller.ts
import { Body, Controller, Post, Request, Headers } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeaders,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogLabService } from './catalog-lab.service';
import { CreateMedicTestDto } from './dto/create-medic-test.dto';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';

@ApiBearerAuth()
@ApiTags('Catálogo de Exámenes')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('medic-test-catalog')
export class CatalogLabController {
  constructor(private readonly catalogLabService: CatalogLabService) {}

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
      performedByUserUuid,
      dto,
    );
  }
}
