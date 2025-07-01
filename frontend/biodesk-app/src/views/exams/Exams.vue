<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vuestic-ui'

import { medicTestRequestApi } from '@/services/api'
import type { CreateMedicTestRequestData } from '@/services/interfaces/medicTestRequest'
import { Priority } from '@/services/types/global.type'

import ChangeStateModal from './ChangeStateModal.vue'

import type { GetExtendQuerys } from '@/services/interfaces/global'
import type { SearchField } from '@/services/types/searchFields.type'

const { init: notify } = useToast()
const router = useRouter()

const props = defineProps<{ medicHistoryId?: string }>()

interface ExamRow extends Omit<CreateMedicTestRequestData, 'resultProperties'> {
  id: number;
  requestedAt: string;
  completedAt?: string;
  state: string;
  priority: Priority;
  resultProperties: Record<string, string>;
  observation: string;
  byLabUserId: number | null;
  medicTestCatalogId: number;
  medicTestCatalog: {
    id: number;
    name: string;
    description: string;
    price: number;
    supplies: string[];
  };
  medicHistory: {
    id: number;
    patientId: number;
    patient: {
      id: number;
      ci: string;
      name: string;
      lastName: string;
      secondName: string;
      secondLastName: string;
      gender: string;
      email: string;
      phoneNums: string[];
      dir: string;
      birthDate: string;
    }
  };
}

const exams = ref<ExamRow[]>([])
const filters = ref({
  state: '',
  priority: '',
})
const pagination = ref({ page: 1, perPage: 10, total: 0 })
const isLoading = ref(false)

const showModal = ref(false)
const selectedExam = ref<ExamRow | null>(null)

const showStateModal = ref(false)
const selectedExamId = ref<number | null>(null)

const showDeleteModal = ref(false)
const examToDelete = ref<ExamRow | null>(null)

const stateLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROCESS: 'En proceso',
  COMPLETED: 'Completado',
  TO_VERIFY: 'Por verificar',
  CANCELED: 'Cancelado',
}

const priorityLabels: Record<string, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
}

function priorityColor(priority: string) {
  switch (priority?.toUpperCase()) {
    case 'HIGH': return 'danger'
    case 'MEDIUM': return 'warning'
    case 'LOW': return 'success'
    default: return 'info'
  }
}

