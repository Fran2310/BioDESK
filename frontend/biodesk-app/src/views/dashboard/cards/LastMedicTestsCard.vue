<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4 text-center">Solicitudes de Exámenes</h2>

    <div v-if="loading" class="text-center py-8">
      <span>Cargando solicitudes...</span>
    </div>

    <div v-else>
      <div class="space-y-2">
        <div
          v-for="request in requests"
          :key="request.id"
          class="flex items-start gap-3 bg-white rounded shadow-sm p-3 hover:bg-gray-50 transition"
        >
          <!-- Icono de estado -->
          <VaIcon
            :name="iconForState(request.state)"
            size="20px"
            :color="colorForState(request.state)"
            class="mt-1 shrink-0"
          />

          <!-- Contenido -->
          <div class="flex-1">
            <p class="text-sm text-gray-700">
              <span :class="colorClassForState(request.state)" class="font-semibold capitalize">
                {{ stateLabel(request.state) }}
              </span>
              solicitud de examen
              <span class="font-medium">#{{ request.id }}</span>
              <span
                :class="badgeClassForPriority(request.priority)"
                class="ml-2 text-xs px-2 py-0.5 rounded"
              >
                {{ request.priority }}
              </span>
            </p>
            <p class="text-xs text-gray-500">
              Solicitado: {{ relativeTime(request.requestedAt) }}
              <span v-if="request.completedAt"> | Completado: {{ relativeTime(request.completedAt) }}</span>
            </p>
          </div>

          <!-- Fechas exactas -->
          <div class="text-xs text-gray-400 text-right whitespace-nowrap shrink-0">
            <div>{{ formatDate(request.requestedAt) }}</div>
            <div v-if="request.completedAt">{{ formatDate(request.completedAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { medicTestRequestApi } from '@/services/api';
import { useLabStore } from '@/stores/labStore';
import type { LabData } from '@/services/interfaces/lab';
import type { GetExtendQuerys } from '@/services/interfaces/global';

dayjs.extend(relativeTimePlugin);
dayjs.locale('es');

const requests = ref([]);
const loading = ref(false);
const offset = ref(0);
const limit = 10;
const total = ref(0);

function relativeTime(dateString: string) {
  return dayjs(dateString).fromNow();
}

function formatDate(dateString: string) {
  return dayjs(dateString).format('DD MMM YYYY HH:mm');
}

function stateLabel(state: string) {
  switch (state) {
    case 'PENDING': return 'Pendiente';
    case 'IN_PROCESS': return 'En Proceso';
    case 'TO_VERIFY': return 'Por Verificar';
    case 'CANCELED': return 'Cancelado';
    case 'COMPLETED': return 'Completado';
    default: return state;
  }
}

function iconForState(state: string) {
  switch (state) {
    case 'COMPLETED': return 'check_circle';
    case 'PENDING': return 'schedule';
    case 'IN_PROCESS': return 'hourglass_empty';
    case 'TO_VERIFY': return 'task_alt';
    case 'CANCELED': return 'cancel';
    default: return 'info';
  }
}

function colorForState(state: string) {
  switch (state) {
    case 'COMPLETED': return 'success';
    case 'PENDING': return 'warning';
    case 'IN_PROCESS': return 'info';
    case 'TO_VERIFY': return 'primary';
    case 'CANCELED': return 'danger';
    default: return 'primary';
  }
}

function colorClassForState(state: string) {
  switch (state) {
    case 'COMPLETED': return 'text-green-600';
    case 'PENDING': return 'text-yellow-600';
    case 'IN_PROCESS': return 'text-blue-500';
    case 'TO_VERIFY': return 'text-indigo-600';
    case 'CANCELED': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

function badgeClassForPriority(priority: string) {
  switch (priority) {
    case 'HIGH': return 'bg-red-100 text-red-700';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
    case 'LOW': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

async function fetchRequests() {
  const labData: LabData = {
    id: 29,
    name: "Laboratorium",
    status: "active",
    rif: "j853946049",
    logoPath: null,
  };
  const lab = useLabStore();
  lab.setCurrentLab(labData);

  const queries: GetExtendQuerys = {
    offset: offset.value,
    limit: limit,
    includeData: true
  };

  loading.value = true;
  try {
    const res = await medicTestRequestApi.getMedicTestRequests(queries);
    const { data, total: totalCount } = res.data;
    requests.value.push(...data);
    total.value = totalCount;
    offset.value += limit;
  } catch (error) {
    console.error('Error al cargar solicitudes de exámenes:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchRequests();
});
</script>


<style scoped>
/* Puedes agregar líneas verticales de timeline si deseas visualmente */
</style>
