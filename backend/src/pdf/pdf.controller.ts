import { Controller, Get, Query, Res, Post, Body, InternalServerErrorException } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { Response } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('PDF Services') // Agrega agrupación en Swagger UI
@Public()
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate-and-upload')
  @ApiOperation({
    summary: 'Genera un PDF y lo sube a Supabase Storage',
    description: 'Genera un PDF basado en una plantilla y datos de examen, luego lo almacena en Supabase Storage'
  })
  @ApiResponse({
    status: 201,
    description: 'PDF generado y subido exitosamente',
    schema: {
      example: {
        success: true,
        message: 'PDF generado y subido correctamente',
        storagePath: 'tests/examen_12345.pdf',
        downloadUrl: 'https://xyz.supabase.co/storage/v1/object/signed/tests/examen_12345.pdf?token=...',
        pdfInfo: {
          size: 1024,
          generatedAt: '2023-07-20T12:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Error al generar o subir el PDF'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          description: 'Nombre de la plantilla a usar (sin extensión .hbs)',
          example: 'default',
          default: 'default'
        },
        examId: {
          type: 'string',
          description: 'ID del examen para obtener datos',
          required: ['true'],
          example: '12345'
        },
        fileName: {
          type: 'string',
          description: 'Nombre personalizado para el archivo PDF',
          example: 'informe_medico.pdf',
          default: 'examen_{examId}.pdf'
        },
        customPath: {
          type: 'string',
          description: 'Ruta personalizada dentro del bucket',
          example: 'informes/2023'
        }
      },
      required: ['examId']
    }
  })
  async generateAndUploadPdf(
    @Body() body: {
      template?: string;
      examId: string;
      fileName?: string;
      customPath?: string;
    },
  ) {
    try {
      const { template = 'default', examId, fileName = `examen_${examId}.pdf`, customPath } = body;

      if (!examId) {
        throw new InternalServerErrorException('El examId es requerido');
      }

      const examData = await this.pdfService.getExamData(examId);
      const result = await this.pdfService.generateAndUploadPdf(
        template,
        examData,
        fileName,
        customPath,
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
}