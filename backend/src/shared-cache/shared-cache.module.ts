// src/shared-cache/shared-cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SharedCacheService } from './shared-cache.service';

@Module({
  imports: [
    CacheModule.register({
      max: 500, // Máximo 500 elementos en caché
    }),
  ],
  providers: [SharedCacheService],
  exports: [SharedCacheService],
})
export class SharedCacheModule {}