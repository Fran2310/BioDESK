// src/casl/decorators/check-ability.decorator.ts
import { SetMetadata } from '@nestjs/common';

export interface AbilityMetadata {
  actions: string;
  subject: string;
  fields?: string;
}

export const CHECK_ABILITY_KEY = 'check_ability';
export const CheckAbility = (...abilities: AbilityMetadata[]) =>
  SetMetadata(CHECK_ABILITY_KEY, abilities);
