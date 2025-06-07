// src/lab-user/lab-user.controller.ts
import {
  Controller,
  Patch,
  Query,
  Request,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeaders,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LabUserService } from './lab-user.service';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { AssignExistingUserDto } from './dto/assign-existing-user.dto';

@ApiBearerAuth()
@ApiTags('LabUser')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('lab-user')
export class LabUserController {
  constructor(private readonly labUserService: LabUserService) {}

  @Post('assign-user-to-lab')
  @CheckAbility({ actions: 'create', subject: 'LabUser' })
  @ApiOperation({
    summary:
      'Asignar un usuario existente del sistema a un laboratorio con rol existente',
  })
  @ApiBody({ type: AssignExistingUserDto })
  async assignExistingUserToLab(
    @Body() dto: AssignExistingUserDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    console.log('ATENCION: ROLEID', dto.roleId);
    return this.labUserService.assignExistingUserToLab(
      labId,
      dto,
      req.user.sub,
    );
  }

  @Patch('assign-role')
  @CheckAbility({
    actions: 'update',
    subject: 'LabUser',
    fields: 'roleId',
  })
  @ApiOperation({
    summary: 'Actualizar/asignar el rol a un usuario del laboratorio',
    description:
      'Permite cambiar el rol de un usuario específico dentro del laboratorio actual.',
  })
  @ApiQuery({
    name: 'uuid',
    required: true,
    type: String,
    description:
      'UUID del usuario del sistema al que se le desea cambiar el rol.',
  })
  @ApiQuery({
    name: 'roleId',
    required: true,
    type: Number,
    example: 2,
    description: 'ID del nuevo rol que se le asignará al usuario.',
  })
  async updateUserRole(
    @Query('uuid') uuid: string,
    @Query('roleId', ParseIntPipe) roleId: number,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedBy = req.user.sub;

    return this.labUserService.updateLabUserRole(
      labId,
      uuid,
      roleId,
      performedBy,
    );
  }
}
