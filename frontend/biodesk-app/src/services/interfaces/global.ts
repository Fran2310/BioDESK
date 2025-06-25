import type { SearchField } from '../types/searchFields.type';

export interface GetBaseQuerys {
  'search-fields'?: SearchField[];
  'search-term'?: string;
  offset: number;
  limit: number;
}

export interface GetExtendQuerys extends GetBaseQuerys {
  includeData: boolean;
}

export interface GetWithPermissionsQuerys extends GetBaseQuerys {
  includePermissions: boolean;
}
