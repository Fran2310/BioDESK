// /src/user/lab.controller.ts
import { Body, Controller, Post, Request } from '@nestjs/common';
import { CreateLabDto } from './dto/create-lab.dto';
import { UserService } from './user.service';

@Controller('labs')
export class LabController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createLab(@Body() dto: CreateLabDto, @Request() req) {
    const userUuid = req.user.Uuid;
    return this.userService.createLabForUser(userUuid, dto);
  }
}
