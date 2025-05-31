// /src/lab/services/manage-logo-lab.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { join, extname } from 'path';
import * as sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import { SystemPrismaService } from '../../system-prisma/system-prisma.service';

@Injectable()
export class ManageLogoLabService {
  private readonly logger = new Logger(ManageLogoLabService.name);
  private readonly allowedTypes = ['image/png', 'image/svg+xml'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly maxDimensions = 512; // 512px
  private readonly uploadDir = join(process.cwd(), 'img', 'logolab');

  constructor(private systemPrisma: SystemPrismaService) {
    this.createUploadDirectory();
  }

  async saveLabLogo(
    file: Express.Multer.File,
    labId: number,
  ): Promise<{ logoPath: string }> {
    this.validateFile(file);

    if (file.mimetype === 'image/png') {
      await this.validatePngDimensions(file);
    }

    const filename = this.generateFilename(labId, file.originalname);
    const filepath = join(this.uploadDir, filename);
    const logoPath = `/img/logolab/${filename}`;

    await fs.writeFile(filepath, file.buffer);

    try {
      await this.updateLabLogoInDatabase(labId, logoPath);
      this.logger.log(`Logo actualizado para laboratorio ID: ${labId}`);
      return { logoPath };
    } catch (error) {
      // Revertir la operación si falla la actualización en DB
      await fs
        .unlink(filepath)
        .catch((unlinkError) =>
          this.logger.error('Error eliminando archivo fallido', unlinkError),
        );
      throw new BadRequestException('Error actualizando logo en base de datos');
    }
  }

  private async updateLabLogoInDatabase(labId: number, logoPath: string) {
    // Verificar si el laboratorio existe
    const labExists = await this.systemPrisma.lab.findUnique({
      where: { id: labId },
      select: { id: true },
    });

    if (!labExists) {
      throw new BadRequestException(
        `Laboratorio con ID ${labId} no encontrado`,
      );
    }

    // Obtener logo anterior para eliminarlo después
    const currentLab = await this.systemPrisma.lab.findUnique({
      where: { id: labId },
      select: { logoPath: true },
    });

    // Actualizar la base de datos
    await this.systemPrisma.lab.update({
      where: { id: labId },
      data: { logoPath },
    });

    // Eliminar archivo antiguo si existe
    if (currentLab?.logoPath) {
      const oldFilename = currentLab.logoPath.split('/').pop();
      if (oldFilename) {
        const oldFilePath = join(this.uploadDir, oldFilename);
        if (existsSync(oldFilePath)) {
          await fs
            .unlink(oldFilePath)
            .catch((error) =>
              this.logger.warn(
                `Error eliminando logo antiguo: ${oldFilePath}`,
                error,
              ),
            );
        }
      }
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file || !file.buffer) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten archivos PNG o SVG');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('El logo no debe superar los 5MB');
    }
  }

  private async validatePngDimensions(
    file: Express.Multer.File,
  ): Promise<void> {
    const metadata = await sharp(file.buffer).metadata();
    if (
      metadata.width > this.maxDimensions ||
      metadata.height > this.maxDimensions
    ) {
      throw new BadRequestException('El logo debe tener máximo 512x512 px');
    }
  }

  private createUploadDirectory(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private generateFilename(labId: number, originalName: string): string {
    const sanitized = originalName.replace(/[^a-zA-Z0-9_\-.]+/g, '');
    const extension = extname(sanitized) || '.png';
    const baseName = sanitized.replace(extension, '') || 'logo';
    return `lab_${labId}_${baseName.slice(0, 50)}${extension}`;
  }
}
