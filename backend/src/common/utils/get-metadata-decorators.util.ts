// /src/common/utils/get-metadata-decorators.util.ts
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

/**
 * Recupera los valores de metadatos booleanos para un conjunto de claves específicas,
 * utilizando el Reflector de NestJS y el contexto de ejecución proporcionado.
 *
 * @param reflector Instancia de Reflector para acceder a los metadatos.
 * @param context Contexto de ejecución actual.
 * @param keys Arreglo de claves de metadatos a consultar.
 * @returns Un objeto donde cada clave corresponde a su valor booleano de metadato o undefined.
 */
export function getMetadataFlags(
  reflector: Reflector,
  context: ExecutionContext,
  keys: string[],
): Record<string, boolean | undefined> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = reflector.getAllAndOverride<boolean>(key, [
        context.getHandler(),
        context.getClass(),
      ]);
      return acc;
    },
    {} as Record<string, boolean | undefined>,
  );
}
