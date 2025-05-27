import { BadRequestException, Injectable } from '@nestjs/common';
import { join, extname } from 'path';
import * as sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';

@Injectable()
export class LabSaveLogoService {
  private readonly allowedTypes = ['image/png', 'image/svg+xml'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly maxDimensions = 512; // 512px

  constructor() {}

  async saveLabLogo(
    file: Express.Multer.File,
    dbName: string,
  ): Promise<string> {
    this.validateFile(file);
    
    if (file.mimetype === 'image/png') {
      await this.validatePngDimensions(file);
    }

    const uploadDir = this.createUploadDirectory();
    const filepath = this.getFilePath(uploadDir, dbName, file.originalname);

    await fs.writeFile(filepath, file.buffer);

    return `/img/logolab/${this.getFilename(dbName, file.originalname)}`;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file || !file.buffer) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten archivos PNG o SVG');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('El logo no debe superar los 5MB');
    }
  }

  private async validatePngDimensions(file: Express.Multer.File): Promise<void> {
    const metadata = await sharp(file.buffer).metadata();
    if (metadata.width > this.maxDimensions || metadata.height > this.maxDimensions) {
      throw new BadRequestException('El logo debe tener máximo 512x512 px');
    }
  }

  private createUploadDirectory(): string {
    const uploadDir = join(__dirname, '..', '..', '..', 'img', 'logolab');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  private getFilePath(uploadDir: string, dbName: string, originalName: string): string {
    return join(uploadDir, this.getFilename(dbName, originalName));
  }

  private getFilename(dbName: string, originalName: string): string {
    const extension = extname(originalName) || '.png';
    return `${dbName}${extension}`;
  }
}