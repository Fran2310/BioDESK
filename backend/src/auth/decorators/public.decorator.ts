// /src/auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
// Decorador para marcar rutas como públicas, permitiendo el acceso sin autenticación
// Este decorador se utiliza en los controladores para indicar que una ruta no requiere autenticación
