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
    /**
     * Guarda el logo de un laboratorio.
     * Primero elimina los logos existentes, luego guarda el nuevo archivo y actualiza la base de datos.
     * @param file Archivo subido por el usuario
     * @param labId ID del laboratorio al que pertenece el logo
     * @returns Ruta del logo guardado
     */
    this.validateFile(file);

    if (file.mimetype === 'image/png') {
      await this.validatePngDimensions(file);
    }

    // PRIMERO: Eliminar logos existentes para este laboratorio
    await this.deleteExistingLogos(labId);

    const filename = this.generateFilename(labId, file.originalname);
    const filepath = join(this.uploadDir, filename);
    const logoPath = `/img/logolab/${filename}`;

    // SEGUNDO: Guardar el nuevo archivo
    await fs.writeFile(filepath, file.buffer);

    try {
      // TERCERO: Actualizar la base de datos
      await this.updateLabLogoInDatabase(labId, logoPath);
      this.logger.log(`Logo actualizado para laboratorio ID: ${labId}`);
      return { logoPath };
    } catch (error) {
      // Revertir: eliminar el archivo nuevo si falla la actualización en DB
      await fs
        .unlink(filepath)
        .catch((unlinkError) =>
          this.logger.error('Error eliminando archivo fallido', unlinkError),
        );
      throw new BadRequestException('Error actualizando logo en base de datos');
    }
  }

  private async deleteExistingLogos(labId: number): Promise<void> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const pattern = new RegExp(`^logo_lab_${labId}\\.`); // Busca logos con este ID

      for (const file of files) {
        if (pattern.test(file)) {
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
      }
    } catch (error) {
      this.logger.error(
        `Error buscando logos existentes para lab ${labId}`,
        error,
      );
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

    // SOLO actualizar la base de datos (sin eliminar archivos)
    await this.systemPrisma.lab.update({
      where: { id: labId },
      data: { logoPath },
    });
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
