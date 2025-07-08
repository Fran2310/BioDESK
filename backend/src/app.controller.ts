// src/app.controller.ts
import {
  Controller,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('[Testing] App')
@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public() // Ruta pública, no requiere autenticación
  @Get('saludar') // Ejemplo por defecto, este endpoint se usa para evitar que se duerma el backend desplegado en el Render
  @ApiOperation({ summary: 'devuelve saludo para comprobar conexion' })
  getHello(): string {
    return this.appService.getHello();
  }
}
