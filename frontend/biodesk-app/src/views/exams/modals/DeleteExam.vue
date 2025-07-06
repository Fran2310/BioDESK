<script setup lang="ts">
import { medicTestRequestApi } from '@/services/api';
import { CreateMedicTestRequestData } from '@/services/interfaces/medicTestRequest';
import { Priority } from '@/services/types/global.type';
import { formatCi } from '@/services/utils';
import { useToast } from 'vuestic-ui';

const props = defineProps<{ 
  examToDelete: ExamRow 
}>();

const { init: notify } = useToast();

const emit = defineEmits(['close', 'deleted'])

const closeModal = () => {
  emit('close')
}

async function confirmDeleteExam() {
  if (!props.examToDelete.id) return;
  try {
    await medicTestRequestApi.deleteMedicTestRequest(
      String(props.examToDelete.id)
    );
    emit('deleted')
    notify({ message: 'Examen eliminado correctamente.', color: 'success' });
  } catch (e: any) {
    notify({ message: e.message, color: 'danger' });
  }
}

const stateLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_PROCESS: 'En proceso',
    COMPLETED: 'Completado',
    TO_VERIFY: 'Por verificar',
    CANCELED: 'Cancelado',
  };

const priorityLabels: Record<string, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

interface ExamRow
  extends Omit<CreateMedicTestRequestData, 'resultProperties'> {
  id: number;
  requestedAt: string;
  completedAt?: string;
  state: string;
  priority: Priority;
  resultProperties: Record<string, string>;
  observation: string;
  byLabUserId: number | null;
  medicTestCatalogId: number;
  medicTestCatalog: {
    id: number;
    name: string;
    description: string;
    price: number;
    supplies: string[];
  };
  medicHistory: {
    id: number;
    patientId: number;
    patient: {
      id: number;
      ci: string;
      name: string;
      lastName: string;
      secondName: string;
      secondLastName: string;
      gender: string;
      email: string;
      phoneNums: string[];
      dir: string;
      birthDate: string;
    };
  };
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

function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

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
      <VaButton color="danger" @click="confirmDeleteExam"
        >Eliminar</VaButton
      >
    </div>
  </div>
</template>