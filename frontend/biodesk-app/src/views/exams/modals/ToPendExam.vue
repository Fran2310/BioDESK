<template>
  <div>
    <h2 class="va-h4 mb-4 text-info">Confirmar pendiente</h2>
    <p class="mb-4">¿Está seguro de que desea poner este examen en pendiente?</p>
    <div v-if="props.examToPend" class="space-y-2 mb-4 text-sm">
      <div>
        <strong>Paciente:</strong>
        {{ props.examToPend.medicHistory.patient.name }}
        {{ props.examToPend.medicHistory.patient.lastName }} (CI:
        {{ formatCi(props.examToPend.medicHistory.patient.ci)}})
      </div>
      <div>
        <strong>Examen:</strong>
        {{ props.examToPend.medicTestCatalog.name }}
      </div>
      <div>
        <strong>Descripción:</strong>
        {{ props.examToPend.medicTestCatalog.description }}
      </div>
      <div class="flex items-center gap-2">
        <strong>Estado:</strong>
        <va-chip size="small" :color="stateColor(props.examToPend.state)">
          {{ stateLabels[props.examToPend.state] ?? props.examToPend.state }}
        </va-chip>
      </div>
      <div class="flex items-center gap-2">
        <strong>Prioridad:</strong>
        <va-chip
          size="small"
          :color="priorityColor(props.examToPend.priority)"
        >
          {{
            priorityLabels[props.examToPend.priority] ??
            props.examToPend.priority
          }}
        </va-chip>
      </div>
      <div>
        <strong>Fecha de solicitud:</strong>
        {{ formatDate(props.examToPend.requestedAt) }}
      </div>
      <div v-if="props.examToPend.observation">
        <strong>Observación:</strong> {{ props.examToPend.observation }}
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <VaButton color="secondary" @click="closeModal"
        >Cerrar</VaButton
      >
      <VaButton color="info" :loading="isLoading" @click="confirmToPendExam"
        >Poner en pendiente</VaButton
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
  examToPend: ExamRow 
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'pended'])

const isLoading = ref(false)

const closeModal = () => {
  emit('close')
}

async function confirmToPendExam() {
  if (!props.examToPend.id) return;
  try {
    isLoading.value = true; 
    await medicTestRequestApi.updateMedicTestRequestState(
      String(props.examToPend.id),
      'PENDING' // Se mantiene 'PENDING' para indicar que se pone en pendiente
    );
    emit('pended')
    notify({ message: 'Examen puesto en pendiente correctamente.', color: 'success' });
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' });
  } finally {
    isLoading.value = false; 
  }
}
</script>