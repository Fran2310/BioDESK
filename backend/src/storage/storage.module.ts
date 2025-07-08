import { Module } from '@nestjs/common';
import { SupabaseService } from './services/supabase.service';
import { StorageController } from './storage.controller';
import { StorageService } from './services/storage.service';

@Module({
  controllers: [StorageController],
  providers: [SupabaseService, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
