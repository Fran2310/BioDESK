// /src/user/lab.controller.ts
import {
  Body,
  Controller,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateLabDto } from './dto/create-lab.dto';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('labs')
export class LabController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(FileInterceptor('logo'))
  @Post()
  async createLab(
    @Body() dto: CreateLabDto,
    @Request() req,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    const userUuid = req.user.Uuid;
    return this.userService.createLabForUser(userUuid, dto, logo);
  }
}
