// /src/user/dto/create-lab.dto.ts
import { IsNotEmpty, IsString, IsArray, ArrayMinSize } from 'class-validator';

export class CreateLabDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  rif: string;

  @IsNotEmpty()
  @IsString()
  dir: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  phoneNums: string[];
}
