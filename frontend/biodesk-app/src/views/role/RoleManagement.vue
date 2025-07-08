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
      <va-card-content>
        <div v-if="loadingRoles" class="flex justify-center items-center py-8">
          <va-progress-circle indeterminate size="large" color="primary" />
        </div>
        <va-data-table
          v-else
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
      </va-card-content>
    </va-card>

    <!-- Modal para agregar nuevo rol -->
    <va-modal v-model="showNewRoleModal" hide-default-actions size="800px">
      <va-card class="w-full">
        <va-card-title>
          <span class="text-lg font-bold">Agregar nuevo rol</span>
        </va-card-title>
        <va-card-content>
          <form @submit.prevent="createRole">
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
                  <div class="col-span-1 permission-fields">
                    {{ Array.isArray(permission.fields) ? permission.fields.join(', ') : permission.fields }}
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
              <VaButton color="primary" type="submit">Guardar</VaButton>
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
              <VaButton color="primary" type="submit">Guardar</VaButton>
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
                    <span v-if="Array.isArray(perm.actions)">
                      {{ perm.actions.join(', ') }}
                    </span>
                    <span v-else>
                      {{ perm.actions }}
                    </span>
                  </td>
                  <td class="border px-2 py-1 mr-1">
                    <span v-if="'fields' in perm && perm.fields">
                      {{ perm.fields }}
                    </span>
                    <span v-else>-</span>
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
// Importa las funciones del servicio y los tipos que acabamos de definir
import {
  getRoles,
  createRoleApi,
  assignPermissionsApi,
  getPermissions,
  updateRoleApi,
  deleteRoleApi,
} from '../../services/roleService' // Asegúrate de que la ruta sea correcta

import type {
  RoleFromApi,
  ApiRolePermission,
  CreateRolePayload,
  FlatPermissionsArray
} from '../../services/roleService' 

import { VaButton, VaProgressCircle } from 'vuestic-ui'
// Importa los types para obtener los fields dinámicamente
import * as PermissionTypes from '../../services/types/permission.type'

// Helper para convertir un type union a array de strings
function typeToArray<T>(): string[] {
  // TypeScript types no existen en runtime, así que esto es solo para claridad.
  // Debes definir manualmente los arrays si quieres tipado estricto.
  return [];
}

// Construye el mapa de fields usando arrays explícitos (garantiza string[])
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

// Helper para obtener las opciones de fields según el subject seleccionado
function getFieldsOptions(subject: string): string[] {
  if (!subject) return [];
  const options = fieldsOptionsMap[subject];
  return Array.isArray(options) ? options : [];
}

const newRoleName = ref('')
const newRoleDescription = ref('')
const selectedPermissions = ref<string[]>([]) // Esto sigue siendo string[] ('subject:action')
const roles = ref<RoleFromApi[]>([]) // Ahora tipado correctamente
const permissionGroups = ref<Record<string, any[]>>({}) // Tipado más específico
const selectedRoleId = ref<string | null>(null)

// Edición de roles
const editingRoleId = ref<string | null>(null)
const editRoleFields = ref<Record<string, { name: string; description: string }>>({});
const permissionFields = ref<Record<string, string>>({}); // Nuevo: campos por permiso

const permissions = ref([]);
const newPermission = ref({ subject: '', actions: [], fields: [] });

const loadingRoles = ref(false)

const fetchAllRoles = async () => {
  loadingRoles.value = true
  try {
    const res = await getRoles();
    console.log('Respuesta de getRoles:', res); // <-- ¿Es un array?
    roles.value = res || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    alert('Error al cargar roles.');
  } finally {
    loadingRoles.value = false
  }
}

const fetchAllPermissions = async () => {
  loadingRoles.value = true
  try {
    // Usa el helper del servicio, que ya llama a getRoles y agrupa los permisos
    permissionGroups.value = await getPermissions();
    // Si quieres también refrescar la lista de roles:
    roles.value = await getRoles();
  } catch (error) {
    console.error('Error fetching permissions:', error);
    alert('Error al cargar permisos.');
  } finally {
    loadingRoles.value = false
  }
}

// Utilidad para agrupar permisos y convertirlos al formato correcto
function groupPermissions(flatPermissions: string[]) {
  const grouped: Record<string, Set<string>> = {};
  flatPermissions.forEach((perm) => {
    const [subject, action] = perm.split(':');
    if (!grouped[subject]) grouped[subject] = new Set();
    grouped[subject].add(action);
  });
  return Object.entries(grouped).map(([subject, actions]) => ({
    subject,
    actions: Array.from(actions).join(',') // string separado por comas
    // fields: "*" // Si necesitas enviar fields, agrégalo aquí
  }));
}

