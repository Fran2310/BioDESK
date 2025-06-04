// src/role/constants/default-roles.ts
export const DEFAULT_ADMIN_ROLE = {
  name: 'admin',
  description: 'Administrador del laboratorio',
  permissions: [{ actions: 'manage', subject: 'all' }],
};
