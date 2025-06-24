import { Injectable, StreamableFile } from '@nestjs/common';
import { createReadStream, readdirSync, statSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ImagesService {
  private readonly IMAGES_PATH = join(process.cwd(), './img/');

  /**
   * Obtiene la estructura de directorios como JSON anidado
   */
  async getDirectoryStructure(): Promise<any> {
    return this.buildDirectoryTree(this.IMAGES_PATH);
  }

  /**
   * Función recursiva para construir el árbol de directorios
   */
  private buildDirectoryTree(directoryPath: string): any {
    const items = readdirSync(directoryPath);
    const structure = {};

    items.forEach(item => {
      const fullPath = join(directoryPath, item);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        // Si es un directorio, llamamos recursivamente
        structure[item] = this.buildDirectoryTree(fullPath);
      } else {
        // Si es un archivo, podemos almacenar información o simplemente marcarlo
        structure[item] = {
          type: 'file',
          size: stats.size,
          modified: stats.mtime
        };
      }
    });

    return structure;
  }

  // Mantén tu función existente para obtener imágenes
  async getImage(filename: string): Promise<StreamableFile> {
    const file = createReadStream(join(this.IMAGES_PATH, filename));
    return new StreamableFile(file);
  }
}