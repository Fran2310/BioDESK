import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileResponseDto } from './dto/file-response.dto';
import { UploadFileBodyDto } from './dto/upload-file.dto'; // Asegúrate de importar tu DTO
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SkipLabIdCheck } from 'src/auth/decorators/skip-lab-id-check.decorator';
import { StorageService } from './storage.service';

@ApiBearerAuth()
@SkipLabIdCheck()
@ApiTags('Storage [Tests]') // Para agrupar los endpoints en Swagger UI
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Sube un archivo a un bucket PÚBLICO.
   * Requiere un campo 'file' y un campo 'fileName' en el body multipart/form-data.
   */
  @Post('public/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'El archivo a subir.',
        },
        fileName: {
          type: 'string',
          description: 'El nombre deseado para el archivo.',
        },
        customPath: { // Agrega el nuevo campo customPath aquí
          type: 'string',
          description: 'La ruta personalizada dentro del bucket (opcional).',
          example: 'images/profiles',
        },
      },
      required: ['file', 'fileName'], // 'customPath' no es requerido aquí si es opcional en el DTO
    },
  })
  async uploadPublicFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadFileBodyDto,
  ): Promise<FileResponseDto> {
    this.logger.log(`Uploading public file: ${body.fileName} to path: ${body.customPath || 'default'}`);

    // Usa body.customPath si existe, de lo contrario usa un valor por defecto.
    const path = body.customPath || 'images'; // Define un valor por defecto si customPath no viene

    return this.storageService.uploadPublicFile(
      file,
      body.fileName,
      path,
    );
  }

  /**
   * Sube un archivo a un bucket PRIVADO.
   * Requiere un campo 'file' y un campo 'fileName' en el body multipart/form-data.
   */
  @Post('private/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'El archivo PDF a subir.',
        },
        fileName: {
          type: 'string',
          description: 'El nombre deseado para el archivo.',
        },
        customPath: { // Agrega el nuevo campo customPath aquí
          type: 'string',
          description: 'La ruta personalizada dentro del bucket (opcional).',
          example: 'documents/invoices/2024',
        },
      },
      required: ['file', 'fileName'],
    },
  })
  async uploadPrivateFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadFileBodyDto,
  ): Promise<{ path: string }> {
    this.logger.log(`Uploading private file: ${body.fileName} to path: ${body.customPath || 'default'}`);

    // Usa body.customPath si existe, de lo contrario usa un valor por defecto.
    const path = body.customPath || 'documents/general'; // Define un valor por defecto

    return this.storageService.uploadPrivateFile(
      file,
      body.fileName,
      path,
    );
  }

  @Get('file/:bucketName/*filePath') // Usamos :*filePath para capturar el resto de la ruta
  @ApiOperation({ summary: 'Obtiene la URL de un archivo por su ruta completa.' })
  @ApiParam({
    name: 'bucketName',
    description: 'El nombre del bucket donde se encuentra el archivo (ej: images, documents).',
    type: 'string',
    example: 'images',
  })
  @ApiParam({
    name: 'filePath',
    description: 'La ruta completa del archivo dentro del bucket (ej: profile-pictures/avatar.png).',
    type: 'string',
    example: 'profile-pictures/user123/avatar.png',
  })
  async getFile(
    @Param('bucketName') bucketName: string,
    @Param('filePath') filePath: string, // NestJS combina automáticamente el resto de la ruta
  ): Promise<{ url: string }> {
    // Reconstruye la fullPath para pasarla al servicio
    const fullPath = `${bucketName}/${filePath}`;
    this.logger.log(`Request to get URL for file: ${fullPath}`);
    return this.storageService.getFileUrl(fullPath);
  }
}