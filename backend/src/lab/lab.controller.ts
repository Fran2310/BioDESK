import {
  Body,
  Controller,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LabService } from './lab.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateLabDto } from 'src/user/dto/create-lab.dto';
import { UserService } from 'src/user/user.service';
import { SkipLabIdCheck } from 'src/auth/decorators/skip-lab-id-check.decorator';

@Controller('lab')
export class LabController {
  constructor(
    private readonly labService: LabService,
    private readonly userService: UserService,
  ) {}

  @SkipLabIdCheck()
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
