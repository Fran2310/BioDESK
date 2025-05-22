import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateAdminLabDto } from './dto/create-admin-lab.dto';
// solo para testing
@Controller('user')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post('register-admin')
  async registerAdmin(@Body() dto: CreateAdminLabDto) {
    return this.userService.createSystemUserAndLab(dto);
  }
}
