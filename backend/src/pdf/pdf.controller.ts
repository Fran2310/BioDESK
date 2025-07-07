import { Controller, Post, Body } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('[Testing] PDF Services')
@Public()
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate-and-upload')
  @ApiOperation({
    summary: 'Genera un PDF y lo sube a Supabase Storage',
    description:
      'Genera un PDF basado en una plantilla y datos de examen, luego lo almacena en Supabase Storage',
  })
  @ApiResponse({
    status: 201,
    description: 'PDF generado y subido exitosamente',
    schema: {
      example: {
        success: true,
        message: 'PDF generado y subido correctamente',
        storagePath: 'tests/examen_12345.pdf',
        downloadUrl:
          'https://xyz.supabase.co/storage/v1/object/signed/tests/examen_12345.pdf?token=...',
        pdfInfo: {
          size: 1024,
          generatedAt: '2023-07-20T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error al generar o subir el PDF',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        labId: {
          type: 'number',
          description: 'ID del laboratorio para obtener datos',
          required: ['true'],
          example: 12345,
        },
        medicTestId: {
          type: 'number',
          description: 'ID del examen para obtener datos',
          required: ['true'],
          example: 12345,
        },
        fileName: {
          type: 'string',
          description: 'Nombre personalizado para el archivo PDF',
          example: 'informe_medico.pdf',
          default: 'examen_{examId}.pdf',
        },
        customPath: {
          type: 'string',
          description: 'Ruta personalizada dentro del bucket',
          example: 'informes/2023',
        },
      },
      required: ['medicTestId'],
    },
  })
  async generateAndUploadPdf(
    @Body()
    body: {
      labId: number;
      medicTestId: number;
      fileName: string;
      customPath: string;
    },
  ) {
    return this.pdfService.generateMedicReport(body.labId, body.medicTestId);
  }
}
