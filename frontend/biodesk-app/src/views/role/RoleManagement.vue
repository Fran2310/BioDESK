<template>
  <div class="role-management">
    <!-- Roles existentes -->
    <va-card class="max-w-full w-full mb-4">
        <va-card-title>
            <span class="text-2xl font-bold">Roles existentes</span>
        </va-card-title>
        <va-card-content>
            <div class="flex flex-wrap gap-4 items-center mb-4">
                <va-input
                    v-model="search"
                    placeholder="Buscar rol..."
                    class="w-64"
                    clearable   
                />
                <va-spacer />
                <VaButton color="primary" @click="showNewRoleModal = true">
                Crear un nuevo rol
                </VaButton>
            </div> 
        </va-card-content>
    </va-card>
          
    <va-card class="max-w-full w-full">
      <va-card-content style="position: relative; min-height: 220px;">
        <div style="position: relative;">
          <va-data-table
            :columns="roleColumns"
            :items="filteredRoles"
            class="shadow rounded min-h-[200px]"
            :virtual-scroller="false"
            @row:click="onRowClick"
            :row-class="getRowClass"
          >
            <template #cell(role)="{ rowData }">
              <span class="font-bold text-left w-full block">{{ rowData.role }}</span>
            </template>
            <template #cell(description)="{ rowData }">
              <span class="text-left w-full block">{{ rowData.description }}</span>
            </template>
            <template #cell(actions)="{ rowData }">
              <div class="flex gap-2 justify-start">
                <VaButton preset="primary" icon="edit" size="small" @click.stop="openEditRoleModal(rowData)"/>
                <VaButton preset="primary" icon="va-delete" color="danger" size="small" @click.stop="deleteRole(rowData.id)"/>
              </div>
            </template>
          </va-data-table>
          <div v-if="loading" class="table-spinner-overlay-fix">
            <va-progress-circle indeterminate size="large" color="primary" />
          </div>
        </div>
      </va-card-content>
    </va-card>

    <!-- Modal para agregar nuevo rol -->
    <va-modal v-model="showNewRoleModal" hide-default-actions size="800px">
      <va-card class="w-full">
        <va-card-title>
          <span class="text-lg font-bold">Agregar nuevo rol</span>
        </va-card-title>
        <va-card-content>
          <form @submit.prevent="handleCreateRole">
            <div class="mb-4">
              <label class="block mb-1 font-semibold text-m">Nombre</label>
              <va-input
                v-model="newRoleName"
                class="w-full"
                placeholder="Ej: Administrador"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-semibold text-m">Descripción</label>
              <va-input
                v-model="newRoleDescription"
                class="w-full"
                placeholder="Descripción del rol"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-semibold text-m">Permisos</label>
              <div class="grid grid-cols-4 gap-2 m-2">
                <va-select
                  v-model="newPermission.subject"
                  :options="subjectOptions"
                  placeholder="Área"
                  size="small"
                  class="col-span-1"
                />
                <va-select
                  v-model="newPermission.actions"
                  :options="actionsOptions"
                  placeholder="Acciones"
                  size="small"
                  multiple
                  class="col-span-1"
                />
                <va-select
                  v-model="newPermission.fields"
                  :options="getFieldsOptions(newPermission.subject)"
                  placeholder="Campos"
                  size="small"
                  multiple
                  class="col-span-1"
                />
                <va-button
                  color="primary"
                  size="small"
                  @click="addPermission"
                  class="col-span-1"
                >
                  Agregar permiso
                </va-button>
              </div>

              <!-- Lista de permisos añadidos -->
              <div
                v-for="(permission, index) in permissions"
                :key="index"
                class="permission-block mt-4"
              >
                <div class="permission-header grid grid-cols-4 gap-2 items-center mb-2 w-full">
                  <div class="col-span-1 font-semibold permission-name">
                    {{ permission.subject }}
                  </div>
                  <div class="col-span-1 permission-actions flex flex-wrap gap-1">
                    <VaChip
                      v-for="(action, aIdx) in (Array.isArray(permission.actions) ? permission.actions : String(permission.actions).split(','))"
                      :key="aIdx"
                      size="small"
                      color="primary"
                      class="mr-1 mb-1"
                    >
                      {{ action }}
                    </VaChip>
                  </div>
                  <div class="col-span-1 permission-fields flex flex-wrap gap-1">
                    <VaChip
                      v-for="(field, fIdx) in (Array.isArray(permission.fields) ? permission.fields : String(permission.fields || '').split(',').filter(f => f.trim() !== ''))"
                      :key="fIdx"
                      size="small"
                      color="info"
                      class="mr-1 mb-1"
                    >
                      {{ field }}
                    </VaChip>
                  </div>
                  <div class="flex justify-end">
                    <VaButton
                      preset="primary" 
                      icon="va-delete"
                      color="danger"
                      size="small"
                      @click="removePermission(index)"
                      class="ml-2 self-start"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <VaButton color="danger" type="reset" @click="closeNewRoleModal">Cancelar</VaButton>
              <VaButton
                color="primary"
                type="submit"
                :disabled="!canSaveNewRole || modalLoading"
              >
                <span v-if="modalLoading">
                  <svg class="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Guardando...
                </span>
                <span v-else>Guardar</span>
              </VaButton>
            </div>
          </form>
        </va-card-content>
      </va-card>
    </va-modal>

    <!-- Modal para editar rol -->
    <va-modal v-model="showEditRoleModal" hide-default-actions size="800px">
      <va-card class="w-full">
        <va-card-title>
          <span class="text-lg font-bold">Editar rol</span>
        </va-card-title>
        <va-card-content>
          <form @submit.prevent="saveEditRoleModal">
            <div class="mb-4">
              <label class="block mb-1 font-semibold text-m">Nombre</label>
              <va-input
                v-model="editRoleModalData.name"
                class="w-full"
                placeholder="Ej: Administrador"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-semibold text-m">Descripción</label>
              <va-input
                v-model="editRoleModalData.description"
                class="w-full"
                placeholder="Descripción del rol"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-semibold text-m">Permisos</label>
              <div
                v-for="(perm, idx) in editRoleModalData.permissions"
                :key="idx"
                class="flex flex-wrap gap-2 mb-2 items-center"
              >
                <va-select
                  v-model="perm.subject"
                  :options="subjectOptions"
                  class="input-xs"
                  placeholder="Subject"
                  size="small"
                  clearable
                  style="min-width: 120px; max-width: 180px;"
                />
                <va-select
                  v-model="perm.actions"
                  :options="actionsOptions"
                  class="input-xs"
                  placeholder="Actions"
                  size="small"
                  multiple
                  clearable
                  :reduce="(a: string) => a"
                  :map-options="false"
                  style="min-width: 120px; max-width: 180px;"
                />
                <va-select
                  v-model="perm.fields"
                  :options="getFieldsOptions(perm.subject)"
                  class="input-xs"
                  placeholder="Fields"
                  size="small"
                  multiple
                  clearable
                  :reduce="(a: string) => a"
                  :map-options="false"
                  :disabled="!perm.subject || getFieldsOptions(perm.subject).length === 0"
                  style="min-width: 120px; max-width: 180px;"
                />
                <va-button
                  color="danger"
                  size="small"
                  @click="removeEditRoleModalPermission(idx)"
                  icon="delete"
                  class="ml-1"
                  aria-label="Eliminar permiso"
                />
              </div>
              <VaButton
                color="primary"
                size="small"
                class="mt-2"
                @click="addEditRoleModalPermission"
                icon="add"
                type="button"
              >
                Agregar Permiso
              </VaButton>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <VaButton color="danger" type="reset" @click="closeEditRoleModal">Cancelar</VaButton>
              <VaButton
                color="primary"
                type="submit"
                :disabled="!canSaveEditRole"
              >Guardar</VaButton>
            </div>
          </form>
        </va-card-content>
      </va-card>
    </va-modal>

    <!-- Modal para ver detalles del rol -->
    <va-modal v-model="showRoleDetailsModal" hide-default-actions size="700px">
      <va-card>
        <va-card-title>
          <span class="text-lg font-bold">Detalles del Rol</span>
        </va-card-title>
        <va-card-content>
          <div v-if="selectedRole">
            <div class="mb-2"><b>Nombre:</b> {{ selectedRole.role }}</div>
            <div class="mb-2"><b>Descripción:</b> {{ selectedRole.description }}</div>
            <div class="mb-2"><b>ID:</b> {{ selectedRole.id }}</div>
            <div class="mb-2"><b>Permisos:</b></div>
            <table class="w-full border mt-2">
              <thead>
                <tr>
                  <th class="border px-2 py-1 text-left">Área</th>
                  <th class="border px-2 py-1 text-left">Acciones</th>
                  <th class="border px-2 py-1 text-left">Campos</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(perm, idx) in selectedRole.permissions" :key="idx">
                  <td class="border px-2 py-1 mr-1">{{ perm.subject }}</td>
                  <td class="border px-2 py-1 mr-1">
                    <div class="flex flex-wrap gap-1">
                      <VaChip
                        v-for="(action, aIdx) in (Array.isArray(perm.actions) ? perm.actions : String(perm.actions).split(',').filter(a => a.trim() !== ''))"
                        :key="aIdx"
                        size="small"
                        color="primary"
                        class="mr-1 mb-1"
                      >
                        {{ action }}
                      </VaChip>
                    </div>
                  </td>
                  <td class="border px-2 py-1 mr-1">
                    <div class="flex flex-wrap gap-1">
                      <VaChip
                        v-for="(field, fIdx) in (('fields' in perm && perm.fields) ? (Array.isArray(perm.fields) ? perm.fields : String(perm.fields).split(',').filter(f => f.trim() !== '')) : [])"
                        :key="fIdx"
                        size="small"
                        color="info"
                        class="mr-1 mb-1"
                      >
                        {{ field }}
                      </VaChip>
                      <span v-if="!('fields' in perm) || !perm.fields || (Array.isArray(perm.fields) && perm.fields.length === 0)">-</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </va-card-content>
        <template #footer>
          <va-button color="primary" @click="showRoleDetailsModal = false">Cerrar</va-button>
        </template>
      </va-card>
    </va-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { VaButton, VaProgressCircle, useModal } from 'vuestic-ui'

