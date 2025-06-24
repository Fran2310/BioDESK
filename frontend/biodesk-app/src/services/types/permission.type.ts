export type RoleAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'set_state';

export type RoleSubject =
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

export type SystemUserField =
  | 'uuid'
  | 'ci'
  | 'name'
  | 'lastName'
  | 'email'
  | 'password'
  | 'salt'
  | 'isActive'
  | 'lastAccess';

export type LabUserField = 'systemUserUuid' | 'roleId';

export type LabField =
  | 'name'
  | 'dbName'
  | 'status'
  | 'rif'
  | 'dir'
  | 'phoneNums'
  | 'logoPath'
  | 'createdAt';

export type RoleField = 'role' | 'description' | 'permissions';

export type ActionHistoryField =
  | 'action'
  | 'details'
  | 'entity'
  | 'recordEntityId'
  | 'operationData'
  | 'madeAt'
  | 'labUserId';

export type PatientField =
  | 'ci'
  | 'name'
  | 'lastName'
  | 'secondName'
  | 'secondLastName'
  | 'gender'
  | 'email'
  | 'phoneNums'
  | 'dir'
  | 'birthDate';

export type MedicHistoryField = 'allergies' | 'pathologies' | 'patientId';

export type RequestMedicTestField =
  | 'requestedAt'
  | 'completedAt'
  | 'state'
  | 'priority'
  | 'resultProperties'
  | 'observation'
  | 'medicHistoryId'
  | 'medicTestCatalogId';

export type MedicTestCatalogField =
  | 'name'
  | 'description'
  | 'price'
  | 'supplies';

export type SubjectFieldsMap = {
  SystemUser: SystemUserField;
  LabUser: LabUserField;
  Lab: LabField;
  Role: RoleField;
  ActionHistory: ActionHistoryField;
  Patient: PatientField;
  MedicHistory: MedicHistoryField;
  RequestMedicTest: RequestMedicTestField;
  MedicTestCatalog: MedicTestCatalogField;
  all: string; // para permitir cualquier campo para 'all'
};
