// /src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnvVars } from './common/config/validate-env';
async function bootstrap() {
  // Valida las variables de entorno antes de iniciar la aplicación
  validateEnvVars(['JWT_SECRET']);
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.setGlobalPrefix('api'); // Setea el prefijo global para todas las rutas
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
