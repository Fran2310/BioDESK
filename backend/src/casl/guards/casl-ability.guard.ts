// src/casl/guards/casl-ability.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CHECK_ABILITY_KEY,
  AbilityMetadata,
} from '../decorators/check-ability.decorator';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { AbilityFactory } from '../ability.factory';
import { LabService } from 'src/lab/services/lab.service';
import { Actions, Subjects } from '../ability.type';

@Injectable()
export class CaslAbilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
    private labService: LabService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredAbilities = this.reflector.get<AbilityMetadata[]>(
      CHECK_ABILITY_KEY,
      context.getHandler(),
    );
    if (!requiredAbilities) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user.sub) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const cachedData = await this.labService.getUserCached(user.sub);
    if (!cachedData) {
      throw new ForbiddenException('Permisos no encontrados');
    }

    const role = cachedData.role;

    const ability = this.abilityFactory.createAbility(role.permissions);

    const isAllowed = requiredAbilities.every(
      ({ actions, subject, fields }) => {
        const actionList = actions.split(',').map((a) => a.trim());
        const stateRequested = req.body?.state; // 👈 obtenemos el valor de state si viene

        return actionList.every((action) => {
          const typedAction = action as Actions;
          const typedSubject = subject as Subjects;

          // CASO ESPECIAL: Validar estado dinámicamente si el permiso es set_state
          if (
            typedAction === 'set_state' &&
            typedSubject === 'RequestMedicTest' &&
            stateRequested
          ) {
            return ability.can(typedAction, typedSubject, stateRequested);
          }

          // CASO NORMAL: Validación por campo o general
          if (!fields || fields === '*' || fields === 'all') {
            return ability.can(typedAction, typedSubject);
          } else {
            const fieldList = fields.split(',').map((f) => f.trim());
            return fieldList.every((field) =>
              ability.can(typedAction, typedSubject, field),
            );
          }
        });
      },
    );

    if (!isAllowed) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    return true;
  }
}
