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
            
          >
            <template #cell(role)="{ rowData }">
              <span class="font-bold text-left w-full block">{{ rowData.role }}</span>
            </template>
            <template #cell(description)="{ rowData }">
              <span class="text-left w-full block">{{ rowData.description }}</span>
            </template>
            <template #cell(actions)="{ rowData }">
              <div class="flex gap-2 justify-start">
                <VaPopover
                  message="Editar rol"
                  class="flex items-center justify-center"
                  hover-out-timeout="0"
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="edit"
                    color="info"
                    aria-label="Editar rol"
                    class="no-hover-effect flex items-center justify-center"
                    @click.stop="openEditRoleModal(rowData)"
                  />
                </VaPopover>
                <VaPopover
                  message="Eliminar rol"
                  class="flex items-center justify-center"
                  hover-out-timeout="0"
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="delete"
                    color="danger"
                    aria-label="Eliminar rol"
                    class="no-hover-effect flex items-center justify-center"
                    @click.stop="deleteRole(rowData.id)"
                  />
                </VaPopover>
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
      <RoleFormWidget
        :is-edit="false"
        :role-name="newRoleName"
        :role-description="newRoleDescription"
        :permissions="permissions"
        :new-permission="newPermission"
        :subject-options="subjectOptions"
        :actions-options="actionsOptions"
        :get-fields-options="getFieldsOptions"
        :loading="modalLoading"
        :can-save="canSaveNewRole"
        @update:roleName="v => newRoleName = v"
        @update:roleDescription="v => newRoleDescription = v"
        @update:newPermission="v => newPermission = v"
        @add-permission="addPermission"
        @remove-permission="removePermission"
        @submit="handleCreateRole"
        @cancel="closeNewRoleModal(resetRoleForm)"
      />
    </va-modal>

    <!-- Modal para editar rol -->
    <va-modal v-model="showEditRoleModal" hide-default-actions size="800px">
      <RoleFormWidget
        :is-edit="true"
        :role-name="editRoleModalData.name"
        :role-description="editRoleModalData.description"
        :permissions="editRoleModalData.permissions"
        :new-permission="editRoleModalData.newPermission"
        :subject-options="subjectOptions"
        :actions-options="actionsOptions"
        :get-fields-options="getFieldsOptions"
        :loading="false"
        :can-save="canSaveEditRole"
        @update:roleName="v => { editRoleModalData.name = v }"
        @update:roleDescription="v => { editRoleModalData.description = v }"
        @update:newPermission="v => { editRoleModalData.newPermission = v }"
        @update:permissions="v => { editRoleModalData.permissions = v }"
        @add-permission="addEditRoleModalPermission"
        @remove-permission="removeEditRoleModalPermission"
        @submit="saveEditRoleModal(editRoleIdForModal)"
        @cancel="closeEditRoleModal"
      />
    </va-modal>

    <!-- Modal para ver detalles del rol -->
    <va-modal v-model="showRoleDetailsModal" hide-default-actions size="700px">
      <va-card>
        <va-card-title>
          <span class="text-lg font-bold text-primary">Detalles del rol</span>
        </va-card-title>
        <va-card-content>
          <div v-if="selectedRole">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <strong>Nombre:</strong>
                <span>{{ selectedRole.role }}</span>
              </div>
              <!-- Quitar el bloque de ID -->
              <!--
              <div>
                <strong>ID:</strong>
                <span>{{ selectedRole.id }}</span>
              </div>
              -->
              <div class="md:col-span-2">
                <strong>Descripción:</strong>
                <span>{{ selectedRole.description }}</span>
              </div>
            </div>
            <div class="mb-2 font-semibold text-base text-primary">Permisos:</div>
            <div class="overflow-auto">
              <table class="w-full text-left border-collapse border rounded">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="border-b pb-1 px-2 py-1">Área</th>
                    <th class="border-b pb-1 px-2 py-1">Acciones</th>
                    <th class="border-b pb-1 px-2 py-1">Campos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(perm, idx) in selectedRole.permissions" :key="idx">
                    <td class="pr-4 border-b px-2 py-1 font-semibold">{{ perm.subject }}</td>
                    <td class="pr-4 border-b px-2 py-1">
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
                    <td class="pr-4 border-b px-2 py-1">
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
          </div>
          <div v-else>No se ha seleccionado un rol válido.</div>
        </va-card-content>
        <template #footer>
          <va-button color="primary" @click="showRoleDetailsModal = false">Cerrar</va-button>
        </template>
      </va-card>
    </va-modal>

    <!-- Modal de advertencia por cambios no guardados -->
    <va-modal v-model="showEditUnsavedModal" hide-default-actions size="400px">
      <va-card>
        <va-card-title>
          <span class="text-lg font-bold">Advertencia</span>
        </va-card-title>
        <va-card-content>
          <div class="py-4">
            <p class="text-sm text-gray-700">
              Tienes cambios sin guardar en el formulario de edición. Si cierras este modal, se perderán los cambios.
            </p>
          </div>
        </va-card-content>
        <template #footer>
          <div class="flex justify-end gap-2">
            <VaButton
              color="danger"
              @click="showEditUnsavedModal = false; pendingEditFormHide?.(); pendingEditFormHide = null"
            >
              Cerrar sin guardar
            </VaButton>
            <VaButton
              color="primary"
              @click="showEditUnsavedModal = false"
            >
              Cancelar
            </VaButton>
          </div>
        </template>
      </va-card>
    </va-modal>

    <!-- Modal personalizado para advertir sobre cambios no guardados en edición -->
    <va-modal v-model="showEditUnsavedModal" hide-default-actions size="380px">
      <va-card>
        <va-card-title>
          <span class="text-lg font-bold text-danger">Cambios sin guardar</span>
        </va-card-title>
        <va-card-content>
          <div>El formulario tiene cambios sin guardar. ¿Seguro que lo quiere cerrar?</div>
        </va-card-content>
        <template #footer>
          <va-button color="danger" @click="() => { showEditUnsavedModal = false; if (pendingEditFormHide) { pendingEditFormHide(); pendingEditFormHide = null } }">Cerrar sin guardar</va-button>
          <va-button color="primary" @click="() => { showEditUnsavedModal = false; pendingEditFormHide = null }">Seguir editando</va-button>
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
import RoleFormWidget from './RoleFormWidget.vue'