function stateColor(state: string) {
  switch (state?.toUpperCase()) {
    case 'PENDING': return 'warning'
    case 'TO_VERIFY': return 'info'
    case 'COMPLETED': return 'success'
    default: return 'info'
  }
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchExams = async () => {
  isLoading.value = true
  try {
    const query = {
      offset: (pagination.value.page - 1) * pagination.value.perPage,
      limit: pagination.value.perPage,
      includeData: true
    }
    const { data } = await medicTestRequestApi.getMedicTestRequests(query)
    exams.value = data.data.map((e: ExamRow) => ({
      ...e,
      ci: e.medicHistory?.patient?.ci ?? '-',
      name: e.medicHistory?.patient?.name ?? '-',
      lastName: e.medicHistory?.patient?.lastName ?? '-',
    }))
    pagination.value.total = data.total
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

const searchExams = async () => {
  isLoading.value = true
  try {
    const query: GetExtendQuerys = {
      offset: (pagination.value.page - 1) * pagination.value.perPage,
      limit: pagination.value.perPage,
      includeData: true,
    }

    const fields: SearchField[] = []
    const terms: string[] = []

    if (filters.value.state) {
      fields.push('state')
      terms.push(filters.value.state)
    }

    if (filters.value.priority) {
      fields.push('priority')
      terms.push(filters.value.priority)
    }

    if (fields.length > 0) {
      query['search-fields'] = fields
      query['search-term'] = terms.join(',')
    }

    const { data } = await medicTestRequestApi.getMedicTestRequests(query)

    exams.value = data.data.map((e: ExamRow) => ({
      ...e,
      ci: e.medicHistory?.patient?.ci ?? '-',
      name: e.medicHistory?.patient?.name ?? '-',
      lastName: e.medicHistory?.patient?.lastName ?? '-',
    }))
    pagination.value.total = data.total
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}


onMounted(() => {
  if (props.medicHistoryId) {
    searchExams()
  } else {
    fetchExams()
  }
})

watch(() => [pagination.value.page, pagination.value.perPage], () => {
  const maxPage = Math.ceil(pagination.value.total / pagination.value.perPage) || 1
  if (pagination.value.page > maxPage) pagination.value.page = 1
})

function goToEditExam(id: number) {
  router.push({ name: 'EditExam', params: { id } })
}

function openChangeStateModal(examId: number) {
  selectedExamId.value = examId
  showStateModal.value = true
}

function handleRowClick(event: any) {
  if (event?.item) {
    selectedExam.value = { ...event.item }
    showModal.value = true
  }
}

const refreshExams = async () => {
  await fetchExams()
}

function handleStateUpdated() {
  refreshExams()
  showStateModal.value = false
}

function onDeleteExam(exam: ExamRow) {
  examToDelete.value = exam
  showDeleteModal.value = true
}

async function confirmDeleteExam() {
  if (!examToDelete.value) return

  try {
    await medicTestRequestApi.deleteMedicTestRequest(String(examToDelete.value.id))
    notify({ message: 'Examen eliminado correctamente.', color: 'success' })
    refreshExams()
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' })
  } finally {
    showDeleteModal.value = false
    examToDelete.value = null
  }
}

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.perPage))


const states = [
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'En proceso', value: 'IN_PROCESS' },
  { label: 'Completado', value: 'COMPLETED' },
  { label: 'Por verificar', value: 'TO_VERIFY' },
  { label: 'Cancelado', value: 'CANCELED' },
]

const priorities = [
  { label: 'Alta', value: 'HIGH' },
  { label: 'Media', value: 'MEDIUM' },
  { label: 'Baja', value: 'LOW' },
]

</script>

<template>
  <div>
    <VaCard>
      <VaCardContent>
        <!-- Search -->
        <div class="flex flex-col md:flex-row gap-2 mb-2 justify-between">
          <div class="flex flex-col md:flex-row gap-2 justify-start items-center">

            <VaSelect
              v-model="filters.state"
              placeholder="Filtrar por estado"
              :options="states"
              text-by="label"
      value-by="value"
              clearable
              class="w-[200px]"
            />

            <VaSelect
              v-model="filters.priority"
              placeholder="Filtrar por prioridad"
              :options="priorities"
              text-by="label"
              value-by="value"
              clearable
              class="w-[200px]"
            />

            <VaButton color="primary" icon="search" class="ml-2" @click="searchExams">
              Buscar
            </VaButton>
          </div>
        </div>

        <!-- Table -->
        <div class="relative">
          <VaDataTable
            :columns="[
              { label: 'CI', key: 'ci' },
              { label: 'Nombre', key: 'name' },
              { label: 'Apellido', key: 'lastName' },
              { label: 'Examen', key: 'examName' },
              { label: 'Solicitado', key: 'requestedAt' },
              { label: 'Estado', key: 'state' },
              { label: 'Prioridad', key: 'priority' },
              { label: 'Acciones', key: 'actions', align: 'right' }
            ]"
            :items="exams.map(e => ({ ...e, examName: e.medicTestCatalog.name }))"
            :loading="isLoading"
            @row:click="handleRowClick"
          >
            <template #cell(requestedAt)="{ rowData }">
              {{ formatDate(rowData.requestedAt) }}
            </template>
            <template #cell(state)="{ rowData }">
              <va-chip size="small" :color="stateColor(rowData.state)">
                {{ stateLabels[rowData.state] ?? rowData.state }}
              </va-chip>
            </template>
            <template #cell(priority)="{ rowData }">
              <va-chip size="small" :color="priorityColor(rowData.priority)">
                {{ priorityLabels[rowData.priority] ?? rowData.priority }}
              </va-chip>
            </template>
            <template #cell(actions)="{ rowData }">
              <div class="flex gap-2 justify-end">
                <VaButton
                  preset="secondary"
                  size="small"
                  icon="swap_horiz"
                  aria-label="Cambiar estado"
                  @click.stop="openChangeStateModal(rowData.id)"
                />
                <VaButton
                  preset="primary"
                  size="small"
                  icon="edit"
                  aria-label="Editar examen"
                  @click.stop="goToEditExam(rowData.id)"
                />
                <VaButton
                  preset="primary"
                  size="small"
                  icon="va-delete"
                  color="danger"
                  aria-label="Eliminar examen"
                  @click.stop="onDeleteExam(rowData)"
                />
              </div>
            </template>
          </VaDataTable>

          <!-- Loading overlay -->
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <VaProgressCircle indeterminate size="large" color="primary" />
          </div>
        </div>

        <!-- Exam Details Modal -->
        <VaModal v-model="showModal" hide-default-actions>
          <h2 class="va-h3 text-primary mb-4 text-left">Detalles del examen</h2>
          <div v-if="selectedExam">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><strong>Fecha de solicitud:</strong> {{ formatDate(selectedExam.requestedAt) }}</div>
              <div><strong>CI:</strong> {{ selectedExam.medicHistory.patient.ci }}</div>
              <div><strong>Nombre:</strong> {{ selectedExam.medicHistory.patient.name }}</div>
              <div><strong>Apellido:</strong> {{ selectedExam.medicHistory.patient.lastName }}</div>
              <div><strong>Examen:</strong> {{ selectedExam.medicTestCatalog.name }}</div>
              <div><strong>Descripción:</strong> {{ selectedExam.medicTestCatalog.description }}</div>
              <div class="flex items-center gap-2">
                <strong>Estado:</strong>
                <va-chip size="small" :color="stateColor(selectedExam.state)">
                  {{ stateLabels[selectedExam.state] ?? selectedExam.state }}
                </va-chip>
              </div>
              <div class="flex items-center gap-2">
                <strong>Prioridad:</strong>
                <va-chip size="small" :color="priorityColor(selectedExam.priority)">
                  {{ priorityLabels[selectedExam.priority] ?? selectedExam.priority }}
                </va-chip>
              </div>
            </div>

            <h4 class="mt-4 mb-2"><strong>Observación:</strong></h4>
            <div class="p-3 bg-gray-100 rounded border border-gray-200">
              {{ selectedExam.observation || 'No se proporcionó observación.' }}
            </div>

            <h4 class="mt-4 mb-2"><strong>Resultados:</strong></h4>
            <div class="overflow-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th class="border-b pb-1">Propiedad</th>
                    <th class="border-b pb-1">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(value, key) in selectedExam.resultProperties" :key="key">
                    <td class="pr-4 font-semibold">{{ key }}</td>
                    <td>{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else>
            No se ha seleccionado un examen válido.
          </div>
        </VaModal>

        <!-- Change State Modal -->
        <VaModal v-model="showStateModal" hide-default-actions>
          <ChangeStateModal
            :request-id="selectedExamId"
            @close="showStateModal = false"
            @updated="handleStateUpdated"
          />
        </VaModal>

        <!-- Delete Confirmation Modal -->
        <VaModal v-model="showDeleteModal" hide-default-actions>
          <div>
            <h2 class="va-h4 mb-4 text-danger">Confirmar eliminación</h2>
            <p class="mb-4">¿Está seguro de que desea eliminar este examen?</p>

            <div v-if="examToDelete" class="space-y-2 mb-4 text-sm">
              <div>
                <strong>Paciente:</strong> {{ examToDelete.medicHistory.patient.name }} {{ examToDelete.medicHistory.patient.lastName }}
                (CI: {{ examToDelete.medicHistory.patient.ci }})
              </div>
              <div>
                <strong>Examen:</strong> {{ examToDelete.medicTestCatalog.name }}
              </div>
              <div>
                <strong>Descripción:</strong> {{ examToDelete.medicTestCatalog.description }}
              </div>
              <div class="flex items-center gap-2">
                <strong>Estado:</strong>
                <va-chip size="small" :color="stateColor(examToDelete.state)">
                  {{ stateLabels[examToDelete.state] ?? examToDelete.state }}
                </va-chip>
              </div>
              <div class="flex items-center gap-2">
                <strong>Prioridad:</strong>
                <va-chip size="small" :color="priorityColor(examToDelete.priority)">
                  {{ priorityLabels[examToDelete.priority] ?? examToDelete.priority }}
                </va-chip>
              </div>
              <div>
                <strong>Fecha de solicitud:</strong> {{ formatDate(examToDelete.requestedAt) }}
              </div>
              <div v-if="examToDelete.observation">
                <strong>Observación:</strong> {{ examToDelete.observation }}
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
              <VaButton color="secondary" @click="showDeleteModal = false">Cancelar</VaButton>
              <VaButton color="danger" @click="confirmDeleteExam">Eliminar</VaButton>
            </div>
          </div>
        </VaModal>

        <!-- Pagination -->
        <div class="flex flex-col-reverse md:flex-row gap-2 justify-between items-center py-2">
          <div>
            <b>{{ pagination.total }} resultados.</b>
            Resultados por página
            <VaSelect v-model="pagination.perPage" class="!w-20" :options="[5, 10, 20, 50]" />
          </div>
          <div v-if="totalPages > 1" class="flex items-center gap-2">
            <VaButton
              preset="secondary"
              icon="va-arrow-left"
              aria-label="Anterior"
              :disabled="pagination.page === 1"
              @click="pagination.page--"
            />
            <VaButton
              preset="secondary"
              icon="va-arrow-right"
              aria-label="Siguiente"
              :disabled="pagination.page === totalPages"
              @click="pagination.page++"
            />
            <VaPagination
              v-model="pagination.page"
              buttons-preset="secondary"
              :pages="totalPages"
              :visible-pages="5"
              :boundary-links="false"
              :direction-links="false"
            />
          </div>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>
