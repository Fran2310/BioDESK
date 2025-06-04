import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { RoleDto } from './dto/role.dto';

@Module({
  providers: [RoleService, RoleDto],
  controllers: [RoleController],
  exports: [RoleDto],
})
export class RoleModule {}
