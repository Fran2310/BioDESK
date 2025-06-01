// /src/lab-prisma/services/lab-seeding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { LabPrismaFactory } from '../lab-prisma.factory';
import { CreateLabUserDto } from '../dto/create-lab-user.dto';
import { LabPrismaService } from './lab-prisma.service';

@Injectable()
export class LabSeedingService {
  private readonly logger = new Logger(LabSeedingService.name);

  constructor(private readonly labPrismaFactory: LabPrismaFactory) {}

  async seedLabUser(dbName: string, input: CreateLabUserDto) {
    const prisma: LabPrismaService =
      this.labPrismaFactory.createInstanceDB(dbName);

    try {
      await prisma.$connect();

      const { systemUserUuid, role } = input;

      // 1. Verifica si el rol ya existe
      let roleRecord = await prisma.role.findUnique({
        where: { role: role.name },
      });

      // 2. Si no existe, lo crea
      if (!roleRecord) {
        roleRecord = await prisma.role.create({
          data: {
            role: role.name,
            description: role.description,
            permissions: JSON.parse(JSON.stringify(role.permissions)), // Asegúrate de que las permissions estén en el formato correcto
          },
        });
      }

      // 3. Crea el LabUser si no existe
      const existingLabUser = await prisma.labUser.findUnique({
        where: { systemUserUuid },
      });

      if (!existingLabUser) {
        await prisma.labUser.create({
          data: {
            systemUserUuid,
            roleId: roleRecord.id,
          },
        });
      }

      this.logger.log(`✅ LabUser creado con rol '${role.name}' en ${dbName}`);
    } catch (error) {
      this.logger.error(`❌ Error al insertar usuario en ${dbName}`, error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}
