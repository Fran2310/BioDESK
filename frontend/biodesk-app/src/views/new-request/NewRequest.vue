<script setup lang="ts">
import { ref } from 'vue'
import { medicTestRequestApi } from '@/services/api'
import { useToast } from 'vuestic-ui'

const form = ref({
  priority: '',
  medicHistoryId: null,
  medicTestCatalogId: null,
  observation: '',
  resultProperties: {
    glucose: '',
    hemoglobin: '',
    notes: ''
  }
})

const isLoading = ref(false)
const error = ref<string | null>(null)
const { push: pushToast } = useToast()

const submitForm = async () => {
  isLoading.value = true
  error.value = null
  try {
    // Prepare payload (remove empty resultProperties fields)
    const payload = {
      ...form.value,
      resultProperties: Object.fromEntries(
        Object.entries(form.value.resultProperties).filter(([_, v]) => v !== '')
      )
    }
    await medicTestRequestApi.createMedicTestRequest(payload)
    pushToast({ message: 'Request submitted successfully!', color: 'success' })
    // Optionally reset form
    form.value = {
      priority: '',
      medicHistoryId: null,
      medicTestCatalogId: null,
      observation: '',
      resultProperties: { glucose: '', hemoglobin: '', notes: '' }
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to submit request.'
    pushToast({ message: error.value, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="p-4 md:p-6">
    <h1 class="page-title text-center mb-6">New Medic Test Request</h1>

    <VaCard class="max-w-3xl mx-auto shadow-md">
      <VaCardContent>
        <!-- Form Container -->
        <div class="space-y-6">

          <!-- First Row: Priority, Medic History ID, Medic Test Catalog ID -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VaInput label="Priority" v-model="form.priority" placeholder="e.g. MEDIUM">
              <template #prependInner>
                <VaIcon name="priority_high" />
              </template>
            </VaInput>

            <VaInput label="Medic History ID" type="number" v-model.number="form.medicHistoryId">
              <template #prependInner>
                <VaIcon name="assignment" />
              </template>
            </VaInput>

            <VaInput label="Medic Test Catalog ID" type="number" v-model.number="form.medicTestCatalogId">
              <template #prependInner>
                <VaIcon name="science" />
              </template>
            </VaInput>
          </div>

          <!-- Notes -->
          <VaTextarea
              label="Notes"
              v-model="form.resultProperties.notes"
              auto-grow
              :rows="3"
              counter
              max-length="500"
            />
          </div>

          <!-- Result Properties Section -->
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium mb-4">Result Properties</h3>

            <!-- Glucose & Hemoglobin in Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <VaInput label="Glucose" v-model="form.resultProperties.glucose" placeholder="e.g. 90 mg/dL">
                <template #prependInner>
                  <VaIcon name="bloodtype" />
                </template>
              </VaInput>

              <VaInput label="Hemoglobin" v-model="form.resultProperties.hemoglobin" placeholder="e.g. 12.3 g/dL">
                <template #prependInner>
                  <VaIcon name="bloodtype" />
                </template>
              </VaInput>
            </div>

            <!-- Observation -->
             <div>
            <VaTextarea
              label="Observation"
              v-model="form.observation"
              auto-grow
              :rows="3"
              counter
              max-length="500"
            />
          </div>
            
          <!-- Submit Button -->
          <div class="flex justify-end mt-6">
            <VaButton color="primary" :loading="isLoading" @click="submitForm" class="ml-2">
              Submit Request
            </VaButton>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="text-danger text-center">{{ error }}</div>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>