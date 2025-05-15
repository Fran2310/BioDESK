// src/app.controller.ts
import {
  Controller,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

import { AppService } from './app.service';

@Controller() // Opcional: Puedes poner un prefijo como @Controller('api') si no quieres que estas rutas estén en la raíz
@UseInterceptors(ClassSerializerInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('') // Ejemplo por defecto
  getHello(): string {
    return this.appService.getHello();
  }
}
