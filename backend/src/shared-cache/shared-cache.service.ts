import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { UserCache } from './dto/user-cache.interface';

@Injectable()
export class SharedCacheService {
  private readonly logger = new Logger(SharedCacheService.name);

  constructor(
    // Inyectamos el gestor de caché base de NestJS
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * cachea el labId y los permisos asociados a un usuario(uuid)
   * @param uuid UUID del usuario.
   * @param labId ID del laboratorio asociado al usuario.
   * @param role Objeto con los permisos del usuario.
   * @param ttl Tiempo de vida en segundos para el cacheo (opcional).
   */
  async setUser(uuid: string, labId: number, role: object, ttl?: number) {
    const dataToCache = {
      labId,
      role,
    };
    await this.cacheManager.set(uuid, dataToCache, ttl);
    this.logger.log(`Datos cacheados para el usuario: ${uuid}`);
  }

  /**
   * Obtiene los datos de un usuario (labId y rol asociado) desde la caché.
   * Si el usuario no está en caché, devuelve null.
   *
   * @param uuid UUID del usuario.
   * @returns UserCache | null
   */
  async getUser(uuid: string): Promise<UserCache | null> {
    const userData = await this.cacheManager.get<UserCache>(uuid);
    if (userData) {
      this.logger.log(
        `Datos obtenidos desde caché para:\n      Usuario: ${uuid}\n      LabId: ${userData.labId}\n      Permisos: ${JSON.stringify(userData.role.permissions)}`,
      );
    }
    return userData;
  }

  async setEmailToken(email: string, token: string, ttl?: number) {
    await this.cacheManager.set(email, token, ttl);
    this.logger.log(`Token de email cacheado para el correo ${email}`);
  }

  async delEmailToken(email:string) {
    await this.cacheManager.del(email);
    this.logger.log(`Token de email borrado del cache para el correo ${email}`);
  }
}
