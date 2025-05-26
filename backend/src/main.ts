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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT en el formato: Bearer <token>',
      },
      'JWT',
    )
    .addTag('Laboratorios')
    .addTag('Autenticación')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Configura la ruta de la documentación (bajo el prefijo global /api)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Configuraciones existentes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
