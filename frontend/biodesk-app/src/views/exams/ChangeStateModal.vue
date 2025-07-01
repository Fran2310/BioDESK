<script setup lang="ts">
import { ref } from 'vue'
import { useToast, VaSelect, VaButton, VaProgressCircle } from 'vuestic-ui'
import { medicTestRequestApi } from '@/services/api'

import type { State, Priority } from '@/services/types/global.type'

const props = defineProps<{
  requestId?: number
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'updated'])

const isLoading = ref(false)
const error = ref<string | null>(null)
const selectedState = ref<State>()
const selectedPriority = ref<Priority>()

const states = [
  { label: 'Cancelado', value: 'CANCELED' },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'En proceso', value: 'IN_PROCESS' },
  { label: 'Por verificar', value: 'TO_VERIFY' },
  { label: 'Completado', value: 'COMPLETED' },
]

const priorities = [
    { label: 'Alta', value: 'HIGH' },
    { label: 'Media', value: 'MEDIUM' },
    { label: 'Baja', value: 'LOW' },
  ];

const closeModal = () => {
  emit('close')
}

const submitStateChange = async () => {
  if (!selectedState.value && !selectedPriority.value) {
    notify({ message: 'Debe seleccionar al menos un campo para actualizar.', color: 'warning' })
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
    if (selectedState.value) {
      console.log('Actualizando estado:', selectedState.value)
      await medicTestRequestApi.updateMedicTestRequestState(String(props.requestId), selectedState.value)
    }

    if (selectedPriority.value) {
      console.log('Actualizando prioridad:', selectedPriority.value)
      await medicTestRequestApi.updateMedicTestRequest(String(props.requestId), {
        priority: selectedPriority.value
      })
    }

    notify({ message: 'Actualización realizada correctamente.', color: 'success' })
    emit('updated')
    closeModal()
  } catch (e: any) {
    error.value = e.message || 'Error al actualizar el examen.'
    notify({ message: error.value, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

function priorityColor(priority: string) {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'info';
    }
  }

  function stateColor(state: string) {
    switch (state?.toUpperCase()) {
      case 'PENDING':
        return 'warning';
      case 'TO_VERIFY':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELED':
        return 'danger';
      default:
        return 'info';
    }
  }

</script>

<template>
  <div class="space-y-6">
    <h2 class="va-h4 mb-2">Actualizar estado o prioridad del examen</h2>

    <!-- Selects -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <VaSelect
        v-model="selectedState"
        label="Nuevo estado"
        :options="states"
        text-by="label"
        value-by="value"
        class="w-full"
      />
      <VaSelect
        v-model="selectedPriority"
        label="Nueva prioridad"
        :options="priorities"
        text-by="label"
        value-by="value"
        class="w-full"
      />
    </div>

    <!-- Tabla de referencia -->
    <div class="mt-4">
      <h4 class="mb-2 font-semibold">Referencia de valores</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Estados -->
        <div>
          <p class="mb-1 font-medium">Estados posibles:</p>
          <table class="w-full text-sm border border-gray-200 rounded overflow-hidden">
            <thead>
              <tr class="bg-gray-100">
                <th class="text-left px-2 py-1">Código</th>
                <th class="text-left px-2 py-1">Etiqueta</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="state in states" :key="state.value">
                <td class="px-2 py-1 font-mono">{{ state.value }}</td>
                <td class="px-2 py-1">
                  <va-chip size="small" :color="stateColor(state.value)">
                    {{ state.label }}
                  </va-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Prioridades -->
        <div>
          <p class="mb-1 font-medium">Prioridades posibles:</p>
          <table class="w-full text-sm border border-gray-200 rounded overflow-hidden">
            <thead>
              <tr class="bg-gray-100">
                <th class="text-left px-2 py-1">Código</th>
                <th class="text-left px-2 py-1">Etiqueta</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="priority in priorities" :key="priority.value">
                <td class="px-2 py-1 font-mono">{{ priority.value }}</td>
                <td class="px-2 py-1">
                  <va-chip size="small" :color="priorityColor(priority.value)">
                    {{ priority.label }}
                  </va-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Botones -->
    <div class="flex justify-end gap-2">
      <VaButton color="secondary" @click="closeModal">Cancelar</VaButton>
      <VaButton color="primary" :loading="isLoading" @click="submitStateChange">Guardar</VaButton>
    </div>

    <div v-if="error" class="text-danger text-center">{{ error }}</div>
  </div>
</template>
