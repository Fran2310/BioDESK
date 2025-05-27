import { Body, Controller, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { LabService } from './lab.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Asegúrate de tener este guard
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { UserService } from 'src/user/user.service';

@Controller('lab')
@UseGuards(JwtAuthGuard) // Protege todas las rutas del controlador
export class LabController {
  constructor(
    private readonly labService: LabService,
    private readonly userService: UserService,
) {}

  @UseInterceptors(FileInterceptor('logo'))
  @Post('create')
  async createLab(
    @Body() dto: CreateLabDto,
    @Request() req,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    const userUuid = req.user.sub;
    return this.userService.createLabForUser(userUuid, dto, logo);
  }
}