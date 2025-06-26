import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { Readable } from 'stream';
import { StorageService } from 'src/storage/storage.service';
import { RequestMedicTestService } from 'src/patient-manager/request-medic-test/request-medic-test.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { LabDbManageService } from 'src/prisma-manage/lab-prisma/services/lab-db-manage.service';
import { LabService } from 'src/lab/services/lab.service';

import { AgeGroup, Gender } from '@prisma/client-lab';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly systemUserService: SystemUserService,
    private readonly labService: LabService,
    private readonly labDbManageService: LabDbManageService,

  ) {}

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
        margin: { top: '2.5cm', right: '1.5cm', bottom: '2.5cm', left: '1.5cm' },
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

  async generateMedicReport(
    labId: number,
    medicTestId: number,
  ) {
    try {

      if (!medicTestId) {
        throw new InternalServerErrorException('El medicTestId es requerido');
      }

      const examData = await this.getReportData(labId, medicTestId);
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
        error.message || 'Error al generar y subir el PDF'
      );
    }
  }

  /////////////////////////////////////////////
  ////////////////////////////////////////////
  //////////////////////////////////////////

  async getReportData( // TODO Esta función se podría pasar al PdfService o a un submodulo para eso
    labId: number,
    requestMedicTestId: number,
  ): Promise<any> {
    try {
      // --- 1. OBTENCIÓN DE DATOS CRUDOS ---
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      
      const [lab, requestWithRelations] = await Promise.all([
        this.labService.getLabById(labId),
        labPrisma.requestMedicTest.findUnique({
          where: { id: requestMedicTestId, state: 'COMPLETED' },
          include: {
            medicHistory: { include: { patient: true } },
            medicTestCatalog: { include: { properties: { include: { valueReferences: true } } } },
            byLabUser: true
          },
        }),
      ]);

      
      
      if (!requestWithRelations) {
        throw new NotFoundException(`Examen médico completado con ID ${requestMedicTestId} no fue encontrado.`);
      }

      const systemUser = await this.systemUserService.getSystemUser({ uuid: requestWithRelations?.byLabUser?.systemUserUuid });

      // --- 2. EXTRACCIÓN Y CÁLCULOS (CON MANEJO DE NULOS) ---

      const patient = requestWithRelations.medicHistory.patient;
      if (!patient) {
        throw new NotFoundException(`No se encontró el paciente asociado a la solicitud de examen.`);
      }

      // Declaramos las variables que pueden depender de la fecha de nacimiento
      let patientAge: number | null = null;
      let patientAgeGroup: AgeGroup = AgeGroup.ANY; // Default a 'ANY' para máxima compatibilidad

      // **CAMBIO CLAVE 1: Manejo de birthDate nulo**
      // Solo calculamos la edad si la fecha de nacimiento existe
      if (patient.birthDate) {
        patientAge = this.calculateAge(patient.birthDate);
        // Solo asignamos un grupo específico si la edad fue calculada
        if (patientAge !== null) {
            patientAgeGroup = patientAge >= 18 ? AgeGroup.ADULT : AgeGroup.CHILD;
        }
      }
      
      // --- 3. PROCESAMIENTO DE RESULTADOS (CON MANEJO DE NULOS) ---

      const results = requestWithRelations.medicTestCatalog.properties.map((prop) => {
        // **CAMBIO CLAVE 2: Manejo de resultProperties nulo**
        // Usamos el operador de encadenamiento opcional (?.) para evitar errores si resultProperties es null.
        // Si es null o la propiedad específica no existe, usamos 'N/A'.
        const resultValue = requestWithRelations.resultProperties?.[prop.name] ?? 'N/A';
        
        const referenceRange = this.findReferenceRange(
          prop.valueReferences,
          patient.gender,
          patientAgeGroup, // Usamos el ageGroup calculado (o el default 'ANY')
        );

        return {
          propertyName: prop.name,
          value: resultValue,
          unit: prop.unit ?? '',
          referenceRange,
        };
      });

      // --- 4. CONSTRUCCIÓN DEL OBJETO FINAL PARA LA PLANTILLA ---

      const reportData = {
        systemUser: {
          fullName: `${systemUser.name} ${systemUser.lastName}`,
          email: systemUser.email,
        },
        lab: {
          name: lab.name,
          rif: lab.rif,
          dir: lab.dir,
          phoneNums: lab.phoneNums,
          logoPath: lab.logoPath,
        },
        patient: {
          fullName: `${patient.name} ${patient.lastName}`,
          ci: patient.ci,
          // Mostramos la edad o un texto alternativo si no se pudo calcular
          age: patientAge !== null ? `${patientAge} años` : 'No especificada',
          gender: patient.gender,
          email: patient.email,
        },
        request: {
          id: requestWithRelations.id,
          // Agregamos una verificación para completedAt
          completedAtFormatted: requestWithRelations.completedAt
            ? requestWithRelations.completedAt.toLocaleDateString('es-VE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Pendiente', // O el texto que prefieras si es null
          medicTestName: requestWithRelations.medicTestCatalog.name,
          observation: requestWithRelations.observation,
        },
        results,
      };

      return reportData;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al generar los datos del reporte: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Ocurrió un error inesperado al procesar la solicitud del reporte.`);
    }
  }

  // --- Helpers ---
    private calculateAge(birthDate: Date | null): number | null {
      // Si la fecha es nula, devolvemos null inmediatamente.
      if (!birthDate) return null;
      
      const today = new Date("2025-06-26T04:05:19.000Z"); // Hora actual para consistencia
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }

    private findReferenceRange(references: any[], gender: Gender, ageGroup: AgeGroup): string {
        const specificMatch = references.find(
          (ref) => ref.gender === gender && ref.ageGroup === ageGroup,
        );
        if (specificMatch) return specificMatch.range;

        const anyGenderMatch = references.find(
          (ref) => ref.gender === Gender.ANY && ref.ageGroup === ageGroup,
        );
        if (anyGenderMatch) return anyGenderMatch.range;
        
        const anyAgeMatch = references.find(
          (ref) => ref.gender === gender && ref.ageGroup === AgeGroup.ANY,
        );
        if (anyAgeMatch) return anyAgeMatch.range;

        const fallback = references.find(
          (ref) => ref.gender === Gender.ANY && ref.ageGroup === AgeGroup.ANY,
        );
        return fallback ? fallback.range : 'No disponible';
    }
}