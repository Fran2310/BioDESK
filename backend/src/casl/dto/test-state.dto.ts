// src/request-medic-test/dto/test-state.dto.ts
import { IsEnum } from 'class-validator';

export enum State {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  TO_VERIFY = 'TO_VERIFY',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
}

export class TestStateDto {
  @IsEnum(State)
  state: State;
}
