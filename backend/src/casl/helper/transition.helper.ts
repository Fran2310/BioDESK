import { State } from '@prisma/client-lab';

// transition.helper.ts
export const STATE_TRANSITIONS: Record<State, State[]> = {
    PENDING: ['IN_PROCESS', 'CANCELED'],
    IN_PROCESS: ['TO_VERIFY', 'CANCELED'],
    TO_VERIFY: ['COMPLETED', 'IN_PROCESS', 'CANCELED'],
    CANCELED: ['PENDING'],
    COMPLETED: []
};