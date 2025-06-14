// /src/lab/services/manage-logo-lab.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { join, extname } from 'path';
import * as sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import { SystemPrismaService } from '../../prisma-manage/system-prisma/system-prisma.service';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class ManageLogoLabService {
  private readonly logger = new Logger(ManageLogoLabService.name);
  private readonly allowedTypes = ['image/png', 'image/svg+xml'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly maxDimensions = 512; // 512px
  private readonly uploadDir = join(process.cwd(), 'img', 'logolab');

  constructor(
    private systemPrisma: SystemPrismaService,
    private readonly auditService: AuditService,
  ) {
    this.createUploadDirectory();
  }

  /**
   * Guarda el logo del laboratorio en el sistema de archivos y actualiza la base de datos.
   * @param file Archivo subido por el usuario
   * @param labId ID del laboratorio al que pertenece el logo
   * @param userUuid UUID del usuario que realiza la acción
   * @returns Objeto con la ruta del logo guardado
   * @throws BadRequestException si el archivo no es válido o supera los límites establecidos
   */
  async saveLabLogo(
    file: Express.Multer.File,
    labId: number,
    userUuid: string,
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
    // Registrar la acción en el historial de auditoría
    await this.auditService.logAction(labId, userUuid, {
      action: 'update',
      details: 'Subió un nuevo logo para el laboratorio',
      entity: 'Lab',
      recordEntityId: labId.toString(),
      operationData: {
        after: {
          originalFileName: file.originalname,
          filename: newFilename,
          logoPath: newLogoPath,
          mimeType: file.mimetype,
          size: file.size,
        },
      },
    });

    return { logoPath: newLogoPath };
  }

  /**
   * Verifica si existe un logo con diferente extensión para el mismo laboratorio
   * @param labId ID del laboratorio
   * @param newFilename Nombre del nuevo archivo
   * @returns true si hay un logo existente con diferente extensión, false en caso contrario
   * @throws Error si hay un problema al leer el directorio
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
   * @param labId ID del laboratorio
   * @param newLogoPath Nuevo path del logo
   * @param hasDifferentExtension Indica si hay un cambio de extensión
   * @returns true si es necesario actualizar, false en caso contrario
   * @throws Error si hay un problema al consultar la base de datos
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
   * @param labId ID del laboratorio
   * @returns Lista de nombres de archivo que coinciden con el patrón
   * @throws Error si hay un problema al leer el directorio
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
   * @param labId ID del laboratorio
   * @throws Error si hay un problema al eliminar los archivos
   * @return void
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
   * @param labId ID del laboratorio
   * @returns Path del logo o null si no existe
   * @throws Error si hay un problema al consultar la base de datos
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
   * @param labId ID del laboratorio
   * @param logoPath Nuevo path del logo
   * @throws BadRequestException si el laboratorio no existe o hay un error al actualizar
   * @returns void
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

  /**
   * Valida el archivo subido
   * @param file Archivo a validar
   * @throws BadRequestException si el archivo no es válido
   */
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

  /**
   * Valida las dimensiones de un archivo PNG
   * @param file Archivo a validar
   * @throws BadRequestException si las dimensiones son mayores a 512x512 px
   */
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

  /**
   * Crea el directorio de subida de logos si no existe
   * @returns void
   * @throws Error si hay un problema al crear el directorio
   */
  private createUploadDirectory(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Genera un nombre de archivo único para el logo del laboratorio
   * @param labId ID del laboratorio
   * @param originalName Nombre original del archivo
   * @returns Nombre de archivo generado
   */
  private generateFilename(labId: number, originalName: string): string {
    // Obtener solo la extensión del archivo original
    const extension = extname(originalName) || '.png';

    // Usar el formato: logo_lab_{idLab}.{extension}
    return `logo_lab_${labId}${extension}`;
  }
}
