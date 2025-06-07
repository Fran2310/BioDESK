// src/user/dto/user-data.dto.ts
import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UserDataDto extends OmitType(CreateUserDto, ['password']) {}
