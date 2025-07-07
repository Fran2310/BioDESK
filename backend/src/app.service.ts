import { Injectable } from '@nestjs/common';

/**
 * Servicio para testing, se utiliza para mantener despierto el servidor en el despliegue del Render
 */
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
