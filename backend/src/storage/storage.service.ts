import { Injectable } from '@nestjs/common';
import { SupabaseService } from './services/supabase.service'; // Asegúrate de que la ruta sea correcta
import { FileResponseDto } from './dto/file-response.dto'; // Si este DTO se usa en el wrapper

@Injectable()
export class StorageService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Sube un archivo a un bucket público.
   * Delega la lógica a SupabaseService.
   * @param file El archivo de Multer.
   * @param fileName El nombre deseado para el archivo.
   * @param customPath Ruta opcional dentro del bucket.
   * @returns La URL pública y la ruta completa del archivo.
   */
  async uploadPublicFile(
    file: Express.Multer.File,
    fileName: string,
    customPath?: string,
  ): Promise<FileResponseDto> {
    return this.supabaseService.uploadPublicFile(file, fileName, customPath);
  }

  /**
   * Sube un archivo a un bucket privado.
   * Delega la lógica a SupabaseService.
   * @param file El archivo de Multer.
   * @param fileName El nombre deseado para el archivo.
   * @param customPath Ruta opcional dentro del bucket.
   * @returns La ruta completa del archivo.
   */
  async uploadPrivateFile(
    file: Express.Multer.File,
    fileName: string,
    customPath?: string,
  ): Promise<{ path: string }> {
    return this.supabaseService.uploadPrivateFile(file, fileName, customPath);
  }

  /**
   * Recupera la URL de un archivo, manejando si es público o privado.
   * Delega la lógica a SupabaseService.
   * @param fullPath La ruta completa del archivo incluyendo el bucket (ej: 'images/avatars/user.png').
   * @returns La URL para acceder al archivo.
   */
  async getFileUrl(fullPath: string): Promise<{ url: string }> {
    return this.supabaseService.getFileUrl(fullPath);
  }

  // Puedes añadir aquí otros métodos de tu SupabaseService si quieres exponerlos,
  // como deleteFile, etc., o crear métodos más genéricos si cambias de proveedor.

  // Ejemplo: Podrías querer un método para eliminar archivos:
  // async deleteFile(fullPath: string): Promise<void> {
  //   // Asume que SupabaseService tiene un método deleteFile(bucket, relativePath)
  //   // o que fullPath es suficiente para su lógica interna.
  //   return this.supabaseService.deleteFile(fullPath);
  // }
}