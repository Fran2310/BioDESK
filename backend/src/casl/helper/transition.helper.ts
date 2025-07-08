// transition.helper.ts
import { State } from '@prisma/client-lab';

/**
 * Constante que retorna un array de estados válidos para un estado dado. Este array se utiliza para determinar los estados a los que se puede cambiar un estado dado.
 */
export const STATE_TRANSITIONS: Record<State, State[]> = {
  PENDING: ['IN_PROCESS', 'CANCELED'],
  IN_PROCESS: ['TO_VERIFY', 'CANCELED'],
  TO_VERIFY: ['COMPLETED', 'IN_PROCESS', 'CANCELED'],
  CANCELED: ['PENDING'],
  COMPLETED: [],
};
