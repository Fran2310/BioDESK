<template>
  <div>
    <h2 class="va-h4 mb-4 text-success">Confirmar completar examen</h2>
    <p class="mb-4">¿Está seguro de que desea completar este examen?</p>

    <div v-if="props.examToComplete" class="space-y-2 mb-4 text-sm">
      <div>
        <strong>Paciente:</strong>
        {{ props.examToComplete.medicHistory.patient.name }}
        {{ props.examToComplete.medicHistory.patient.lastName }} (CI:
        {{ formatCi(props.examToComplete.medicHistory.patient.ci) }})
      </div>
      <div>
        <strong>Examen:</strong>
        {{ props.examToComplete.medicTestCatalog.name }}
      </div>
      <div>
        <strong>Descripción:</strong>
        {{ props.examToComplete.medicTestCatalog.description }}
      </div>
      <div class="flex items-center gap-2">
        <strong>Estado:</strong>
        <va-chip size="small" :color="stateColor(props.examToComplete.state)">
          {{
            stateLabels[props.examToComplete.state] ?? props.examToComplete.state
          }}
        </va-chip>
      </div>
      <div class="flex items-center gap-2">
        <strong>Prioridad:</strong>
        <va-chip
          size="small"
          :color="priorityColor(props.examToComplete.priority)"
        >
          {{
            priorityLabels[props.examToComplete.priority] ??
            props.examToComplete.priority
          }}
        </va-chip>
      </div>
      <div>
        <strong>Fecha de solicitud:</strong>
        {{ formatDate(props.examToComplete.requestedAt) }}
      </div>
      <div v-if="props.examToComplete.observation">
        <strong>Observación:</strong> {{ props.examToComplete.observation }}
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <VaButton
        color="secondary"
        :disabled="isLoading"
        @click="closeModal"
      >
        Cancelar
      </VaButton>
      <VaButton
        color="success"
        :loading="isLoading"
        :disabled="isLoading"
        @click="confirmCompleteExam"
      >
        Completar
      </VaButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { medicTestRequestApi } from '@/services/api';
import { ExamRow, formatDate, priorityColor, priorityLabels, stateColor, stateLabels } from '@/services/interfaces/exam-row';
import { formatCi } from '@/services/utils';
import { ref } from 'vue';
import { useToast } from 'vuestic-ui';

const props = defineProps<{ 
  examToComplete: ExamRow 
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'completed'])

const isLoading = ref(false)

const closeModal = () => {
  emit('close')
}

async function confirmCompleteExam() {
  if (!props.examToComplete.id) return;
  try {
    isLoading.value = true;
    await medicTestRequestApi.updateMedicTestRequestState(
      String(props.examToComplete.id),
      'COMPLETED'
    );
    emit('completed')
    notify({ message: 'Examen completado correctamente.', color: 'success' });
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' });
  } finally {
    isLoading.value = false;
  }
}
</script>
