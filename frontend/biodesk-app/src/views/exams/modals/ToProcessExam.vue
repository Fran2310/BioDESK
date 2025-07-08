<template>
  <div>
    <h2 class="va-h4 mb-4 text-info">Confirmar empezar examen</h2>
    <p class="mb-4">¿Está seguro de que desea poner este examen en proceso?</p>
    <div v-if="props.examToProcess" class="space-y-2 mb-4 text-sm">
      <div>
        <strong>Paciente:</strong>
        {{ props.examToProcess.medicHistory.patient.name }}
        {{ props.examToProcess.medicHistory.patient.lastName }} (CI:
        {{ formatCi(props.examToProcess.medicHistory.patient.ci)}})
      </div>
      <div>
        <strong>Examen:</strong>
        {{ props.examToProcess.medicTestCatalog.name }}
      </div>
      <div>
        <strong>Descripción:</strong>
        {{ props.examToProcess.medicTestCatalog.description }}
      </div>
      <div class="flex items-center gap-2">
        <strong>Estado:</strong>
        <va-chip size="small" :color="stateColor(props.examToProcess.state)">
          {{ stateLabels[props.examToProcess.state] ?? props.examToProcess.state }}
        </va-chip>
      </div>
      <div class="flex items-center gap-2">
        <strong>Prioridad:</strong>
        <va-chip
          size="small"
          :color="priorityColor(props.examToProcess.priority)"
        >
          {{
            priorityLabels[props.examToProcess.priority] ??
            props.examToProcess.priority
          }}
        </va-chip>
      </div>
      <div>
        <strong>Fecha de solicitud:</strong>
        {{ formatDate(props.examToProcess.requestedAt) }}
      </div>
      <div v-if="props.examToProcess.observation">
        <strong>Observación:</strong> {{ props.examToProcess.observation }}
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <VaButton color="secondary" @click="closeModal"
        >Cerrar</VaButton
      >
      <VaButton color="info" :loading="isLoading" @click="confirmToProcessExam"
        >Empezar examen</VaButton
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
  examToProcess: ExamRow 
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'processed'])

const isLoading = ref(false)

const closeModal = () => {
  emit('close')
}

async function confirmToProcessExam() {
  if (!props.examToProcess.id) return;
  try {
    isLoading.value = true; 
    await medicTestRequestApi.updateMedicTestRequestState( // Cambiado a cancelMedicTestRequest
      String(props.examToProcess.id),
      'IN_PROCESS'
    );
    emit('processed')
    notify({ message: 'Examen puesto en proceso correctamente.', color: 'success' }); // Mensaje de éxito
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' });
  } finally {
    isLoading.value = false; 
  }
}
</script>