import { Module } from '@nestjs/common';
import { LabUserService } from './lab-user.service';
import { RoleModule } from 'src/role/role.module';
import { LabPrismaModule } from 'src/lab-prisma/lab-prisma.module';

@Module({
  imports: [
    LabPrismaModule,
    RoleModule, // Importa el módulo de roles para manejar la lógica relacionada con los roles de usuario
  ],
  providers: [LabUserService],
  exports: [LabUserService],
})
export class LabUserModule {}
