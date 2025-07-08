<template>
<h2 class="va-h3 text-primary mb-4 text-left">Detalles del examen</h2>
  <div v-if="props.selectedExam">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <strong>Fecha de solicitud:</strong>
        {{ formatDate(props.selectedExam.requestedAt) }}
      </div>
      <div>
        <strong>CI:</strong> {{ formatCi(props.selectedExam.medicHistory.patient.ci) }}
      </div>
      <div>
        <strong>Nombre:</strong>
        {{ props.selectedExam.medicHistory.patient.name }}
      </div>
      <div>
        <strong>Apellido:</strong>
        {{ props.selectedExam.medicHistory.patient.lastName }}
      </div>
      <div>
        <strong>Examen:</strong>
        {{ props.selectedExam.medicTestCatalog.name }}
      </div>
      <div>
        <strong>Descripción:</strong>
        {{ props.selectedExam.medicTestCatalog.description }}
      </div>
      <div class="flex items-center gap-2">
        <strong>Estado:</strong>
        <va-chip size="small" :color="stateColor(props.selectedExam.state)">
          {{ stateLabels[props.selectedExam.state] ?? props.selectedExam.state }}
        </va-chip>
      </div>
      <div class="flex items-center gap-2">
        <strong>Prioridad:</strong>
        <va-chip
          size="small"
          :color="priorityColor(props.selectedExam.priority)"
        >
          {{
            priorityLabels[props.selectedExam.priority] ??
            props.selectedExam.priority
          }}
        </va-chip>
      </div>
    </div>

    <h4 class="mt-4 mb-2"><strong>Observación:</strong></h4>
    <div class="p-3 bg-gray-100 rounded border border-gray-200">
      {{ props.selectedExam.observation || 'No se proporcionó observación.' }}
    </div>

    <h4 class="mt-4 mb-2"><strong>Resultados:</strong></h4>
    <div class="overflow-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr>
            <th class="border-b pb-1">Propiedad</th>
            <th class="border-b pb-1">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(value, key) in props.selectedExam.resultProperties"
            :key="key"
          >
            <td class="pr-4 font-semibold">{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else>No se ha seleccionado un examen válido.</div>
</template>

<script setup lang="ts">
import { ExamRow, priorityColor, priorityLabels, stateColor, stateLabels } from '@/services/interfaces/exam-row';
import { formatCi, formatDate } from '@/services/utils';

const props = defineProps<{ 
  selectedExam: ExamRow 
}>();

</script>