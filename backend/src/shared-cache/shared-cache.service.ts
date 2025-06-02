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
  // Esta función cachea el labId y los permisos asociados a un usuario(uuid)
  async setUser(
    uuid: string,
    labId: number,
    permissions: object,
    ttl?: number,
  ) {
    const dataToCache = {
      labId,
      permissions,
    };
    await this.cacheManager.set(uuid, dataToCache, ttl);
    this.logger.log(`Datos cacheados para el usuario: ${uuid}`);
  }
  // Esta función devuelve el labId y los permisos asociados a un usuario(uuid)
  async getUser(uuid: string): Promise<UserCache | null> {
    const userData = await this.cacheManager.get<UserCache>(uuid);
    if (userData) {
      this.logger.log(
        `Datos obtenidos desde caché para:\n      Usuario: ${uuid}\n      LabId: ${userData.labId}\n      Permisos: ${JSON.stringify(userData.permissions.permissions)}`,
      );
    }
    return userData;
  }
}
