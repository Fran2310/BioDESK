import { Injectable } from '@nestjs/common';
import { LabPrismaService } from 'src/lab-prisma/services/lab-prisma.service';
import { RoleDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  async GetRoleByName(prisma: LabPrismaService, roleName: string) {
    const role = await prisma.role.findUnique({
      where: { role: roleName },
    });
    if (!role) {
      throw new Error(`Role with name ${roleName} not found`);
    }
    return role;
  }
  async CreateRoleIfNotExists(prisma: LabPrismaService, roleDto: RoleDto) {
    let role = await this.GetRoleByName(prisma, roleDto.name);

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