import { useRolePermissions } from './composables/useRolePermissions'
import { useRoleApi } from './composables/useRoleApi'
import { useRoleForm } from './composables/useRoleForm'
import { useRoleActions } from './composables/useRoleActions'
import { useRoleModals } from './composables/useRoleModals'

// Estado de loading global y modal
const loading = ref(false)
const modalLoading = ref(false)


const api = useRoleApi()

const {
  showNewRoleModal,
  showEditRoleModal,
  showRoleDetailsModal,
  selectedRole,
  editRoleIdForModal,
  editRoleModalData,
  openEditRoleModal,
  closeEditRoleModal,
  closeNewRoleModal,
  addEditRoleModalPermission,
  removeEditRoleModalPermission
} = useRoleModals()

const {
  newRoleName,
  newRoleDescription,
  selectedPermissions,
  selectedRoleId,
  permissions,
  newPermission,
  addPermission,
  removePermission,
  saveEditRoleModal,
  resetRoleForm
} = useRoleForm({
  roles: api.roles,
  fetchAllPermissions: api.fetchAllPermissions,
  fetchAllRoles: api.fetchAllRoles,
  editRoleModalData,
  updateRoleApi: api.updateRole,
  closeEditRoleModal,
  showNewRoleModal
})

const { getFieldsOptions } = useRolePermissions()

