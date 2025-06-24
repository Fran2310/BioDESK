export interface GetBaseQuerys {
  'search-fields'?: string;
  'search-term'?: string;
  offset: number;
  limit: number;
}

export interface GetExtendQuerys extends GetBaseQuerys {
  includeData: boolean;
}
