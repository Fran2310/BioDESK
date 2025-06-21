// /src/auth/dto/register.dto.ts
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateUserDto } from 'src/user/system-user/dto/create-user.dto';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto extends CreateUserDto {
  /*
  @ApiProperty({
    description: 'Datos del laboratorio asociado',
    type: () => CreateLabDto, // Referencia explícita como función
  })
  @ValidateNested()
  @Type(() => CreateLabDto)
  lab: CreateLabDto;
  */
}
