// /src/lab/lab.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { UserService } from 'src/user/user.service';
import { SkipLabIdCheck } from 'src/auth/decorators/skip-lab-id-check.decorator';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeaders,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ManageLogoLabService } from './services/manage-logo-lab.service';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';

@Controller('labs')
export class LabController {
  constructor(
    private readonly userService: UserService,
    private readonly manageLogoLabService: ManageLogoLabService,
  ) {}

  @SkipLabIdCheck()
  @Post('')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crea un laboratorio para el usuario del token JWT',
    description: `Crea un nuevo laboratorio asociado al usuario autenticado. NOTA!: El usuario que registra el el laboratorio será el administrador del mismo.`,
  })
  @ApiBody({ type: CreateLabDto })
  async createLab(@Body() dto: CreateLabDto, @Request() req) {
    const userUuid = req.user.sub;
    return this.userService.createLabForUser(userUuid, dto);
  }

  @SkipLabIdCheck()
  @Get('')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista los laboratorios asociados al usuario del token JWT',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        labs: [
          {
            id: 1,
            name: 'Laboratorio Santos',
            status: 'active',
            rif: 'J-12345678-9',
          },
          {
            id: 2,
            name: 'Lab Grillos',
            status: 'active',
            rif: 'J-45678901-9',
          },
        ],
      },
    },
  })
  async listLabs(@Request() req) {
    return this.userService.getLabList(req.user);
  }

  @Post('logo')
  @CheckAbility({
    actions: 'update, create',
    subject: 'Lab',
    fields: 'logoPath',
  })
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Subir logo para un laboratorio' })
  @ApiConsumes('multipart/form-data')
  @ApiHeaders([X_LAB_ID_HEADER])
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
      example: { logoPath: '/img/logolab/lab_8_logo.png' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o error en la solicitud',
  })
  @ApiResponse({ status: 404, description: 'Laboratorio no encontrado' })
  async uploadLabLogo(
    @Headers('x-lab-id') labIdHeader: string,
    @UploadedFile() logo: Express.Multer.File,
    @Request() req,
  ) {
    const labId = Number(labIdHeader);

    return this.manageLogoLabService.saveLabLogo(logo, labId, req.user.sub);
  }
}
