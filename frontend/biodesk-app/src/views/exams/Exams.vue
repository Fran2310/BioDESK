<script setup lang="ts">
import { ref } from 'vue'

// Dummy data for visual purposes
const exams = ref([
  { id: 1, examName: 'Blood Test', patientName: 'John Doe', date: '2024-06-01', status: 'Completed' },
  { id: 2, examName: 'X-Ray', patientName: 'Jane Smith', date: '2024-06-02', status: 'Pending' },
])

const filters = ref({ search: '' })
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
            <VaButton color="primary" icon="search" class="ml-2">
              Search
            </VaButton>
          </div>
        </div>
        <VaDataTable
          :columns="[
            { label: 'Exam Name', key: 'examName' },
            { label: 'Patient Name', key: 'patientName' },
            { label: 'Date', key: 'date' },
            { label: 'Status', key: 'status' }
          ]"
          :items="exams"
        />
      </VaCardContent>
    </VaCard>
  </div>
</template>
