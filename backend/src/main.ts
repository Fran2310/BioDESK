// /src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Configura el JwtAuthGuard como global
  //app.useGlobalGuards(new JwtAuthGuard(new Reflector()));

  app.setGlobalPrefix('api'); // Setea el prefijo global para todas las rutas
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
