import type { CreateRoleData } from './role';

export interface GetUserQuerys {
  uuid?: string;
  email?: string;
  ci?: string;
}

export interface UpdateSystemUserData {
  name?: string;
  lastName?: string;
  email?: string;
}

export interface CreateUserData {
  ci: string;
  name: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CreateUserWithRoleData {
  user: CreateUserData;
  role: CreateRoleData;
}

export interface CreateUserWithRoleIdData extends CreateUserData {
  roleId: number;
}

export interface AssignUserToLabData extends GetUserQuerys {
  roleId: number;
}

export interface AssignRoleToUserQuery {
  uuid: string;
  roleId: number;
}
