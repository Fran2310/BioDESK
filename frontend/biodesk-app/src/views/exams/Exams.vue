<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast, VaModal, VaSelect, VaButton, VaProgressCircle } from 'vuestic-ui'

import { medicTestRequestApi } from '@/services/api'
import type { CreateMedicTestRequestData } from '@/services/interfaces/medicTestRequest'
import { Priority } from '@/services/types/global.type'

import ChangeStateModal from './ChangeStateModal.vue'

// Toast
const { init: notify } = useToast();

// Router
const router = useRouter()

// Props
const props = defineProps<{ medicHistoryId?: string }>()

// Types
interface ExamRow extends Omit<CreateMedicTestRequestData, 'resultProperties'> {
  id: number;
  requestedAt: string;
  completedAt?: string;
  state: string;
  priority: Priority;
  resultProperties: Record<string, string>;
  observation: string;
  byLabUserId: number;
  medicTestCatalogId: number;
  ci?: string;
  name?: string;
  lastName?: string;
}

// States
const exams = ref<ExamRow[]>([])
const filters = ref({ search: '' })
const pagination = ref({ page: 1, perPage: 10, total: 0 })
const isLoading = ref(false)
const error = ref<string | null>(null)

const showModal = ref(false)
const selectedExam = ref<ExamRow | null>(null)

const showStateModal = ref(false)
const selectedExamId = ref<number | null>(null)

const showDeleteModal = ref(false)
const examToDelete = ref<ExamRow | null>(null)

// Labels
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

// Helpers
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

// Fetch
const fetchExams = async () => {
  isLoading.value = true
  try {
    const query = {
      offset: (pagination.value.page - 1) * pagination.value.perPage,
      limit: pagination.value.perPage,
      includeData: true
    }
    const { data } = await medicTestRequestApi.getMedicTestRequests(query)
    exams.value = data.data
    await mergePatientInfoIntoExams()
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
    const id = filters.value.search.trim()
    const query = {
      offset: (pagination.value.page - 1) * pagination.value.perPage,
      limit: pagination.value.perPage,
      includeData: true
    }
    const { data } = id
      ? await medicTestRequestApi.getMedicTestRequestsByMedicHistoryId(id, query)
      : await medicTestRequestApi.getMedicTestRequests(query)

    exams.value = data.data
    await mergePatientInfoIntoExams()
    pagination.value.total = data.total
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (props.medicHistoryId) {
    filters.value.search = props.medicHistoryId
    searchExams()
  } else {
    fetchExams()
  }
})

watch(() => [pagination.value.page, pagination.value.perPage], () => {
  const maxPage = Math.ceil(pagination.value.total / pagination.value.perPage) || 1
  if (pagination.value.page > maxPage) pagination.value.page = 1
  filters.value.search.trim() ? searchExams() : fetchExams()
})

// Actions
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

async function mergePatientInfoIntoExams() {
  const uniqueIds = [...new Set(exams.value.map(e => e.medicHistoryId))]
  const patientInfoMap: Record<number, { ci: string, name: string, lastName: string }> = {}

  for (const id of uniqueIds) {
    try {
      const { data } = await (await import('@/services/api')).patientApi.getPatientById(String(id))
      patientInfoMap[id] = { ci: data.ci, name: data.name, lastName: data.lastName }
    } catch {
      patientInfoMap[id] = { ci: '-', name: '-', lastName: '-' }
    }
  }

  exams.value.forEach(e => {
    const info = patientInfoMap[e.medicHistoryId]
    e.ci = info?.ci ?? '-'
    e.name = info?.name ?? '-'
    e.lastName = info?.lastName ?? '-'
  })
}

const refreshExams = async () => {
  await fetchExams()
}

function handleStateUpdated() {
  refreshExams()
  showStateModal.value = false
}

// 🔹 Abrir modal de confirmación
function onDeleteExam(exam: ExamRow) {
  examToDelete.value = exam
  showDeleteModal.value = true
}

// 🔹 Confirmar eliminación
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

// Pagination
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.perPage))
</script>


