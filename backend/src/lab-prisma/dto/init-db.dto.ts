import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { normalizeDbName } from '../../common/utils/normalize-db-name';
export class InitDatabaseDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => normalizeDbName(value))
  dbName: string;
}
