import type {
  RoleAction,
  RoleSubject,
  SubjectFieldsMap,
} from '../types/permission.type';

export interface RolePermission<S extends RoleSubject = RoleSubject> {
  actions: RoleAction[];
  subject: S;
  fields?: S extends keyof SubjectFieldsMap ? SubjectFieldsMap[S][] : string[];
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: RolePermission[];
}
