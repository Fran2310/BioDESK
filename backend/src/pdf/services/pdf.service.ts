import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { Readable } from 'stream';
import { StorageService } from 'src/storage/services/storage.service';

import { DataTestReport } from './get-data-test-report.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly dataTestReport: DataTestReport,
  ) {}

  /**
   * Genera un PDF a partir de una plantilla y datos, lo sube a un servicio de almacenamiento privado,
   * y opcionalmente obtiene una URL firmada para acceder al archivo.
   *
   * @param templateName Nombre de la plantilla Handlebars para generar el PDF.
   * @param data Datos a inyectar en la plantilla para generar el contenido del PDF.
   * @param fileName Nombre del archivo PDF que se creará (incluyendo extensión .pdf).
   * @param customPath (Opcional) Ruta personalizada dentro del bucket de almacenamiento donde se guardará el archivo.
   * @returns Objeto con: buffer del PDF, ruta de almacenamiento en el servicio, y URL firmada (si se pudo generar).
   * @throws InternalServerErrorException Si ocurre algún error durante la generación, subida u obtención de URL.
   */
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
          },
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
        const urlResult = await this.storageService.getFileUrl(
          uploadResult.path,
        );
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
      throw new InternalServerErrorException(
        'Failed to generate and upload PDF',
      );
    }
  }

  /**
   * Genera un buffer PDF a partir de una plantilla Handlebars y datos dinámicos.
   * Utiliza Puppeteer para convertir HTML a PDF con configuración específica de formato y márgenes.
   *
   * @param templateName Nombre del archivo de plantilla Handlebars (sin extensión .hbs).
   * @param data Objeto con datos dinámicos para inyectar en la plantilla.
   * @returns Buffer con el contenido binario del PDF generado.
   * @throws InternalServerErrorException Si la plantilla no existe o ocurre un error durante la generación del PDF.
   */
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
    const html = template({
      ...data,
      currentDate: new Date().toLocaleDateString(),
    });

    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        //executablePath: '/usr/bin/google-chrome', // Comentar esto para local
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1.5cm',
          right: '1.5cm',
          bottom: '1.5cm',
          left: '1.5cm',
        },
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

  /**
   * Genera un informe médico en PDF para un examen específico, lo sube a almacenamiento privado
   * y retorna metadatos de acceso. Combina obtención de datos, generación de PDF y subida a almacenamiento.
   *
   * @param labId ID del laboratorio donde se realizó el examen médico.
   * @param medicTestId ID del examen médico para el cual se generará el informe.
   * @returns Objeto con: indicador de éxito, mensaje descriptivo, ruta de almacenamiento, URL de descarga e información técnica del PDF.
   * @throws InternalServerErrorException Si falta medicTestId o ocurre error durante generación/subida.
   */
  async generateMedicReport(labId: number, medicTestId: number) {
    try {
      if (!medicTestId) {
        throw new InternalServerErrorException('El medicTestId es requerido');
      }

      const examData = await this.dataTestReport.getData(labId, medicTestId);
      const result = await this.generateAndUploadPdf(
        'medic-test-report',
        examData,
        `${medicTestId}.pdf`,
        `${labId}`,
      );

      return {
        success: true,
        message: 'PDF generado y subido correctamente',
        storagePath: result.storagePath,
        downloadUrl: result.url,
        pdfInfo: {
          size: result.pdfBuffer.length,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error al generar y subir PDF:', error);
      throw new InternalServerErrorException(
        error.message || 'Error al generar y subir el PDF',
      );
    }
  }
}
