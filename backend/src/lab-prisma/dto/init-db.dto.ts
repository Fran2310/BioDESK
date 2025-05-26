// /src/lab-prisma/dto/init-db.dto.ts
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { normalizeDbName } from '../../common/utils/normalize-db-name';
import { ApiProperty } from '@nestjs/swagger';
export class InitDatabaseDto {
  @ApiProperty({
    example: 'laboratorio de pruebas',
    minLength: 3,
    maxLength: 63,
    pattern: '^[a-zA-Z0-9_ ]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => normalizeDbName(value))
  dbName: string;
}
