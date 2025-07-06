<template>
  <div>
    <h2 class="va-h4 mb-4 text-danger">Confirmar eliminación</h2>
    <p class="mb-4">¿Está seguro de que desea eliminar este examen?</p>
    <div v-if="props.examToDelete" class="space-y-2 mb-4 text-sm">
      <div>
        <strong>Paciente:</strong>
        {{ props.examToDelete.medicHistory.patient.name }}
        {{ props.examToDelete.medicHistory.patient.lastName }} (CI:
        {{ formatCi(props.examToDelete.medicHistory.patient.ci)}})
      </div>
      <div>
        <strong>Examen:</strong>
        {{ props.examToDelete.medicTestCatalog.name }}
      </div>
      <div>
        <strong>Descripción:</strong>
        {{ props.examToDelete.medicTestCatalog.description }}
      </div>
      <div class="flex items-center gap-2">
        <strong>Estado:</strong>
        <va-chip size="small" :color="stateColor(props.examToDelete.state)">
          {{ stateLabels[props.examToDelete.state] ?? props.examToDelete.state }}
        </va-chip>
      </div>
      <div class="flex items-center gap-2">
        <strong>Prioridad:</strong>
        <va-chip
          size="small"
          :color="priorityColor(props.examToDelete.priority)"
        >
          {{
            priorityLabels[props.examToDelete.priority] ??
            props.examToDelete.priority
          }}
        </va-chip>
      </div>
      <div>
        <strong>Fecha de solicitud:</strong>
        {{ formatDate(props.examToDelete.requestedAt) }}
      </div>
      <div v-if="props.examToDelete.observation">
        <strong>Observación:</strong> {{ props.examToDelete.observation }}
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <VaButton color="secondary" @click="closeModal"
        >Cancelar</VaButton
      >
      <VaButton color="danger" :loading="isLoading" @click="confirmDeleteExam"
        >Eliminar</VaButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { medicTestRequestApi } from '@/services/api';
import { ExamRow, priorityColor, priorityLabels, stateColor, stateLabels } from '@/services/interfaces/exam-row';
import { formatCi, formatDate } from '@/services/utils';
import { ref } from 'vue';
import { useToast } from 'vuestic-ui';

const props = defineProps<{ 
  examToDelete: ExamRow 
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'deleted'])

const isLoading = ref(false)

const closeModal = () => {
  emit('close')
}

async function confirmDeleteExam() {
  if (!props.examToDelete.id) return;
  try {
    isLoading.value = true; 
    await medicTestRequestApi.deleteMedicTestRequest(
      String(props.examToDelete.id)
    );
    emit('deleted')
    notify({ message: 'Examen eliminado correctamente.', color: 'success' });
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' });
  } finally {
    isLoading.value = false; 
  }
}
</script>