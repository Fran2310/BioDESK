import { Test, TestingModule } from '@nestjs/testing';
import { SystemPrismaService } from './system-prisma.service';

describe('SystemPrismaService', () => {
  let service: SystemPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemPrismaService],
    }).compile();

    service = module.get<SystemPrismaService>(SystemPrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
