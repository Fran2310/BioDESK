<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { medicTestRequestApi } from '@/services/api'

const exams = ref<any[]>([])
const filters = ref({ search: '' })
const pagination = ref({ page: 1, perPage: 10, total: 0 })
const isLoading = ref(false)
const error = ref<string | null>(null)

const fetchExams = async () => {
  isLoading.value = true
  error.value = null
  try {
    const query: any = {
      offset: (pagination.value.page - 1) * pagination.value.perPage,
      limit: pagination.value.perPage,
      // Add search filter if needed
      // 'search-term': filters.value.search,
    }
    const response = await medicTestRequestApi.getMedicTestRequests(query)
    const data = response.data
    exams.value = data.data
    pagination.value.total = data.total
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch exams.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchExams)

watch([
  () => pagination.value.page,
  () => pagination.value.perPage,
  // () => filters.value.search, // Uncomment if you want to fetch on search change
], fetchExams)

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.perPage))
</script>

<template>
  <div>
    <h1 class="page-title">Exams</h1>
    <VaCard>
      <VaCardContent>
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
        <VaDataTable
          :columns="[
            { label: 'Exam ID', key: 'id' },
            { label: 'Exam Name', key: 'examName' },
            { label: 'Patient Name', key: 'patientName' },
            { label: 'Requested At', key: 'requestedAt' },
            { label: 'State', key: 'state' },
            { label: 'Priority', key: 'priority' }
          ]"
          :items="exams"
          :loading="isLoading"
        />
        <div v-if="error" class="text-danger mt-2">{{ error }}</div>
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