<template>
  <div>
    <VaCard>
      <VaCardContent>
        <!-- Search -->
        <div class="flex flex-col md:flex-row gap-2 mb-2 justify-between">
          <div class="flex flex-col md:flex-row gap-2 justify-start items-center">
            <VaInput v-model="filters.search" placeholder="Search by medicHistoryId">
              <template #prependInner>
                <VaIcon name="search" color="secondary" size="small" />
              </template>
            </VaInput>
            <VaButton color="primary" icon="search" class="ml-2" @click="searchExams">
              Search
            </VaButton>
          </div>
        </div>

        <!-- Table -->
        <div class="relative">
          <VaDataTable
            :columns="[
              { label: 'CI', key: 'ci' },
              { label: 'Name', key: 'name' },
              { label: 'Last Name', key: 'lastName' },
              { label: 'Requested At', key: 'requestedAt' },
              { label: 'State', key: 'state' },
              { label: 'Priority', key: 'priority' },
              { label: 'Actions', key: 'actions', align: 'right' }
            ]"
            :items="exams"
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
                {{  priorityLabels[rowData.priority]  ?? rowData.priority }}
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
                  aria-label="Edit exam"
                  @click.stop="goToEditExam(rowData.id)"
                />
                <VaButton
                  preset="primary"
                  size="small"
                  icon="va-delete"
                  color="danger"
                  aria-label="Delete exam"
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
              <div><strong>CI:</strong> <span>{{ selectedExam.ci }}</span></div>
              <div><strong>Nombre:</strong> <span>{{ selectedExam.name }}</span></div>
              <div><strong>Apellido:</strong> <span>{{ selectedExam.lastName }}</span></div>
              <div><strong>Fecha de Solicitud:</strong> <span>{{ formatDate(selectedExam.requestedAt) }}</span></div>
              <div><strong>Estado:</strong> <va-chip size="small" :color="stateColor(selectedExam.state)">
                {{ stateLabels[selectedExam.state] ?? selectedExam.state }}
              </va-chip></div>
              <div><strong>Prioridad:</strong> <va-chip size="small" :color="priorityColor(selectedExam.priority)">
                {{  priorityLabels[selectedExam.priority]  ?? selectedExam.priority }}
              </va-chip></div>
            </div>

            <h4 class="mt-4 mb-2">Propiedades del Resultado</h4>
            <div class="mb-4">
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

            <h4 class="mt-4 mb-2">Observación</h4>
            <div class="p-3 bg-gray-100 rounded border border-gray-200">
              <span>{{ selectedExam.observation || 'No se proporcionó observación.' }}</span>
            </div>
          </div>
          <div v-else>
            No exam selected or invalid data.
          </div>
        </VaModal>

        
        <!-- Change State Modal mounted globally -->
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
            <p class="mb-4">
              ¿Está seguro de que desea eliminar este examen?
            </p>

            <div v-if="examToDelete" class="space-y-2 mb-4 text-sm">
              <div>
                <strong>Paciente:</strong>
                {{ examToDelete.name }} {{ examToDelete.lastName }} (CI: {{ examToDelete.ci }})
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
                <strong>Fecha de solicitud:</strong>
                {{ formatDate(examToDelete.requestedAt) }}
              </div>
              <div v-if="examToDelete.observation">
                <strong>Observación:</strong>
                {{ examToDelete.observation }}
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
              <VaButton color="secondary" @click="showDeleteModal = false">Cancelar</VaButton>
              <VaButton color="danger" @click="confirmDeleteExam">Eliminar</VaButton>
            </div>
          </div>
        </VaModal>


        <!-- Error message
        <div v-if="error" class="text-danger mt-2 text-center">{{ error }}</div>
        -->
        <!-- Pagination -->
        <div class="flex flex-col-reverse md:flex-row gap-2 justify-between items-center py-2">
          <div>
            <b>{{ pagination.total }} results.</b>
            Results per page
            <VaSelect v-model="pagination.perPage" class="!w-20" :options="[5, 10, 20, 50]" />
          </div>
          <div v-if="totalPages > 1" class="flex">
            <VaButton
              preset="secondary"
              icon="va-arrow-left"
              aria-label="Previous page"
              :disabled="pagination.page === 1"
              @click="pagination.page--"
            />
            <VaButton
              class="mr-2"
              preset="secondary"
              icon="va-arrow-right"
              aria-label="Next page"
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