const { createRole: createRoleApi, canSaveNewRole } = useRoleActions({
  newRoleName,
  newRoleDescription,
  permissions,
  createRoleApi: api.createRole,
  fetchAllRoles: api.fetchAllRoles,
  showNewRoleModal
})

// Función para crear rol con loading modal
const handleCreateRole = async () => {
  modalLoading.value = true
  try {
    await createRoleApi()
    closeNewRoleModal(resetRoleForm)
  } catch (e) {
    // Puedes mostrar un toast de error aquí si lo deseas
  } finally {
    modalLoading.value = false
  }
}

const editFormRef = ref()
const { confirm } = useModal()

const beforeEditFormModalClose = async (hide: () => unknown) => {
  if (editFormRef.value?.isFormHasUnsavedChanges) {
    const agreed = await confirm({
      maxWidth: '380px',
      message: 'El formulario tiene cambios sin guardar. ¿Seguro que lo quiere cerrar?',
      size: 'small',
    });
    if (agreed) {
      hide();
    }
  } else {
    hide();
  }
}

// Eliminar rol con confirmación
const deleteRole = async (roleId: string) => {
  // Elimina cualquier confirm nativo, solo usa el modal de Vuestic UI
  const agreed = await confirm({
    title: 'Eliminar rol',
    message: '¿Seguro que quieres eliminar este rol?',
    okText: 'Eliminar',
    cancelText: 'Cancelar',
    size: 'small',
    maxWidth: '380px',
  })
  if (!agreed) return
  loading.value = true
  try {
    await api.deleteRole(roleId)
    if (selectedRoleId.value === roleId) {
      selectedRoleId.value = null
    }
    await api.fetchAllRoles()
  } finally {
    loading.value = false
  }
}

