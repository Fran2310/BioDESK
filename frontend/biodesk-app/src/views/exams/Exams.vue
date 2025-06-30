<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { medicTestRequestApi, patientApi } from '@/services/api'
import { defineProps } from 'vue'

// Accept patientId as an optional prop
const props = defineProps<{ patientId?: number }>()

// Reactive state
const exams = ref<any[]>([])
const filters = ref({ search: '' })
const pagination = ref({ page: 1, perPage: 10, total: 0 })
const isLoading = ref(false)
const error = ref<string | null>(null)

const patientInfo = ref<{ ci: string; name: string; lastName: string } | null>(null)
const showModal = ref(false)
const selectedExam = ref<any | null>(null)

// Fetch patient info
const fetchPatientInfo = async () => {
  if (!props.patientId) return
  try {
    const response = await patientApi.getPatientById(props.patientId)
    const { ci, name, lastName } = response.data
    patientInfo.value = { ci, name, lastName }
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch patient info.'
  }
}

// Fetch exams
const fetchExams = async () => {
  isLoading.value = true
  error.value = null
  try {
    const query: any = {
      offset: (pagination.value.page - 1) * pagination.value.perPage,
      limit: pagination.value.perPage,
      includeData: true
    }
    if (props.patientId) {
      query.medicHistoryId = props.patientId
    }

    const response = await medicTestRequestApi.getMedicTestRequests(query)
    const data = response.data

    exams.value = data.data

    // Map: medicHistoryId -> patient info
    const uniqueHistoryIds = [...new Set(exams.value.map((exam: any) => exam.medicHistoryId))]
    const patientInfoMap: Record<number, {ci: string, name: string, lastName: string}> = {}
    for (const id of uniqueHistoryIds) {
      try {
        const response = await patientApi.getPatientById(id)
        const { ci, name, lastName } = response.data
        patientInfoMap[id] = { ci, name, lastName }
      } catch (e) {
        // Optionally handle error per patient
        patientInfoMap[id] = { ci: '-', name: '-', lastName: '-' }
      }
    }
    exams.value.forEach((exam: any) => {
      const info = patientInfoMap[exam.medicHistoryId]
      exam.ci = info?.ci || '-'
      exam.name = info?.name || '-'
      exam.lastName = info?.lastName || '-'
    })

    pagination.value.total = data.total
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch exams.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  await fetchPatientInfo()
  await fetchExams()
  isLoading.value = false
})

watch([() => pagination.value.page, () => pagination.value.perPage], fetchExams)

// Pagination
const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.perPage))

// Priority color mapping
function priorityColor(priority: string) {
  switch (priority?.toUpperCase()) {
    case 'HIGH': return 'danger'
    case 'MEDIUM': return 'warning'
    case 'LOW': return 'success'
    default: return 'info'
  }
}

// Format date helper
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
// Edit and delete handlers
function onEditExam(exam: any) {
  // TODO: Implement edit logic/modal
  console.log('Edit exam:', exam)
}
function onDeleteExam(exam: any) {
  // TODO: Implement delete logic/confirmation
  console.log('Delete exam:', exam)
}
</script>

<template>
  <div>
    <h1 class="page-title">Exams</h1>
    <VaCard>
      <VaCardContent>
        <!-- Search -->
        <div class="flex flex-col md:flex-row gap-2 mb-2 justify-between">
          <div class="flex flex-col md:flex-row gap-2 justify-start items-center">
            <VaInput v-model="filters.search" placeholder="Search exams">
              <template #prependInner>
                <VaIcon name="search" color="secondary" size="small" />
              </template>
            </VaInput>
            <VaButton color="primary" icon="search" class="ml-2" @click="fetchExams">
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
            @row:click="event => {
              if (event && event.item) {
                selectedExam = event.item
                showModal = true
              } else {
                console.error('Invalid row click event:', event)
              }
            }"
          >
            <template #cell(requestedAt)="{ rowData }">
              {{ formatDate(rowData.requestedAt) }}
            </template>
            <template #cell(state)="{ rowData }">
              <va-chip size="small" :color="rowData.state === 'COMPLETED' ? 'success' : 'danger'">
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