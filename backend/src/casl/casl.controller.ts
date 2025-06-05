// /src/casl/casl.controller.ts
import {
  Body,
  Controller,
  Post,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import { TestStateDto } from './dto/test-state.dto';
import { LabService } from 'src/lab/services/lab.service';
import { AbilityFactory } from 'src/casl/ability.factory';
import { ApiBearerAuth, ApiHeaders, ApiTags } from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
/**
 * Controlador para pruebas de autorización con CASL.
 */
@ApiTags('[Testing] CASL')
@Controller('casl')
export class CaslController {
  constructor(
    private readonly labService: LabService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  @ApiBearerAuth()
  @CheckAbility(
    { actions: 'read, delete', subject: 'Patient' },
    {
      actions: 'set_state',
      subject: 'RequestMedicTest',
      fields: 'IN_PROCESS,TO_VERIFY',
    },
  )
  @CheckAbility({ actions: 'manage', subject: 'all' })
  @Post('authorization')
  @ApiHeaders([X_LAB_ID_HEADER])
  async testStatePermission(@Body() dto: TestStateDto, @Req() req) {
    const uuid = req.user.sub;
    const cached = await this.labService.getUserCached(uuid);

    if (!cached) {
      throw new ForbiddenException('Permisos no encontrados');
    }
    /*
      Validacion de permisos directo en el controller:
      Solo necesaria si se desea una respuesta personalizada, sino la autorizacion igual funcionara con la respuesta predeterminada del Guard global CaslAbilityGuard
    */
    /*
    const ability = this.abilityFactory.createAbility(
      cached.permissions.permissions,
    );
    
    const canAssign = ability.can('set_state', 'RequestMedicTest', dto.state);
    if (!canAssign) {
      throw new ForbiddenException(
        `No tienes permiso para asignar el estado "${dto.state}"`,
      );
    }
  */
    return {
      message: 'permisos permitidos',
    };
  }
}
