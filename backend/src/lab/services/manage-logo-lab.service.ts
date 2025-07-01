// /src/lab/services/manage-logo-lab.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { extname } from 'path'; // path.join y fs ya no son necesarios para el guardado local
import * as sharp from 'sharp';
// import { existsSync, mkdirSync } from 'fs'; // No necesarios para el guardado en la nube
// import { promises as fs } from 'fs'; // No necesarios para el guardado en la nube
import { SystemPrismaService } from '../../prisma-manage/system-prisma/system-prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { StorageService } from 'src/storage/storage.service'; // Asegúrate que la ruta es correcta
import { STORAGE_BUCKETS } from '../../storage/constants/storage.constants'; // Para saber el nombre del bucket

@Injectable()
export class ManageLogoLabService {
  private readonly logger = new Logger(ManageLogoLabService.name);
  private readonly allowedTypes = ['image/png', 'image/svg+xml'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly maxDimensions = 512; // 512px
  // private readonly uploadDir = join(process.cwd(), 'img', 'logolab'); // No necesario para el almacenamiento en la nube

  constructor(
    private systemPrisma: SystemPrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService, // Inyectamos el StorageService
  ) {
    // this.createUploadDirectory(); // No es necesario si se guarda en la nube
  }

  /**
   * Guarda el logo del laboratorio usando el StorageService (Supabase).
   * @param file Archivo subido por el usuario
   * @param labId ID del laboratorio al que pertenece el logo
   * @param userUuid UUID del usuario que realiza la acción
   * @returns Objeto con la URL pública del logo guardado
   * @throws BadRequestException si el archivo no es válido o supera los límites establecidos
   */
  async saveLabLogo(
    file: Express.Multer.File,
    labId: number,
    userUuid: string,
  ): Promise<{ logoUrl: string }> { // Cambia el tipo de retorno a logoUrl
    this.validateFile(file);

    if (file.mimetype === 'image/png') {
      await this.validatePngDimensions(file);
    }

    // Generar nombre de archivo y la ruta personalizada dentro del bucket
    const newFilename = this.generateFilename(labId, file.originalname);
    // Definimos la ruta personalizada dentro del bucket. Por ejemplo, 'lab-logos/123/'
    // El bucket para logos será el de IMAGES, ya que son públicos.
    const customPathInBucket = `logolab/`; // Una buena práctica para organizar

    // Eliminar logos existentes en el almacenamiento en la nube si hay cambio de extensión
    // Esto es crucial para limpiar archivos antiguos en Supabase Storage
    const hasDifferentExtension = await this.checkForDifferentExtension(
      labId,
      newFilename,
    );

    if (hasDifferentExtension) {
      await this.deleteExistingLogosFromCloud(labId);
    }

    // --- Subir el archivo usando StorageService ---
    this.logger.log(`Subiendo logo para lab ${labId} a StorageService...`);
    const uploadResult = await this.storageService.uploadPublicFile(
      file,
      newFilename,
      customPathInBucket,
    );

    const newLogoPathInDb = uploadResult.url; // Guardamos la URL pública en la DB

    // Determinar si es necesario actualizar la base de datos
    if (await this.needsDbUpdate(labId, newLogoPathInDb, hasDifferentExtension)) {
      await this.updateLabLogoInDatabase(labId, newLogoPathInDb);
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
          logoUrl: newLogoPathInDb, // Ahora es una URL
          mimeType: file.mimetype,
          size: file.size,
        },
      },
    });

    return { logoUrl: newLogoPathInDb };
  }

  /**
   * Verifica si existe un logo con diferente extensión para el mismo laboratorio en la NUBE.
   * Obtiene la URL actual de la DB y verifica la extensión.
   * @param labId ID del laboratorio
   * @param newFilename Nombre del nuevo archivo
   * @returns true si hay un logo existente con diferente extensión, false en caso contrario
   */
  private async checkForDifferentExtension(
    labId: number,
    newFilename: string,
  ): Promise<boolean> {
    const currentDbUrl = await this.getCurrentLogoPathFromDb(labId);
    if (!currentDbUrl) return false; // No hay logo previo

    const currentExt = extname(currentDbUrl);
    const newExt = extname(newFilename);

    // Si las extensiones son diferentes, indica que se debe eliminar el anterior.
    // También, si el nombre actual en la URL no coincide con el patrón esperado
    // (lo que podría indicar un cambio de convención o un error previo),
    // también lo tratamos como un cambio.
    const currentFilenameFromUrl = currentDbUrl.split('/').pop(); // Obtener el último segmento de la URL
    return currentExt !== newExt || !currentFilenameFromUrl?.startsWith(`logo_lab_${labId}`);
  }

  /**
   * Determina si es necesario actualizar la base de datos.
   * @param labId ID del laboratorio
   * @param newLogoUrl Nueva URL del logo
   * @param hasDifferentExtension Indica si hay un cambio de extensión
   * @returns true si es necesario actualizar, false en caso contrario
   */
  private async needsDbUpdate(
    labId: number,
    newLogoUrl: string,
    hasDifferentExtension: boolean,
  ): Promise<boolean> {
    // Si hay cambio de extensión, siempre actualizamos DB (ya que se limpió el anterior)
    if (hasDifferentExtension) return true;

    // Obtener la URL actual de la base de datos
    const currentDbUrl = await this.getCurrentLogoPathFromDb(labId);

    // Actualizar DB si:
    // - No había logo previo
    // - La URL en DB es diferente a la nueva
    return !currentDbUrl || currentDbUrl !== newLogoUrl;
  }

  /**
   * Elimina los logos existentes para un laboratorio del **almacenamiento en la nube**.
   * Esto requiere conocer el nombre del bucket y la posible ruta/nombre del archivo anterior.
   * @param labId ID del laboratorio
   */
  private async deleteExistingLogosFromCloud(labId: number): Promise<void> {
    // Asume que todos los logos de un laboratorio se guardan con el patrón `logo_lab_{labId}.*`
    // en el bucket `STORAGE_BUCKETS.IMAGES` dentro de la carpeta `lab-logos/{labId}/`.
    const bucket = STORAGE_BUCKETS.IMAGES; // O el bucket donde guardes los logos
    const customPath = `logolab/`;

    try {
      // Supabase no tiene una función para "listar y eliminar por patrón" directamente.
      // La estrategia es buscar el logo actual en la DB, y eliminarlo.
      // O, si sabes los nombres de archivo exactos, eliminarlos.
      // Si la convención es que solo hay UN logo por laboratorio,
      // entonces solo necesitamos eliminar el que esté actualmente en la DB.

      const currentDbUrl = await this.getCurrentLogoPathFromDb(labId);
      if (currentDbUrl) {
        // La URL pública es algo como:
        // https://[project_ref].supabase.co/storage/v1/object/public/bucket-name/path/to/file.ext
        // Necesitamos extraer "bucket-name/path/to/file.ext"
        const fullPathInStorage = currentDbUrl.split('/public/')[1]; // Esto puede ser frágil
        if (fullPathInStorage) {
          this.logger.log(`Intentando eliminar logo antiguo de la nube: ${fullPathInStorage}`);
          try {
            // Llama directamente al SupabaseService para eliminar si tu StorageService no expone delete
            // Si tu StorageService expone un deleteFile(fullPathInStorage), úsalo aquí.
            const { bucket: existingBucket, relativePath: existingRelativePath } =
              this.storageService['supabaseService']['_parseFilePath'](fullPathInStorage);

            const { error } = await this.storageService['supabaseService']['supabase'].storage
              .from(existingBucket)
              .remove([existingRelativePath]);

            if (error) {
              this.logger.warn(`Error al eliminar logo antiguo ${fullPathInStorage} de la nube: ${error.message}`);
            } else {
              this.logger.log(`Logo antiguo ${fullPathInStorage} eliminado exitosamente de la nube.`);
            }
          } catch (parseError) {
            this.logger.warn(`No se pudo parsear la URL del logo antiguo para eliminarlo: ${currentDbUrl}`, parseError);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error al intentar eliminar logos antiguos de la nube para lab ${labId}`, error);
    }
  }

  /**
   * Obtiene el path/URL actual del logo desde la base de datos
   * @param labId ID del laboratorio
   * @returns URL del logo o null si no existe
   */
  private async getCurrentLogoPathFromDb(
    labId: number,
  ): Promise<string | null> {
    try {
      const lab = await this.systemPrisma.lab.findUnique({
        where: { id: labId },
        select: { logoPath: true },
      });
      return lab?.logoPath || null; // logoPath ahora almacena la URL
    } catch (error) {
      this.logger.error(
        `Error obteniendo path de logo desde DB para lab ${labId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Actualiza el path (URL) del logo en la base de datos
   * @param labId ID del laboratorio
   * @param logoUrl Nueva URL del logo
   * @throws BadRequestException si el laboratorio no existe o hay un error al actualizar
   */
  private async updateLabLogoInDatabase(labId: number, logoUrl: string) {
    try {
      const labExists = await this.systemPrisma.lab.findUnique({
        where: { id: labId },
        select: { id: true },
      });

      if (!labExists) {
        throw new BadRequestException(
          `Laboratorio con ID ${labId} no encontrado`,
        );
      }

      await this.systemPrisma.lab.update({
        where: { id: labId },
        data: { logoPath: logoUrl }, // Guarda la URL completa
      });
      this.logger.log(`Logo URL actualizado en DB para laboratorio ID: ${labId}`);
    } catch (error) {
      this.logger.error(
        `Error actualizando URL de logo en base de datos para lab ${labId}`,
        error,
      );
      throw new BadRequestException('Error actualizando URL de logo en base de datos');
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

  // private createUploadDirectory(): void { // Ya no es necesario
  //   if (!existsSync(this.uploadDir)) {
  //     mkdirSync(this.uploadDir, { recursive: true });
  //   }
  // }

  /**
   * Genera un nombre de archivo único para el logo del laboratorio
   * @param labId ID del laboratorio
   * @param originalName Nombre original del archivo
   * @returns Nombre de archivo generado
   */
  private generateFilename(labId: number, originalName: string): string {
    const extension = extname(originalName) || '.png';
    return `${labId}${extension}`;
  }
}