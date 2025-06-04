import { Injectable } from '@nestjs/common';
import { LabPrismaService } from 'src/lab-prisma/services/lab-prisma.service';
import { RoleDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  async findRoleByName(prisma: LabPrismaService, roleName: string) {
    return prisma.role.findUnique({
      where: { role: roleName },
    });
  }
  async CreateRoleIfNotExists(prisma: LabPrismaService, roleDto: RoleDto) {
    let role = await this.findRoleByName(prisma, roleDto.name);

    if (!role) {
      role = await prisma.role.create({
        data: {
          role: roleDto.name,
          description: roleDto.description,
          permissions: JSON.parse(JSON.stringify(roleDto.permissions)),
        },
      });
    }

    return role;
  }
}
