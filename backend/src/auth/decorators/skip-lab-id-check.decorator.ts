// src/auth/decorators/skip-lab-id-check.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SKIP_LAB_ID_CHECK_KEY = 'skipLabIdCheck';
export const SkipLabIdCheck = () => SetMetadata(SKIP_LAB_ID_CHECK_KEY, true);
