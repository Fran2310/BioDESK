import {
  Body,
  Controller,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { UserService } from 'src/user/user.service';
import { SkipLabIdCheck } from 'src/auth/decorators/skip-lab-id-check.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('lab')
export class LabController {
  constructor(private readonly userService: UserService) {}

  @SkipLabIdCheck()
  @Post('create')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crea un laboratorio para el usuario',
    description: `Crea un nuevo laboratorio asociado al usuario autenticado. NOTA!: El usuario que registra el el laboratorio será el administrador del mismo.`,
  })
  @ApiBody({ type: CreateLabDto })
  async createLab(@Body() dto: CreateLabDto, @Request() req) {
    const userUuid = req.user.sub;
    return this.userService.createLabForUser(userUuid, dto);
  }
}
