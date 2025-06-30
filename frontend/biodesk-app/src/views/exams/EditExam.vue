<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vuestic-ui'
import { medicTestRequestApi } from '@/services/api'
import { validator } from '@/services/utils'
import type { PatchMedicTestRequestData } from '@/services/interfaces/medicTestRequest'

const route = useRoute()
const router = useRouter()
const { init: notify } = useToast()

const id = Number(route.params.id)

const request = ref<PatchMedicTestRequestData | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const form = ref({
  priority: '',
  observation: '',
  resultProperties: {
    glucose: '',
    hemoglobin: '',
    notes: ''
  }
})

const states = [
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'En progreso', value: 'IN_PROGRESS' },
  { label: 'Completado', value: 'COMPLETED' },
  { label: 'Por verificar', value: 'TO_VERIFY' },
  { label: 'Cancelado', value: 'CANCELED' },
]

const priorities = [
  { label: 'Alta', value: 'HIGH' },
  { label: 'Media', value: 'MEDIUM' },
  { label: 'Baja', value: 'LOW' }
];

const fetchRequest = async () => {
  try {
    const res = await medicTestRequestApi.getMedicTestRequestById(String(id))
    request.value = res.data
    form.value.priority = request.value.priority
    form.value.observation = request.value.observation || ''
    form.value.resultProperties = {
      glucose: request.value.resultProperties?.glucose || '',
      hemoglobin: request.value.resultProperties?.hemoglobin || '',
      notes: request.value.resultProperties?.notes || ''
    }
  } catch (e: any) {
    error.value = e.message || 'Error al cargar el examen.'
    notify({ message: error.value, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRequest()
})

const submitForm = async () => {
  isLoading.value = true
  error.value = null
  try {
    const payload = {
      priority: form.value.priority,
      observation: form.value.observation,
      resultProperties: Object.fromEntries(
        Object.entries(form.value.resultProperties).filter(([_, v]) => v !== '')
      )
    }

    await medicTestRequestApi.updateMedicTestRequest(String(id), payload)

    notify({ message: 'Examen actualizado correctamente.', color: 'success' })

    router.push('/lab/request-medic-test') // ajusta según tu router
  } catch (e: any) {
    error.value = e.message || 'Error al actualizar el examen.'
    notify({ message: error.value, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-3xl mx-auto">
    <h1 class="text-center text-2xl font-semibold mb-4">Editar Examen</h1>

    <VaCard>
      <VaCardContent>
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <VaProgressCircle indeterminate />
        </div>

        <div v-else>
          <div class="space-y-6">

            <!-- Estado -->
            <VaSelect
              v-model="form.priority"
              label="Estado del examen"
              :options="priorities"
              value-by="value"
              text-by="label"
              :rules="[validator.required]"
            />

            <!-- Result Properties POR TRABAJAR -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VaInput label="Glucosa" v-model="form.resultProperties.glucose" />
              <VaInput label="Hemoglobina" v-model="form.resultProperties.hemoglobin" />
            </div>

            <!-- Observación -->
            <VaTextarea
              label="Observaciones"
              v-model="form.observation"
              auto-grow
              :rows="3"
              max-length="500"
            />

            <div class="flex justify-end gap-2 mt-4">
              <VaButton color="secondary" @click="router.back()">Cancelar</VaButton>
              <VaButton color="primary" :loading="isLoading" @click="submitForm">
                Guardar cambios
              </VaButton>
            </div>

            <div v-if="error" class="text-danger text-center mt-2">{{ error }}</div>
          </div>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>
