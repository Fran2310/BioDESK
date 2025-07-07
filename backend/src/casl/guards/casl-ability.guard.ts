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
import { getMetadataFlags } from 'src/common/utils/get-metadata-decorators.util';
import { AbilityFactory } from '../ability.factory';
import { LabService } from 'src/lab/services/lab.service';
import { Actions, Subjects } from '../ability.type';

/**
 * Guard de autorización basado en CASL que valida si el usuario autenticado tiene los permisos necesarios
 * para ejecutar la acción solicitada según las habilidades requeridas en los metadatos del handler.
 * Permite acceso público si el endpoint está marcado como público y lanza ForbiddenException si el usuario
 * no está autenticado o no tiene permisos suficientes. Soporta validación dinámica de estados para acciones específicas.
 *
 * @param context Contexto de ejecución de la petición HTTP.
 * @returns Promise<boolean> Indica si el acceso está permitido.
 */
@Injectable()
export class CaslAbilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
    private labService: LabService,
  ) {}

  /**
   * Determina si el usuario tiene permisos para acceder al recurso solicitado según las habilidades requeridas.
   * Permite el acceso si la ruta es pública, si no se requieren habilidades específicas, o si el usuario autenticado posee los permisos necesarios.
   * Lanza ForbiddenException si el usuario no está autenticado, no tiene permisos cacheados, o no cumple con las habilidades requeridas.
   *
   * @param context Contexto de ejecución de NestJS.
   * @returns Promise<boolean> True si el acceso está permitido, de lo contrario lanza una excepción.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadataKeys = [IS_PUBLIC_KEY];

    //Obtener todos los flags
    const flags = getMetadataFlags(this.reflector, context, metadataKeys);
    if (flags.isPublic) return true;

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
        const stateRequested = req.path.split('/').pop(); // 👈 obtenemos el valor de state si viene

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
