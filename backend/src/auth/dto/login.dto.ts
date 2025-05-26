// /src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'useremail@xample.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'pass1234' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
