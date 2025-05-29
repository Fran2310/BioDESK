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

@Controller('lab')
export class LabController {
  constructor(private readonly userService: UserService) {}

  @SkipLabIdCheck()
  @Post('create')
  async createLab(@Body() dto: CreateLabDto, @Request() req) {
    const userUuid = req.user.sub;
    return this.userService.createLabForUser(userUuid, dto);
  }
}
