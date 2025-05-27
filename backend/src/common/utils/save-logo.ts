import { BadRequestException } from '@nestjs/common';
import { join, extname } from 'path';
import * as sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';

export async function saveLabLogo(
  file: Express.Multer.File,
  dbName: string,
): Promise<string> {
  if (!file || !file.buffer) {
    throw new BadRequestException('no se ha subido ningún archivo');
  }

  const allowedTypes = ['image/png', 'image/svg+xml'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException('Solo se permiten archivos PNG o SVG');
  }

  if (file.size > 5 * 1024 * 1024) {
    // ✅ ahora permite hasta 5MB
    throw new BadRequestException('El logo no debe superar los 5MB');
  }

  if (file.mimetype === 'image/png') {
    const metadata = await sharp(file.buffer).metadata();
    if (metadata.width > 512 || metadata.height > 512) {
      throw new BadRequestException('El logo debe tener máximo 512x512 px');
    }
  }

  const uploadDir = join(__dirname, '..', '..', '..', 'img', 'logolab'); // ✅ nueva ruta absoluta
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  const extension = extname(file.originalname) || '.png';
  const filename = `${dbName}${extension}`;
  const filepath = join(uploadDir, filename);

  await fs.writeFile(filepath, file.buffer);

  // ✅ Ruta relativa para guardar en DB (puedes ajustar según cómo sirvas esto en frontend)
  return `/img/logolab/${filename}`;
}
