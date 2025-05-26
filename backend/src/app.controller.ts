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
@Controller() // Opcional: Puedes poner un prefijo como @Controller('api') si no quieres que estas rutas estén en la raíz
@UseInterceptors(ClassSerializerInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public() // Ruta pública, no requiere autenticación
  @Get('saludar') // Ejemplo por defecto
  @ApiOperation({ summary: 'devuelve saludo para comprobar conexion' })
  getHello(): string {
    return this.appService.getHello();
  }
}
