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

    // Generar nombre de archivo y rutas
    const newFilename = this.generateFilename(labId, file.originalname);
    const newFilePath = join(this.uploadDir, newFilename);
    const newLogoPath = `/img/logolab/${newFilename}`;

    // Verificar si existe logo con diferente extensión
    const hasDifferentExtension = await this.checkForDifferentExtension(
      labId,
      newFilename,
    );

    // Eliminar logos existentes solo si hay cambio de extensión
    if (hasDifferentExtension) {
      await this.deleteExistingLogos(labId);
    }

    // Guardar el nuevo archivo
    await fs.writeFile(newFilePath, file.buffer);

    // Determinar si es necesario actualizar la base de datos
    if (await this.needsDbUpdate(labId, newLogoPath, hasDifferentExtension)) {
      await this.updateLabLogoInDatabase(labId, newLogoPath);
    } else {
      this.logger.log(
        `Logo actualizado sin cambios en DB para laboratorio ID: ${labId}`,
      );
    }

    return { logoPath: newLogoPath };
  }

  /**
   * Verifica si existe un logo con diferente extensión para el mismo laboratorio
   */
  private async checkForDifferentExtension(
    labId: number,
    newFilename: string,
  ): Promise<boolean> {
    const existingFiles = await this.getExistingLogos(labId);
    return existingFiles.some(
      (file) => file !== newFilename && file.startsWith(`logo_lab_${labId}`),
    );
  }

  /**
   * Determina si es necesario actualizar la base de datos
   */
  private async needsDbUpdate(
    labId: number,
    newLogoPath: string,
    hasDifferentExtension: boolean,
  ): Promise<boolean> {
    // Si hay cambio de extensión, siempre actualizamos DB
    if (hasDifferentExtension) return true;

    // Obtener el path actual de la base de datos
    const currentDbPath = await this.getCurrentLogoPathFromDb(labId);

    // Actualizar DB si:
    // - No había logo previo
    // - El path en DB es diferente al nuevo
    return !currentDbPath || currentDbPath !== newLogoPath;
  }

  /**
   * Obtiene todos los nombres de archivo de logos existentes para un laboratorio
   */
  private async getExistingLogos(labId: number): Promise<string[]> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const pattern = new RegExp(`^logo_lab_${labId}(\\.|_)`);
      return files.filter((file) => pattern.test(file));
    } catch (error) {
      this.logger.error(
        `Error obteniendo logos existentes para lab ${labId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Elimina todos los logos existentes para un laboratorio
   */
  private async deleteExistingLogos(labId: number): Promise<void> {
    try {
      const files = await this.getExistingLogos(labId);
      for (const file of files) {
        const filePath = join(this.uploadDir, file);
        if (existsSync(filePath)) {
          await fs
            .unlink(filePath)
            .catch((error) =>
              this.logger.warn(
                `Error eliminando logo existente: ${filePath}`,
                error,
              ),
            );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error eliminando logos existentes para lab ${labId}`,
        error,
      );
    }
  }

  /**
   * Obtiene el path actual del logo desde la base de datos
   */
  private async getCurrentLogoPathFromDb(
    labId: number,
  ): Promise<string | null> {
    try {
      const lab = await this.systemPrisma.lab.findUnique({
        where: { id: labId },
        select: { logoPath: true },
      });
      return lab?.logoPath || null;
    } catch (error) {
      this.logger.error(
        `Error obteniendo path de logo desde DB para lab ${labId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Actualiza el path del logo en la base de datos
   */
  private async updateLabLogoInDatabase(labId: number, logoPath: string) {
    try {
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

      // Actualizar la base de datos
      await this.systemPrisma.lab.update({
        where: { id: labId },
        data: { logoPath },
      });
      this.logger.log(`Logo actualizado en DB para laboratorio ID: ${labId}`);
    } catch (error) {
      this.logger.error(
        `Error actualizando logo en base de datos para lab ${labId}`,
        error,
      );
      throw new BadRequestException('Error actualizando logo en base de datos');
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
    // Obtener solo la extensión del archivo original
    const extension = extname(originalName) || '.png';

    // Usar el formato: logo_lab_{idLab}.{extension}
    return `logo_lab_${labId}${extension}`;
  }
}