function groupPermissionsWithFields(flatPermissions: string[]) {
  const grouped: Record<string, Set<string>> = {};
  flatPermissions.forEach((perm) => {
    const [subject, action] = perm.split(':');
    if (!grouped[subject]) grouped[subject] = new Set();
    grouped[subject].add(action);
  });
  // Devuelve el formato esperado por la API, incluyendo fields
  return Object.entries(grouped).map(([subject, actions]) => ({
    subject,
    actions: Array.from(actions).join(','), // string separado por comas
    fields: Object.entries(permissionFields.value)
      .filter(([key]) => key.startsWith(subject + ':'))
      .map(([, fields]) => fields)
      .filter(Boolean)[0] || undefined, // Toma el campo si existe
  }));
}

function addPermission() {
  if (newPermission.value.subject && newPermission.value.actions.length > 0) {
    permissions.value.push({
      subject: newPermission.value.subject,
      actions: [...newPermission.value.actions],
      fields: [...newPermission.value.fields],
    });
    newPermission.value = { subject: '', actions: [], fields: [] };
  }
}

function removePermission(index) {
  permissions.value.splice(index, 1);
}

const createRole = async () => {
  if (!newRoleName.value || !newRoleDescription.value) {
    alert('El nombre y la descripción del rol son obligatorios.')
    return
  }
  // Usar el array de permisos que realmente se muestra/agrega en el modal
  const perms = permissions.value
    .filter(p => p.subject && p.actions && p.actions.length > 0)
    .map(p => ({
      subject: p.subject,
      actions: Array.isArray(p.actions) ? p.actions.join(',') : p.actions,
      ...(p.fields && Array.isArray(p.fields) && p.fields.length > 0
        ? { fields: p.fields.join(',') }
        : {})
    }));
  if (perms.length === 0) {
    alert('Debes agregar al menos un permiso válido.')
    return
  }
  try {
    const payload = {
      name: newRoleName.value,
      description: newRoleDescription.value,
      permissions: perms,
    };
    await createRoleApi(payload)
    newRoleName.value = ''
    newRoleDescription.value = ''
    permissions.value = []
    // dynamicPermissions.value = [{ subject: '', actions: '', fields: '' }] // ya no es necesario
    await fetchAllRoles() // Recargar roles
    alert('Rol creado con éxito.')
  } catch (error) {
    console.error('Error creating role:', error)
    alert('Error al crear el rol.')
  }
}

const assignPermissions = async () => {
  if (!selectedRoleId.value) {
    alert('Por favor, selecciona un rol primero.')
    return
  }
  try {
    const permissions = groupPermissions(selectedPermissions.value);
    await assignPermissionsApi(selectedRoleId.value, permissions);
    selectedPermissions.value = []
    await fetchAllRoles() // Recargar roles para ver los cambios
    alert('Permisos asignados con éxito.')
  } catch (error) {
    console.error('Error assigning permissions:', error)
    alert('Error al asignar permisos')
  }
}

// Edición de roles
function startEditRole(role: RoleFromApi) {
  editingRoleId.value = role.id;
    editRoleFields.value[role.id] = {
    name: role.role,
    description: role.description,
    };
}


const saveEditRole = async (role: RoleFromApi) => {
  const fields = editRoleFields.value[role.id]
  if (!fields.name || !fields.description) {
    alert('El nombre y la descripción no pueden estar vacíos.')
    return
  }
  try {
    // Si quieres permitir editar permisos junto con nombre/desc, usa selectedPermissions
    const permissions = groupPermissions(selectedPermissions.value)
    const payload = {
      name: fields.name,
      description: fields.description,
      permissions, // [{ subject: 'RequestMedicTest', actions: 'read,update' }]
    }
    await updateRoleApi(role.id, payload)
    editingRoleId.value = null
    delete editRoleFields.value[role.id]
    await fetchAllRoles()
    alert('Rol actualizado con éxito.')
  } catch (error) {
    console.error('Error saving role:', error)
    alert('Error al actualizar rol.')
  }
}

const cancelEditRole = () => {
  editingRoleId.value = null
  editRoleFields.value = {}
}

const deleteRole = async (roleId: string) => {
  if (confirm(`¿Seguro que deseas eliminar este rol?`)) {
    try {
      await deleteRoleApi(roleId)
      await fetchAllRoles()
      if (selectedRoleId.value === roleId) {
        selectedRoleId.value = null; // Deseleccionar si el rol actual fue eliminado
      }
      alert('Rol eliminado con éxito.')
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('Error al eliminar rol.')
    }
  }
}

