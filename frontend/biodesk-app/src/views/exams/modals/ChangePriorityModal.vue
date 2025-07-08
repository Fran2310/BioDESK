<template>
  <div class="space-y-6">
    <h2 class="va-h4 mb-2">Actualizar estado o prioridad del examen</h2>

    <!-- Selects -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast, VaSelect, VaButton } from 'vuestic-ui'
import { medicTestRequestApi } from '@/services/api'

import type { Priority } from '@/services/types/global.type'
import { priorityColor, priorityLabels } from '@/services/interfaces/exam-row';

const props = defineProps<{
  changePriorityRequestId?: number
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'updated'])

const isLoading = ref(false)
const selectedPriority = ref<Priority>()

const closeModal = () => {
  emit('close')
}

// Transforma priorityLabels en un array de objetos para VaSelect
const priorities = computed(() => {
  return Object.keys(priorityLabels).map(key => ({
    value: key, // El valor que se guardará en v-model
    label: priorityLabels[key] // El texto que se mostrará en el select
  }));
});

const submitStateChange = async () => {
  if (!selectedPriority.value) {
    notify({ message: 'Debe seleccionar al menos un campo para actualizar.', color: 'warning' })
    return
  }

  if (!props.changePriorityRequestId) {
    notify({ message: 'Petición médica no válida', color: 'danger' })
  }

  isLoading.value = true

  try {
    if (selectedPriority.value) {
      console.log('Actualizando prioridad:', selectedPriority.value)
      await medicTestRequestApi.updateMedicTestRequest(String(props.changePriorityRequestId), {
        priority: selectedPriority.value
      })
    }

    notify({ message: 'Actualización realizada correctamente.', color: 'success' })
    emit('updated')
    closeModal()
  } catch (e: any) {
    notify({ message: 'Error al actualizar el examen', color: 'danger' })
  } finally {
    isLoading.value = false
  }
}
</script>
