import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { UserService } from 'src/user/user.service';
import { SkipLabIdCheck } from 'src/auth/decorators/skip-lab-id-check.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ManageLogoLabService } from './services/manage-logo-lab.service';

@Controller('lab')
export class LabController {
  constructor(
    private readonly userService: UserService,
    private readonly manageLogoLabService: ManageLogoLabService,
  ) {}

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

  @SkipLabIdCheck()
  @Post(':id/logo')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Subir logo para un laboratorio' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de logo del laboratorio',
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Logo en formato PNG o SVG (max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logo actualizado exitosamente',
    schema: {
      example: { logoPath: '/img/logolab/lab_123_logo.png' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o error en la solicitud',
  })
  @ApiResponse({ status: 404, description: 'Laboratorio no encontrado' })
  async uploadLabLogo(
    @Param('id', ParseIntPipe) labId: number,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.manageLogoLabService.saveLabLogo(logo, labId);
  }
}
