// user/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMedicHistoryDto {
  @ApiProperty({
    example: '',
    description: 'Alergias del paciente',
  })
  @IsString()
  allergies: string;

  @ApiProperty({
    example: '',
    description: 'Patologías del paciente',
  })
  @IsString()
  pathologies: string;

  @ApiProperty({
    example: '1',
    description: 'Id del paciente',
  })
  @IsNotEmpty()
  @IsNumber()
  patientId: number;
}
