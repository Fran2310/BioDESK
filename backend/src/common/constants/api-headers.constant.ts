import { ApiHeaderOptions } from '@nestjs/swagger';

export const X_LAB_ID_HEADER: ApiHeaderOptions = {
  name: 'x-lab-id',
  required: true,
  description:
    'ID del laboratorio al que refiere la peticion, esto debe mantenerse en cache desde el momento que el usuario selecciona un laboratorio',
  schema: { type: 'integer', example: 1 },
};
