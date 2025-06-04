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
import { LabService } from 'src/lab/services/lab.service';
import { getMetadataFlags } from 'src/common/utils/get-metadata-decorators.util';

@Injectable()
export class LabHeaderGuard implements CanActivate {
  /**
   * Guard de NestJS que valida la presencia y validez del header 'x-lab-id' en las solicitudes.
   * Permite el acceso a endpoints públicos o que omiten la verificación mediante metadatos.
   * Verifica que el usuario esté autenticado y que el laboratorio sea válido y accesible para el usuario.
   * Lanza excepciones específicas en caso de errores de autenticación, autorización o formato del header.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly labService: LabService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadataKeys = [SKIP_LAB_ID_CHECK_KEY, IS_PUBLIC_KEY];

    //Obtener todos los flags
    const flags = getMetadataFlags(this.reflector, context, metadataKeys);

    if (flags.isPublic || flags.skipLabIdCheck) {
      // para endpoints públicos o que omiten verificación del header
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
      await this.labService.cachSelectedLab(user.sub, labIdNumber);
    } else if (!cached) {
      await this.labService.cachSelectedLab(user.sub, labIdNumber);
    }

    return true;
  }
}
