<template>
  <div>
    <h2 class="va-h4 mb-4 text-danger">Confirmar cancelación</h2>
    <p class="mb-4">¿Está seguro de que desea cancelar este examen?</p>
    <div v-if="props.examToCancel" class="space-y-2 mb-4 text-sm">
      <div>
        <strong>Paciente:</strong>
        {{ props.examToCancel.medicHistory.patient.name }}
        {{ props.examToCancel.medicHistory.patient.lastName }} (CI:
        {{ formatCi(props.examToCancel.medicHistory.patient.ci)}})
      </div>
      <div>
        <strong>Examen:</strong>
        {{ props.examToCancel.medicTestCatalog.name }}
      </div>
      <div>
        <strong>Descripción:</strong>
        {{ props.examToCancel.medicTestCatalog.description }}
      </div>
      <div class="flex items-center gap-2">
        <strong>Estado:</strong>
        <va-chip size="small" :color="stateColor(props.examToCancel.state)">
          {{ stateLabels[props.examToCancel.state] ?? props.examToCancel.state }}
        </va-chip>
      </div>
      <div class="flex items-center gap-2">
        <strong>Prioridad:</strong>
        <va-chip
          size="small"
          :color="priorityColor(props.examToCancel.priority)"
        >
          {{
            priorityLabels[props.examToCancel.priority] ??
            props.examToCancel.priority
          }}
        </va-chip>
      </div>
      <div>
        <strong>Fecha de solicitud:</strong>
        {{ formatDate(props.examToCancel.requestedAt) }}
      </div>
      <div v-if="props.examToCancel.observation">
        <strong>Observación:</strong> {{ props.examToCancel.observation }}
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <VaButton color="secondary" @click="closeModal"
        >Cerrar</VaButton
      >
      <VaButton color="danger" :loading="isLoading" @click="confirmCancelExam"
        >Cancelar examen</VaButton
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
  examToCancel: ExamRow 
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'canceled'])

const isLoading = ref(false)

const closeModal = () => {
  emit('close')
}

async function confirmCancelExam() {
  if (!props.examToCancel.id) return;
  try {
    isLoading.value = true; 
    await medicTestRequestApi.updateMedicTestRequestState( // Cambiado a cancelMedicTestRequest
      String(props.examToCancel.id),
      'CANCELED'
    );
    emit('canceled') // Cambiado a 'canceled'
    notify({ message: 'Examen cancelado correctamente.', color: 'success' }); // Mensaje de éxito
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' });
  } finally {
    isLoading.value = false; 
  }
}
</script>