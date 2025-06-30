<template>
  <VaDataTable
    :columns="columns"
    :items="mappedUsers"
    :per-page="10"
    v-model:page="page"
    :loading="usersLoading"
  >
    <template #cell(name)="{ rowData }">
      <div class="flex items-center gap-2 max-w-[230px] ellipsis">
        {{ rowData.name }}
      </div>
    </template>

    <template #cell(lastName)="{ rowData }">
      <div class="max-w-[120px] ellipsis">
        {{ rowData.lastName }}
      </div>
    </template>

    <template #cell(ci)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.ci }}
      </div>
    </template>

    <template #cell(roleId)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.role }}
      </div>
    </template>

    <template #cell(email)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.email }}
      </div>
    </template>

    <template #cell(actions)="{ rowData }">
      <div class="flex gap-2 justify-center items-center">
        <VaButton
          preset="primary"
          size="small"
          icon="edit"
          aria-label="Edit patient"
          @click="editUser(rowData)"
        />
        <VaButton
          preset="primary"
          size="small"
          icon="va-delete"
          color="danger"
          aria-label="Delete patient"
          @click="deleteUser(rowData)"
        />
      </div>
    </template>
  </VaDataTable>

  <div class="flex flex-col-reverse md:flex-row gap-2 justify-between items-center py-2">
    <div>
      <b>{{ mappedUsers.length }}</b> resultados. Resultados por página
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import { userApi } from '@/services/api'
import type { GetWithPermissionsQuerys } from '@/services/interfaces/global'
import type { LabData } from '@/services/interfaces/lab'
import { useLabStore } from '@/stores/labStore'

const users = ref<any[]>([])
const usersLoading = ref(true)

const labData: LabData = {
  id: 29,
  name: 'Laboratorium',
  status: 'active',
  rif: 'j853946049',
  logoPath: '',
}
const lab = useLabStore()
lab.setCurrentLab(labData)

async function fetchUsers() {
  const queries: GetWithPermissionsQuerys = {
    offset: 0,
    limit: 10,
    includePermissions: true,
  }
  const response = await userApi.getUsersMix(queries)
  users.value = Array.isArray(response.data.data) ? response.data.data : []
  usersLoading.value = false

  console.log(users.value)
}
onMounted(() => {
  fetchUsers()
})

const page = ref(1)

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'lastName', label: 'Apellido' },
  { key: 'ci', label: 'CI' },
  { key: 'role', label: 'Rol' },
  { key: 'email', label: 'Correo' },
  { key: 'actions', label: 'Acciones' },
]

// Aquí es donde se hace el MAPPING al formato de la tabla
const mappedUsers = computed(() =>
  users.value.map(u => ({
    id: u.systemUser.id,
    name: u.systemUser.name,
    lastName: u.systemUser.lastName,
    ci: u.systemUser.ci,
    email: u.systemUser.email,
    role: u.labUser.role.role,
    systemUser: u.systemUser,
    labUser: u.labUser,
  })),
)

function editUser(user) {
  console.log('Edit user:', user)
}

function deleteUser(user) {
  console.log('Delete user:', user)
}
</script>

<style scoped>
.va-data-table {
  ::v-deep(.va-data-table__table-tr) {
    border-bottom: 1px solid var(--va-background-border);
  }
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
