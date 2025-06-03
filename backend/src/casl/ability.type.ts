// /src/casl/app-ability.type.ts
import { MongoAbility, createMongoAbility, MongoQuery } from '@casl/ability';

export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'set_state';

export type Subjects =
  | 'SystemUser'
  | 'LabUser'
  | 'Lab'
  | 'Role'
  | 'ActionHistory'
  | 'Patient'
  | 'MedicHistory'
  | 'RequestMedicTest'
  | 'MedicTestCatalog'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects], MongoQuery>;
export const createAppAbility = createMongoAbility<
  [Actions, Subjects],
  MongoQuery
>;
