import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FileResponseDto } from '../dto/file-response.dto';
import { STORAGE_BUCKETS } from '../constants/storage.constants';
import * as path from 'path'; // path para unir rutas

const SIGNED_URL_EXPIRATION_SECONDS = 60 * 60 * 24 * 30; // 30 días hasta que expire

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase credentials missing in .env');
      throw new Error('Supabase credentials missing in .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Sube un archivo al bucket PÚBLICO con un nombre de archivo específico.
   * @param file - El archivo de Multer.
   * @param fileName - El nombre deseado para el archivo (ej: 'avatar.png').
   * @param customPath - Ruta opcional dentro del bucket (ej: 'users/123').
   * @returns La URL pública y la ruta completa del archivo.
   */
  async uploadPublicFile(
    file: Express.Multer.File,
    fileName: string,
    customPath?: string,
  ): Promise<FileResponseDto> {
    const bucket = STORAGE_BUCKETS.IMAGES;
    //  ruta final uniendo la ruta personalizada y el nombre del archivo
    const filePath = customPath ? path.join(customPath, fileName) : fileName;

    await this._upload(bucket, filePath, file);

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      path: `${bucket}/${filePath}`,
    };
  }

  /**
   * Sube un archivo al bucket PRIVADO con un nombre de archivo específico.
   * @param file - El archivo de Multer.
   * @param fileName - El nombre deseado para el archivo (ej: 'factura-mayo.pdf').
   * @param customPath - Ruta opcional dentro del bucket (ej: 'invoices/user-456').
   * @returns La ruta completa del archivo.
   */
  async uploadPrivateFile(
    file: Express.Multer.File,
    fileName: string, // <-- Parámetro añadido
    customPath?: string,
  ): Promise<{ path: string }> {
    const bucket = STORAGE_BUCKETS.TESTS;
    const filePath = customPath ? path.join(customPath, fileName) : fileName;
    // TODO colocarle un tiempo de vida a la firma de 30 días
    await this._upload(bucket, filePath, file);

    return {
      path: `${bucket}/${filePath}`,
    };
  }

  /**
   * Genera una URL de acceso para un archivo almacenado, diferenciando entre buckets públicos y privados.
   * Para buckets públicos retorna URL directa; para privados genera URL firmada con expiración limitada.
   * Realiza validación de ruta, verificación de tipo de bucket y manejo de errores específicos.
   *
   * @param fullPath Ruta completa del archivo en formato 'bucket/ruta/relativa/archivo.ext'.
   * @returns Objeto con URL de acceso al archivo.
   * @throws BadRequestException Si la ruta no sigue el formato esperado.
   * @throws NotFoundException Si el archivo no existe en el bucket especificado.
   * @throws InternalServerErrorException Si ocurren errores al generar URL firmada para buckets privados.
   */
  async getFileUrl(fullPath: string): Promise<{ url: string }> {
    this.logger.log(`Attempting to retrieve URL for file: ${fullPath}`);
    let bucket: string;
    let relativePath: string;

    try {
      ({ bucket, relativePath } = this._parseFilePath(fullPath));
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // Verificar si el bucket es público
    const isPublicBucket = Object.values(STORAGE_BUCKETS).some(
      (b) => b === bucket && b === STORAGE_BUCKETS.IMAGES, // Asumiendo que IMAGES es tu único bucket público
    );

    if (isPublicBucket) {
      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(relativePath);
      if (!data?.publicUrl) {
        this.logger.warn(`Public URL not found for file: ${fullPath}`);
        throw new NotFoundException(
          `File not found or no public URL for: ${fullPath}`,
        );
      }
      this.logger.log(`Returning public URL for file: ${fullPath}`);
      return { url: data.publicUrl };
    } else {
      // Para buckets privados, generar una URL firmada
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(relativePath, SIGNED_URL_EXPIRATION_SECONDS); // URL válida por 30

      if (error) {
        if (error.message.includes('not found')) {
          this.logger.warn(`File not found for signed URL: ${fullPath}`);
          throw new NotFoundException(`File not found at: ${fullPath}`);
        }
        this.logger.error(
          `Error generating signed URL for file "${fullPath}"`,
          error,
        );
        throw new InternalServerErrorException(
          'Error generating file access URL.',
        );
      }
      if (!data?.signedUrl) {
        this.logger.warn(`Signed URL not generated for file: ${fullPath}`);
        throw new InternalServerErrorException(
          'Could not generate signed URL.',
        );
      }
      this.logger.log(`Returning signed URL for file: ${fullPath}`);
      return { url: data.signedUrl };
    }
  }

  // --- HELPERS PRIVADOS AUXILIARES ---

  /**
   * Método interno para subir archivos a un bucket de almacenamiento específico.
   * Maneja la lógica de subida directa a Supabase Storage con opción de sobrescritura.
   *
   * @param bucket Nombre del bucket de destino donde se almacenará el archivo.
   * @param filePath Ruta completa dentro del bucket (incluyendo nombre de archivo y extensiones).
   * @param file Objeto de archivo Express.Multer.File con buffer de datos y metadatos.
   * @throws InternalServerErrorException Si ocurre un error durante la subida del archivo.
   */
  private async _upload(
    bucket: string,
    filePath: string,
    file: Express.Multer.File,
  ) {
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Error uploading file to bucket "${bucket}"`, error);
      throw new InternalServerErrorException('Error uploading file.');
    }
  }

  /**
   * Parsea una ruta completa de archivo en sus componentes de bucket y ruta relativa.
   * Valida que la ruta siga el formato correcto: 'nombre-bucket/ruta/relativa/archivo.ext'.
   *
   * @param fullPath Ruta completa del archivo en el formato 'bucket/ruta/relativa'.
   * @returns Objeto con las propiedades: bucket (nombre del bucket) y relativePath (ruta dentro del bucket).
   * @throws BadRequestException Si la ruta no sigue el formato esperado o está incompleta.
   */
  private _parseFilePath(fullPath: string): {
    bucket: string;
    relativePath: string;
  } {
    const parts = fullPath.split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new BadRequestException(
        'Invalid file path format. Expected "bucket-name/path/to/file.ext".',
      );
    }
    const bucket = parts[0];
    const relativePath = parts.slice(1).join('/');
    return { bucket, relativePath };
  }
}
