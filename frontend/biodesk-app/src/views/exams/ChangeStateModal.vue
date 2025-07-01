<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useToast, VaModal, VaSelect, VaButton, VaProgressCircle } from 'vuestic-ui'
import { medicTestRequestApi } from '@/services/api'

import type { State } from '@/services/types/global.type'

const props = defineProps<{
  requestId?: number
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'updated'])

const isLoading = ref(false)
const error = ref<string | null>(null)
const selectedState = ref<State>()

const states = [
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'En proceso', value: 'IN_PROCESS' },
  { label: 'Completado', value: 'COMPLETED' },
  { label: 'Por verificar', value: 'TO_VERIFY' },
  { label: 'Cancelado', value: 'CANCELED' },
]

const closeModal = () => {
  emit('close')
}

const submitStateChange = async () => {
  if (!selectedState.value) {
    notify({ message: 'Debe seleccionar un estado.', color: 'warning' })
    return
  }

  if (!props.requestId) {
    error.value = 'ID de solicitud inválido.'
    notify({ message: error.value, color: 'danger' })
    return
  }

  isLoading.value = true
  error.value = null

  try {
    console.log('Estado a enviar:', selectedState.value, typeof selectedState.value)
    await medicTestRequestApi.updateMedicTestRequestState(String(props.requestId), selectedState.value)
    notify({ message: 'Estado del examen actualizado correctamente.', color: 'success' })
    emit('updated')
    closeModal()
  } catch (e: any) {
    error.value = e.message || 'Error al actualizar el estado.'
    notify({ message: error.value, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <h2 class="va-h4 mb-4">Cambiar estado del examen</h2>

  <div v-if="isLoading" class="flex justify-center py-8">
    <VaProgressCircle indeterminate />
  </div>

  <div v-else class="space-y-4">
    <VaSelect
      v-model="selectedState"
      label="Seleccione el nuevo estado"
      :options="states"
      text-by="label"
      value-by="value"
      required
    />

    <div class="flex justify-end gap-2">
      <VaButton color="secondary" @click="closeModal">Cancelar</VaButton>
      <VaButton color="primary" :loading="isLoading" @click="submitStateChange">Guardar</VaButton>
    </div>

    <div v-if="error" class="text-danger text-center">{{ error }}</div>
  </div>
</template>
