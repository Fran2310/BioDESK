import { ref } from 'vue';
import { userApi } from '@/services/api';
import type { GetWithPermissionsQuerys } from '@/services/interfaces/global';

const userRole = ref('');

let loaded = false;

export async function loadUserRole() {
  if (loaded) return;
  loaded = true;
  try {
    const { data } = await userApi.getMe();
    const query: GetWithPermissionsQuerys = {
      'search-fields': ['ci'],
      'search-term': data.ci,
      offset: 0,
      limit: 100,
      includePermissions: false,
    };
    const response = await userApi.getUsersMix(query);
    const user = response.data.data[0];
    userRole.value = user?.labUser?.role?.role || 'Rol desconocido';
  } catch {
    userRole.value = 'Rol desconocido';
  }
}

export function useUserRole() {
  return { userRole, loadUserRole };
}
