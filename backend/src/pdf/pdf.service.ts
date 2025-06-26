import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { Readable } from 'stream';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly storageService: StorageService) {}

  async generateAndUploadPdf(
    templateName: string,
    data: any,
    fileName: string,
    customPath?: string,
  ): Promise<{ pdfBuffer: Buffer; storagePath: string; url?: string }> {
    try {
      // 1. Generar el PDF
      const pdfBuffer = await this.generatePdf(templateName, data);

      // 2. Convertir el Buffer a un archivo Multer-like para Supabase
      const pdfFile: Express.Multer.File = {
        fieldname: 'pdf',
        originalname: fileName,
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
        size: pdfBuffer.length,
        stream: new Readable({
          read() {
            this.push(pdfBuffer);
            this.push(null); // Indica el final del stream
          }
        }),
        destination: '',
        filename: fileName,
        path: '',
      };

      // 3. Subir a Supabase
      const uploadResult = await this.storageService.uploadPrivateFile(
        pdfFile,
        fileName,
        customPath,
      );

      // 4. Obtener URL firmada (opcional)
      let url: string | undefined;
      try {
        const urlResult = await this.storageService.getFileUrl(uploadResult.path);
        url = urlResult.url;
      } catch (error) {
        this.logger.warn('Could not generate signed URL for PDF', error);
      }

      return {
        pdfBuffer,
        storagePath: uploadResult.path,
        url,
      };
    } catch (error) {
      this.logger.error('Error generating and uploading PDF', error);
      throw new InternalServerErrorException('Failed to generate and upload PDF');
    }
  }

  async generatePdf(templateName: string, data: any): Promise<Buffer> {
    const filePath = path.join(
      process.cwd(),
      'src',
      'pdf',
      'templates',
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(filePath)) {
      throw new InternalServerErrorException(
        `La plantilla ${templateName} no fue encontrada.`,
      );
    }

    const templateHtml = fs.readFileSync(filePath, 'utf-8');
    const template = handlebars.compile(templateHtml);
    const html = template({ ...data, currentDate: new Date().toLocaleDateString() });

    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw new InternalServerErrorException('No se pudo generar el PDF.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async getExamData(examId: string): Promise<any> {
    this.logger.log(`Buscando datos para el examen con ID: ${examId}`);
    return {
      patientName: 'Juan Pérez',
      patientId: 'V-12.345.678',
      patientDob: '15/05/1985',
      patientAge: 39,
      examType: 'Hematología Completa',
      examDate: '22/06/2025',
      doctorName: 'Ana Martínez',
      results: [
        { test: 'Glóbulos Rojos', value: '4.8', unit: 'x10^6/µL', reference: '4.5 - 5.5' },
        { test: 'Hemoglobina', value: '15.2', unit: 'g/dL', reference: '13.5 - 17.5' },
        { test: 'Hematocrito', value: '45.0', unit: '%', reference: '41 - 53' },
        { test: 'Glóbulos Blancos', value: '7.5', unit: 'x10^3/µL', reference: '4.0 - 11.0' },
        { test: 'Plaquetas', value: '250', unit: 'x10^3/µL', reference: '150 - 450' },
      ],
    };
  }
}