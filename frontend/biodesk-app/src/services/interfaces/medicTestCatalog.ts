import type { AgeGroup, GenderValueRef } from '../types/global.type';

export interface ValueReference {
  range: string;
  gender: GenderValueRef;
  ageGroup: AgeGroup;
}

export interface Property {
  name: string;
  unit: string;
  valueReferences: ValueReference[];
}

export interface CreateMedicTestCatalogData {
  name: string;
  description: string;
  price: number;
  supplies: string[];
  properties: Property[];
}
