import { Controller, Get, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common'; // Importa lo necesario
import { AppService } from './app.service';
import { SystemPrismaService } from './system-prisma/system-prisma.service';
import { SystemUser } from '@prisma/client-system'; // Traer el modelo SystemUser

@Controller() // Puedes poner un prefijo como @Controller('api')
@UseInterceptors(ClassSerializerInterceptor) // Opcional pero recomendado para transformar clases
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly systemPrismaService: SystemPrismaService, // Inyecta tu servicio de Prisma System
  ) {}

  @Get('') // Ejemplo por defecto
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system-users') // Define la ruta para acceder a los usuarios del sistema
  async getAllSystemUsers(): Promise<SystemUser[]> { // Especifica el tipo de retorno
    console.log('Fetching all system users...');
    const users = await this.systemPrismaService.systemUser.findMany(); // Ejecutar la query 'findMany'
    console.log(`Found ${users.length} system users.`);
    return users; 
  }
}