// /src/audit/audit.controller.ts
import {
  Controller,
  Get,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeaders,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';

@ApiBearerAuth()
@ApiHeaders([X_LAB_ID_HEADER])
@ApiTags('Auditoría')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({
    summary: 'Obtener registros de auditoría de un laboratorio',
    description:
      'Devuelve los logs de auditoría registrados en la base del laboratorio',
  })
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
    example: ['action', 'details', 'entity'], // Ejemplo con valores
  })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiQuery({
    name: 'includeData',
    type: Boolean,
    required: false,
    example: true,
    description:
      'Indica si se debe incluir operationData (sirve para mostrar en detalle los cambios en si) en los logs',
  })
  async getAuditLogs(
    @Request() req,
    @Query('search-term') searchTerm,
    @Query('search-fields', new ParseArrayPipe({ 
      optional: true,
      items: String,
      separator: ','  
    })) searchFields: string[] = [],
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('includeData', ParseBoolPipe) includeData?: boolean,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.auditService.getAuditLogs(
      labId, 
      offset, 
      limit,
      includeData,
      searchTerm,
      searchFields);
  }
}
