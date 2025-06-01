// src/casl/ability.factory.ts
import { Injectable } from '@nestjs/common';
import { createAppAbility, AppAbility } from './app-ability.type';
import { AbilityBuilder } from '@casl/ability';

@Injectable()
export class AbilityFactory {
  /**
   * Fábrica para crear instancias de AppAbility basadas en una lista de permisos.
   * Procesa cada permiso, asignando acciones y sujetos, y opcionalmente campos específicos,
   * utilizando AbilityBuilder y createAppAbility según los módulos internos de la organización.
   *
   * @param permissions Arreglo de objetos de permisos con acciones, sujeto y campos opcionales.
   * @returns Una instancia de AppAbility configurada según los permisos proporcionados.
   */
  createAbility(permissions: any[]): AppAbility {
    const builder = new AbilityBuilder(createAppAbility);

    permissions.forEach((permission) => {
      const { actions, subject, fields } = permission;
      const actionList = actions.split(',').map((a) => a.trim());

      actionList.forEach((action) => {
        if (!fields || fields === '*') {
          builder.can(action, subject);
        } else {
          const fieldList = fields.split(',').map((f) => f.trim());
          builder.can(action, subject, fieldList);
        }
      });
    });

    return builder.build();
  }
}
