import type {
  SystemUserField,
  LabUserField,
  LabField,
  RoleField,
  ActionHistoryField,
  PatientField,
  MedicHistoryField,
  RequestMedicTestField,
  MedicTestCatalogField,
} from '@/services/types/permission.type';

// Un tipo unión de todos los campos posibles de la db
export type SearchField =
  | SystemUserField
  | LabUserField
  | LabField
  | RoleField
  | ActionHistoryField
  | PatientField
  | MedicHistoryField
  | RequestMedicTestField
  | MedicTestCatalogField;
