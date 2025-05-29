import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

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
