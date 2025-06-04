// src/casl/ability.factory.ts
import { Injectable } from '@nestjs/common';
import { createAppAbility, AppAbility } from './ability.type';
import { AbilityBuilder } from '@casl/ability';

/**
 * Fábrica para crear instancias de AppAbility basadas en una lista de permisos.
 * Procesa cada permiso, asignando acciones y sujetos, y opcionalmente campos específicos,
 * utilizando AbilityBuilder y createAppAbility según los módulos internos de la organización.
 *
 * @param permissions Arreglo de objetos de permisos con acciones, sujeto y campos opcionales.
 * @returns Una instancia de AppAbility configurada según los permisos proporcionados.
 */
@Injectable()
export class AbilityFactory {
  /**
   * 
   * @param permissions Array de objetos, donde cada objeto debe tener:
   *    actions: String con una o varias acciones separadas por comas (por ejemplo, "read,update").
   *    subject: String que representa el recurso o entidad sobre la que se aplican las acciones.
   *    fields (opcional): String con uno o varios campos específicos separados por comas, o el valor "*" *                       o "all" para indicar todos los campos.
   * @xample const permissions = [
                                  { actions: 'read,update', subject: 'User', fields: 'name,email' },
                                  { actions: 'delete', subject: 'Lab' },
                                  { actions: 'read', subject: 'History', fields: '*' }
                                ];
    *        const ability = abilityFactory.createAbility(permissions);
   */
  createAbility(permissions: any[]): AppAbility {
    const builder = new AbilityBuilder(createAppAbility);

    // Recorre cada objeto de permiso en el arreglo permissions.
    permissions.forEach((permission) => {
      // Para cada permiso, extrae las acciones, el sujeto y los campos.
      const { actions, subject, fields } = permission;
      // Convierte el string de acciones en un array, separando por comas.
      // El método map elimina los espacios en blanco de cada acción.
      const actionList = actions.split(',').map((a) => a.trim());
      // Recorre cada acción individual obtenida del permiso.
      actionList.forEach((action) => {
        // Para cada acción, verifica si los campos están definidos y si aplican a todos los campos ("*" o "all").
        if (!fields || fields === '*' || fields === 'all') {
          builder.can(action, subject); // Si es así, otorga el permiso sobre todo el sujeto.
        } else {
          // Si no, procede a procesar los campos específicos.
          // Si hay campos específicos, los separa por comas y elimina espacios en blanco.
          const fieldList = fields.split(',').map((f) => f.trim());
          // Para cada campo específico, otorga el permiso sobre ese campo concreto del sujeto.
          fieldList.forEach((field) => {
            builder.can(action, subject, field); // Permite acciones específicas sobre campos concretos
          });
        }
      });
    });

    return builder.build();
  }
}
