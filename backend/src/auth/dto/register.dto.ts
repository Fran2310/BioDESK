// /src/auth/dto/register.dto.ts
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';

export class RegisterDto extends CreateUserDto {
  @ValidateNested()
  @Type(() => CreateLabDto)
  lab: CreateLabDto;
}