// Filtros y helpers
const search = ref('')
const filteredRoles = computed(() => {
  if (!search.value) return api.roles.value
  const term = search.value.toLowerCase()
  return api.roles.value.filter(role =>
    (role.role && String(role.role).toLowerCase().includes(term)) ||
    (role.description && String(role.description).toLowerCase().includes(term)) ||
    (Array.isArray(role.permissions) &&
      role.permissions.some(p =>
        (p.subject && String(p.subject).toLowerCase().includes(term)) ||
        (Array.isArray(p.actions)
          ? p.actions.some(a => String(a).toLowerCase().includes(term))
          : typeof p.actions === 'string'
            ? String(p.actions).toLowerCase().includes(term)
            : false
        )
      )
    )
  )
})

const subjectOptions = [
  'SystemUser',
  'LabUser',
  'Lab',
  'Role',
  'ActionHistory',
  'Patient',
  'MedicHistory',
  'RequestMedicTest',
  'MedicTestCatalog',
  'all'
]
const actionsOptions = [
  'create',
  'read',
  'update',
  'delete',
  'manage',
  'set_state'
]

// Tabla
const roleColumns = [
  { key: 'role', label: 'Nombre', thClass: 'text-center text-lg', tdClass: 'text-left text-base w-[220px]' },
  { key: 'description', label: 'Descripción', thClass: 'text-center text-lg', tdClass: 'text-left text-base w-[320px]' },
  { key: 'actions', label: 'Acciones', thClass: 'text-center text-lg', tdClass: 'text-left text-base w-[180px]' },
]

// Modal detalles
function onRowClick(event: { item: any }) {
  selectedRole.value = event.item
  showRoleDetailsModal.value = true
}
function getRowClass(row: any) {
  return selectedRole.value && selectedRole.value.id === row.id ? 'bg-gray-100' : ''
}

// Guardar botones
const canSaveEditRole = computed(() => {
  if (!editRoleModalData.value.name.trim() || !editRoleModalData.value.description.trim()) return false
  if (!editRoleModalData.value.permissions.length) return false
  for (const p of editRoleModalData.value.permissions) {
    if (!p.subject || !p.actions || (Array.isArray(p.actions) ? p.actions.length === 0 : !p.actions)) return false
  }
  return true
})

// Watchers y lifecycle
watch(selectedRoleId, (roleId) => {
  if (!roleId) {
    selectedPermissions.value = []
    return
  }
  const role = api.roles.value.find((r: any) => r.id === roleId)
  if (role && Array.isArray(role.permissions)) {
    selectedPermissions.value = role.permissions.flatMap((p: any) =>
      p.actions.map((action: string) => `${p.subject}:${action}`)
    )
  } else {
    selectedPermissions.value = []
  }
}, { immediate: true })

onMounted(async () => {
  loading.value = true
  try {
    await api.fetchAllPermissions()
    await api.fetchAllRoles()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.role-management {
  max-width: 100vw;
  margin: 0 auto;
  padding: 2rem;
}
.va-card-title {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
.input-xs {
  min-width: 120px;
  max-width: 180px;
}

/* Centrar los títulos de la tabla y alinear el contenido a la izquierda */
.custom-roles-table ::v-deep th {
  text-align: center !important;
}
.custom-roles-table ::v-deep td {
  text-align: left !important;
}

/* Aumenta el tamaño de fuente de los encabezados de la tabla */
.va-data-table thead th,
::v-deep(.va-data-table__table-th) {
  font-size: 0.7rem !important;
  font-weight: bold !important;
  /* Puedes ajustar el tamaño aquí */
}

.permission-block {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #f9f9f9;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-name,
.permission-actions,
.permission-fields {
  font-size: 14px;
  color: #333;
  word-break: break-word; /* Permite que los textos largos se dividan en varias líneas */
}
/* Spinner overlay para la tabla de roles */
.table-spinner-overlay-fix {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  pointer-events: all;
}
</style>