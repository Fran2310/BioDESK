// src/casl/casl.module.ts
import { Module } from '@nestjs/common';
import { AbilityFactory } from './ability.factory';
import { CaslAbilityGuard } from './guards/casl-ability.guard';
import { LabModule } from 'src/lab/lab.module';

/**
 * Módulo CASL que configura la gestión de habilidades y permisos.
 * Importa LabModule para acceder a LabService, y provee AbilityFactory y CaslAbilityGuard
 * para el control de acceso basado en permisos dentro de la aplicación.
 */
@Module({
  imports: [LabModule], // Porque CaslAbilityGuard usa LabService
  providers: [AbilityFactory, CaslAbilityGuard],
  exports: [AbilityFactory, CaslAbilityGuard],
})
export class CaslModule {}
