// src/auth/dto/login-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsI...',
    description: 'JWT de acceso para autenticación',
    minLength: 100,
  })
  access_token: string;
}
