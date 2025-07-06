// src/dto/upload-file-body.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UploadFileBodyDto {
  @IsString()
  @IsNotEmpty()
  // Expresión regular para evitar caracteres que puedan causar problemas en URLs/rutas.
  // Permite letras, números, guiones, guiones bajos y puntos.
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'File name contains invalid characters.',
  })
  fileName: string;

  @ApiProperty({
    description: 'La ruta personalizada dentro del bucket donde se guardará el archivo (opcional). Por ejemplo: "usuarios/id_usuario/fotos".',
    example: 'images/profile-pictures',
    required: false, // Indica que es opcional
  })
  @IsString()
  @IsOptional() // Marca este campo como opcional
  customPath?: string; // Hazlo opcional con '?'
}