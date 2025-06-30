<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// Accept medicHistoryId as a prop from the router
const props = defineProps<{ medicHistoryId?: string }>()
import { medicTestRequestApi } from '@/services/api'
import type { CreateMedicTestRequestData } from '@/services/interfaces/medicTestRequest'

// Types
interface ExamRow extends Omit<CreateMedicTestRequestData, 'resultProperties'> {
  id: number;
  requestedAt: string;
  completedAt?: string;
  state: string;
  priority: string;
  resultProperties: Record<string, string>;
  observation: string;
  byLabUserId: number;
  medicTestCatalogId: number;
  ci?: string;
  name?: string;
  lastName?: string;
}

const exams = ref<ExamRow[]>([])
const filters = ref({ search: '' })
const pagination = ref({ page: 1, perPage: 10, total: 0 })
const isLoading = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const selectedExam = ref<ExamRow | null>(null)



// Fetch all exams (default)
const fetchExams = async () => {
  isLoading.value = true
  error.value = null
  try {
    const query = {
      offset: (pagination.value.page - 1) * pagination.value.perPage,
      limit: pagination.value.perPage,
      includeData: true
    }
    const response = await medicTestRequestApi.getMedicTestRequests(query)
    const data = response.data
    exams.value = data.data
    await mergePatientInfoIntoExams()
    pagination.value.total = data.total
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch exams.'
  } finally {
    isLoading.value = false
  }
}

// Fetch exams by medicHistoryId (search)
const searchExams = async () => {
  isLoading.value = true
  error.value = null
  try {
    const id = filters.value.search.trim()
    if (!id) {
      await fetchExams()
      return
    }
    const query = {
      offset: (pagination.value.page - 1) * pagination.value.perPage,
      limit: pagination.value.perPage,
      includeData: true
    }
    const response = await medicTestRequestApi.getMedicTestRequestsByMedicHistoryId(id, query)
    const data = response.data
    exams.value = data.data
    await mergePatientInfoIntoExams()
    pagination.value.total = data.total
  } catch (e: any) {
    error.value = e.message || 'Failed to search exams.'
  } finally {
    isLoading.value = false
  }
}

// If medicHistoryId is passed as a prop, use it to fill the search bar and trigger search
onMounted(() => {
  if (props.medicHistoryId) {
    filters.value.search = props.medicHistoryId
    searchExams()
  } else {
    fetchExams()
  }
})

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.perPage))

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
    case 'PENDING': return 'danger'; // red
    case 'TO_VERIFY': return 'warning'; // yellow
    case 'COMPLETED': return 'success'; // green
    default: return 'info';
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

// Merge patient info into each exam row
async function mergePatientInfoIntoExams() {
  const uniqueHistoryIds = [...new Set(exams.value.map((exam) => exam.medicHistoryId))]
  const patientInfoMap: Record<number, {ci: string, name: string, lastName: string}> = {}
  for (const id of uniqueHistoryIds) {
    try {
      const apiModule = await import('@/services/api')
      const response = await apiModule.patientApi.getPatientById(id)
      const { ci, name, lastName } = response.data
      patientInfoMap[id] = { ci, name, lastName }
    } catch (e) {
      patientInfoMap[id] = { ci: '-', name: '-', lastName: '-' }
    }
  }
  exams.value.forEach((exam) => {
    const info = patientInfoMap[exam.medicHistoryId]
    exam.ci = info?.ci || '-'
    exam.name = info?.name || '-'
    exam.lastName = info?.lastName || '-'
  })
}

function onEditExam(exam: ExamRow) {
  console.log('[Exams] Edit button clicked. Exam passed to handler:', exam)
  // Simulate edit logic here if needed
  // For demonstration, log the current state of selectedExam before and after
  console.log('[Exams] selectedExam BEFORE edit:', selectedExam.value)
  selectedExam.value = exam
  console.log('[Exams] selectedExam AFTER edit:', selectedExam.value)
}
function onDeleteExam(exam: ExamRow) {
  console.log('[Exams] Delete button clicked. Exam passed to handler:', exam)
  // Simulate delete logic here if needed
  // For demonstration, log the current state of exams before and after
  console.log('[Exams] exams BEFORE delete:', exams.value)
  // Example: exams.value = exams.value.filter(e => e.id !== exam.id)
  // console.log('[Exams] exams AFTER delete:', exams.value)
}

function handleRowClick(event: any) {
  console.log('[Exams] Row click event received:', event)
  if (event && event.item) {
    console.log('[Exams] Row clicked BEFORE assignment:', event.item)
    selectedExam.value = { ...event.item }
    showModal.value = true
    console.log('[Exams] selectedExam AFTER assignment:', selectedExam.value)
    console.log('[Exams] showModal AFTER assignment:', showModal.value)
  } else {
    console.error('Invalid row click event:', event)
  }
}

watch(
  () => [pagination.value.page, pagination.value.perPage],
  () => {
    // Always reset to page 1 if perPage changes and current page is out of range
    const maxPage = Math.ceil(pagination.value.total / pagination.value.perPage) || 1
    if (pagination.value.page > maxPage) {
      pagination.value.page = 1
    }
    if (filters.value.search.trim()) {
      searchExams()
    } else {
      fetchExams()
    }
  }
)
</script>

<template>
  <div>
    <h1 class="page-title">Exams</h1>
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
                {{ rowData.state }}
              </va-chip>
            </template>
            <template #cell(priority)="{ rowData }">
              <va-chip size="small" :color="priorityColor(rowData.priority)">
                {{ rowData.priority }}
              </va-chip>
            </template>
            <template #cell(actions)="{ rowData }">
              <div class="flex gap-2 justify-end">
                <VaButton
                  preset="primary"
                  size="small"
                  icon="edit"
                  aria-label="Edit exam"
                  @click.stop="onEditExam(rowData)"
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

        <!-- Modal -->
        <VaModal v-model="showModal" title="Exam Results" hide-default-actions>
          <div v-if="selectedExam">
            <h4>Result Properties:</h4>
            <ul class="mb-4">
              <li v-for="(value, key) in selectedExam.resultProperties" :key="key" class="mb-1">
                <b>{{ key }}:</b> {{ value }}
              </li>
            </ul>

            <h4>Observation:</h4>
            <p>{{ selectedExam.observation || 'No observation provided.' }}</p>
          </div>
          <div v-else>
            No exam selected or invalid data.
          </div>
        </VaModal>

        <!-- Error message -->
        <div v-if="error" class="text-danger mt-2">{{ error }}</div>

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