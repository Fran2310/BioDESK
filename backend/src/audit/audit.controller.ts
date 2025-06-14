// /src/audit/audit.controller.ts
import {
  Controller,
  Get,
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
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('limit', ParseIntPipe) limit = 20,
    @Request() req,
    @Query('includeData', ParseBoolPipe) includeData?: boolean,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.auditService.getAuditLogs(labId, offset, limit, includeData);
  }
}
