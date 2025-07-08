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

  // Metodos para logica de cambio de contraseña
  /**
   * Almacena un token asociado a un email en la caché con un tiempo de expiración de 1 hora.
   * Registra la acción en el sistema de logs.
   *
   * @param email Dirección de email que se usará como clave de almacenamiento.
   * @param token Token a almacenar (normalmente un código de verificación o acceso).
   */
  async setEmailToken(email: string, token: string) {
    await this.cacheManager.set(email, token, 3600 * 1000); // 3600 segundos = 1 hora
    this.logger.log(`Token de email cacheado para ${email}`);
  }

  /**
   * Recupera un token previamente almacenado asociado a un email desde la caché.
   * Registra la acción en el sistema de logs.
   *
   * @param email Dirección de email asociada al token que se desea recuperar.
   * @returns El token almacenado o null si ha expirado o no existe.
   */
  async getEmailToken(email: string) {
    this.logger.log(`Token obtenido de email para ${email}`);
    return await this.cacheManager.get(email);
  }

  /**
   * Elimina un token asociado a un email de la caché antes de su expiración natural.
   * Registra la acción en el sistema de logs.
   *
   * @param email Dirección de email cuyo token se desea eliminar.
   */
  async delEmailToken(email: string) {
    await this.cacheManager.del(email);
    this.logger.log(`Token de email borrado del cache para ${email}`);
  }
}
