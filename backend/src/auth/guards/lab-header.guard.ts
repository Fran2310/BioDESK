// src/auth/guards/lab-header.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_LAB_ID_CHECK_KEY } from '../decorators/skip-lab-id-check.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { LabService } from 'src/lab/lab.service';
import { getMetadataFlags } from 'src/common/utils/get-metadata-decorators.util';

@Injectable()
export class LabHeaderGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly labService: LabService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadataKeys = [SKIP_LAB_ID_CHECK_KEY, IS_PUBLIC_KEY];

    //Obtener todos los flags
    const flags = getMetadataFlags(this.reflector, context, metadataKeys);

    if (flags.isPublic || flags.skipLabIdCheck) {
      // Lógica para endpoints públicos o que omiten verificación del header
      console.log('Skipping lab ID check for public or skipped routes...');
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const labId = req.headers['x-lab-id'];
    if (!labId) {
      throw new ForbiddenException('Header x-lab-id es requerido');
    }

    const labIdNumber = Number(labId);
    if (isNaN(labIdNumber)) {
      throw new BadRequestException('x-lab-id debe ser un número válido');
    }

    // Validación o selección de laboratorio
    const cached = await this.labService.getUserCached(user.sub);
    if (cached && cached.labId !== labIdNumber) {
      await this.labService.selectedLab(user.sub, labIdNumber);
    } else if (!cached) {
      await this.labService.selectedLab(user.sub, labIdNumber);
    }

    return true;
  }
}
