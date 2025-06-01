// /src/user/dto/create-lab.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, ArrayMinSize } from 'class-validator';

export class CreateLabDto {
  @ApiProperty({
    example: 'Laboratorio de pruebas',
    description: 'Nombre comercial del laboratorio',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'j123456789',
    description: 'RIF en formato jXXXXXXXXX',
    pattern: '^j\\d{9}$',
  })
  @IsNotEmpty()
  @IsString()
  rif: string;

  @ApiProperty({
    example: 'Av. Principal #123',
    description: 'Dirección fiscal completa',
  })
  @IsNotEmpty()
  @IsString()
  dir: string;

  @ApiProperty({
    type: [String],
    minItems: 1,
    example: ['04121234567', '02121234567'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  phoneNums: string[];
}