// Estado de loading global y modal
const loading = ref(false)
const modalLoading = ref(false)

// Forzar actualización del modal de edición para que Vue reactive los cambios y el botón de guardar
const editModalForceUpdate = ref(0)
function forceUpdateEditModal() {
  editModalForceUpdate.value++
}


const api = useRoleApi()

const {
  showNewRoleModal,
  showEditRoleModal,
  showRoleDetailsModal,
  selectedRole,
  editRoleModalData,
  openEditRoleModal,
  closeEditRoleModal,
  closeNewRoleModal,
  addEditRoleModalPermission,
  removeEditRoleModalPermission,
  editRoleIdForModal // <-- Añade esta línea para exponer editRoleIdForModal
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
const showEditUnsavedModal = ref(false)
let pendingEditFormHide: null | (() => unknown) = null

// Modal personalizado para advertir sobre cambios no guardados al cerrar el modal de edición
const beforeEditFormModalClose = async (hide: () => unknown) => {
  if (editFormRef.value?.isFormHasUnsavedChanges) {
    showEditUnsavedModal.value = true
    pendingEditFormHide = hide
  } else {
    hide()
  }
}

// Eliminar rol con confirmación
const deleteRole = async (roleId: string) => {
  // Elimina cualquier confirm nativo, solo usa el modal de Vuestic UI
  const agreed = await confirm(
    '¿Seguro que quieres eliminar este rol?'
  )
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

/*
  Esta clase eliminará el fondo que aparece al pasar
  el mouse sobre los botones con preset="primary".
*/
.no-hover-effect:hover {
  background: transparent !important;
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

.va-card-content table {
  min-width: 600px;
  font-size: 13px;
}
.va-card-content th,
.va-card-content td {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
}
.va-card-content th {
  background: #f3f4f6;
  font-weight: bold;
}
</style>