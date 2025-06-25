import type { Priority } from '../types/global.type';

export interface CreateMedicTestRequestData {
  priority: Priority;
  resultProperties: Record<string, string>;
  observation: string;
  medicHistoryId: number;
  medicTestCatalogId: number;
}

export interface PatchMedicTestRequestData {
  priority?: Priority;
  resultProperties?: Record<string, string>;
  observation?: string;
}