watch(selectedRoleId, (roleId) => {
  if (!roleId) {
    selectedPermissions.value = []
    return
  }
  const role = roles.value.find((r: RoleFromApi) => r.id === roleId)
  if (role && Array.isArray(role.permissions)) {
    // Aplanar los permisos del rol al formato 'subject:action' para los checkboxes
    selectedPermissions.value = role.permissions.flatMap((p: ApiRolePermission) =>
      p.actions.map((action: string) => `${p.subject}:${action}`)
    )
  } else {
    selectedPermissions.value = []
  }
}, { immediate: true }) // Ejecutar inmediatamente si ya hay un selectedRoleId al inicio

onMounted(async () => {
  await fetchAllPermissions()
})

const showEditRoleModal = ref(false)
const editRoleModalData = ref<{ name: string; description: string; permissions: { subject: string; actions: string; fields?: string }[] }>({
  name: '',
  description: '',
  permissions: [{ subject: '', actions: '', fields: '' }]
})
const editRoleIdForModal = ref<string | null>(null)

function openEditRoleModal(role: RoleFromApi) {
  showEditRoleModal.value = true
  editRoleIdForModal.value = role.id
  editRoleModalData.value.name = role.role
  editRoleModalData.value.description = role.description
  editRoleModalData.value.permissions = (role.permissions || []).map(p => ({
    subject: p.subject,
    actions: Array.isArray(p.actions) ? p.actions.join(',') : (p.actions ?? ''),
    fields: (p as any).fields ?? ''
  }))
}

function closeEditRoleModal() {
  showEditRoleModal.value = false
  editRoleIdForModal.value = null
  editRoleModalData.value.name = ''
  editRoleModalData.value.description = ''
  editRoleModalData.value.permissions = [{ subject: '', actions: '', fields: '' }]
}

function addEditRoleModalPermission() {
  editRoleModalData.value.permissions.push({ subject: '', actions: '', fields: '' })
}

function removeEditRoleModalPermission(idx: number) {
  editRoleModalData.value.permissions.splice(idx, 1)
}

const saveEditRoleModal = async () => {
  if (!editRoleIdForModal.value) return
  const { name, description, permissions } = editRoleModalData.value
  if (!name || !description) {
    alert('El nombre y la descripción no pueden estar vacíos.')
    return
  }
  const cleanPermissions = permissions
    .filter(p => p.subject && p.actions)
    .map(p => ({
      subject: p.subject,
      actions: Array.isArray(p.actions) ? p.actions.join(',') : p.actions,
      ...(p.fields && Array.isArray(p.fields) && p.fields.length > 0
        ? { fields: p.fields.join(',') }
        : {})
    }))
  try {
    await updateRoleApi(editRoleIdForModal.value, {
      name,
      description,
      permissions: cleanPermissions
    })
    closeEditRoleModal()
    await fetchAllRoles()
    alert('Rol actualizado con éxito.')
  } catch (error) {
    alert('Error al actualizar rol.')
  }
}

const roleColumns = [
  { key: 'role', label: 'Nombre', thClass: 'text-center text-lg', tdClass: 'text-left text-base w-[220px]' },
  { key: 'description', label: 'Descripción', thClass: 'text-center text-lg', tdClass: 'text-left text-base w-[320px]' },
  // { key: 'permissions', label: 'Permisos', ... } // Eliminado
  { key: 'actions', label: 'Acciones', thClass: 'text-center text-lg', tdClass: 'text-left text-base w-[180px]' },
]

function resetRoleForm() {
  newRoleName.value = ''
  newRoleDescription.value = ''
  permissions.value = []
}

const showNewRoleModal = ref(false)

function closeNewRoleModal() {
  showNewRoleModal.value = false
  resetRoleForm()
}

const search = ref('')

const filteredRoles = computed(() => {
  if (!search.value) return roles.value
  const term = search.value.toLowerCase()
  return roles.value.filter(role =>
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
];

const actionsOptions = [
  'create',
  'read',
  'update',
  'delete',
  'manage',
  'set_state'
];

const showRoleDetailsModal = ref(false)
const selectedRole = ref<RoleFromApi | null>(null)

function onRowClick(event: { item: RoleFromApi }) {
  // Evita abrir el modal si el click fue en los botones de acción
  // (esto ya se maneja con @click.stop en los botones)
  selectedRole.value = event.item
  showRoleDetailsModal.value = true
}

// Opcional: resalta la fila seleccionada
function getRowClass(row: RoleFromApi) {
  return selectedRole.value && selectedRole.value.id === row.id ? 'bg-gray-100' : ''
}
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
</style>