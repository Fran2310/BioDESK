// Composable para lógica de permisos y helpers
import { ref, computed } from 'vue'
import type { RoleFromApi, ApiRolePermission } from '../../../services/roleService'

// Helper para convertir un type union a array de strings
function typeToArray<T>(): string[] {
  return [];
}

const fieldsOptionsMap: Record<string, string[]> = {
  SystemUser: [
    'uuid', 'ci', 'name', 'lastName', 'email', 'password', 'salt', 'isActive', 'lastAccess'
  ],
  LabUser: [
    'systemUserUuid', 'roleId'
  ],
  Lab: [
    'name', 'dbName', 'status', 'rif', 'dir', 'phoneNums', 'logoPath', 'createdAt'
  ],
  Role: [
    'role', 'description', 'permissions'
  ],
  ActionHistory: [
    'action', 'details', 'entity', 'recordEntityId', 'operationData', 'madeAt', 'labUserId'
  ],
  Patient: [
    'ci', 'name', 'lastName', 'secondName', 'secondLastName', 'gender', 'email', 'phoneNums', 'dir', 'birthDate'
  ],
  MedicHistory: [
    'allergies', 'pathologies', 'patientId'
  ],
  RequestMedicTest: [
    'requestedAt', 'completedAt', 'state', 'priority', 'resultProperties', 'observation', 'medicHistoryId', 'medicTestCatalogId'
  ],
  MedicTestCatalog: [
    'name', 'description', 'price', 'supplies'
  ],
  all: [],
};

function getFieldsOptions(subject: string): string[] {
  if (!subject) return [];
  const options = fieldsOptionsMap[subject];
  return Array.isArray(options) ? options : [];
}

function groupPermissions(flatPermissions: string[]) {
  const grouped: Record<string, Set<string>> = {};
  flatPermissions.forEach((perm) => {
    const [subject, action] = perm.split(':');
    if (!grouped[subject]) grouped[subject] = new Set();
    grouped[subject].add(action);
  });
  return Object.entries(grouped).map(([subject, actions]) => ({
    subject,
    actions: Array.from(actions).join(',')
  }));
}

function groupPermissionsWithFields(flatPermissions: string[], permissionFields: Record<string, string>) {
  const grouped: Record<string, Set<string>> = {};
  flatPermissions.forEach((perm) => {
    const [subject, action] = perm.split(':');
    if (!grouped[subject]) grouped[subject] = new Set();
    grouped[subject].add(action);
  });
  return Object.entries(grouped).map(([subject, actions]) => ({
    subject,
    actions: Array.from(actions).join(','),
    fields: Object.entries(permissionFields)
      .filter(([key]) => key.startsWith(subject + ':'))
      .map(([, fields]) => fields)
      .filter(Boolean)[0] || undefined,
  }));
}

export function useRolePermissions() {
  return {
    getFieldsOptions,
    groupPermissions,
    groupPermissionsWithFields,
    fieldsOptionsMap,
    typeToArray
  }
}
