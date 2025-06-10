// /src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validateEnvVars } from './common/config/validate-env';

async function bootstrap() {
  // Valida las variables de entorno antes de iniciar la aplicación
  validateEnvVars(['JWT_SECRET']);
  const app = await NestFactory.create(AppModule);

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('BioDESK API')
    .setDescription('Sistema de gestión para laboratorios clínicos')
    .setVersion('1.0')
    .addServer('/api')
    .addBearerAuth()
    .addTag('[Testing] App') // Establecer orden de las etiquetas
    .addTag('[Testing] SystemPrisma')
    .addTag('[Testing] LabPrisma')
    .addTag('[Testing] CASL')
    .addTag('Auth', 'Autenticación')
    .addTag('Lab', 'Gestión de laboratorios')
    .addTag('User', 'Gestión de usuarios')
    .addTag('Role', 'Gestión de roles')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Configura la ruta de la documentación (bajo el prefijo global /api)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Configuraciones existentes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Habilita la transformación automática
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos automáticamente
      },
    }),
  );
  app.setGlobalPrefix('api');
  app.enableCors(); // Habilitar el CORS
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
