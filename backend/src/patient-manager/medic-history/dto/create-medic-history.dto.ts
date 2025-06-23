// user/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMedicHistoryDto {
  @ApiProperty({
    example: '',
    description: 'Alergias del paciente',
  })
  @IsString({ each: true })
  @IsArray()
  allergies: string[];

  @ApiProperty({
    example: '',
    description: 'Patologías del paciente',
  })
  @IsString({ each: true })
  @IsArray()
  pathologies: string[];

  @ApiProperty({
    example: '1',
    description: 'Id del paciente',
  })
  @IsNotEmpty()
  @IsNumber()
  patientId: number;
}
