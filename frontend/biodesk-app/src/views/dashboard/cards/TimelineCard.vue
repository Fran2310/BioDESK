<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4 text-center">Logs del Sistema</h2>

    <transition name="fade" mode="out-in">
    <div v-if="loading" key="loading" class="grid grid-cols-3 md:grid-cols-1 gap-4 sm:gap-6">
      <div class="w-full bg-gray-200 rounded-lg animate-pulse" style="height: 75px;"></div>
      <div class="w-full bg-gray-200 rounded-lg animate-pulse" style="height: 75px;"></div>
      <div class="w-full bg-gray-200 rounded-lg animate-pulse" style="height: 75px;"></div>
    </div>

    <div v-else>
      <div class="space-y-2">
        <div
          v-for="log in logs"
          :key="log.id"
          class="flex items-start gap-3 bg-white rounded shadow-sm p-3 hover:bg-gray-50 transition"
        >
          <!-- Icon -->
          <VaIcon
            :name="iconForAction(log.action)"
            size="20px"
            :color="colorForAction(log.action)"
            class="mt-1 shrink-0"
          />

          <!-- Content -->
          <div class="flex-1">
            <p class="text-sm text-gray-700">
              <span
                :class="colorClassForAction(log.action)"
                class="font-semibold capitalize"
              >
                {{ actionLabel(log.action) }}
              </span>
              en
              <span class="font-medium">{{ log.entity }}</span>
            </p>
            <p class="text-xs text-gray-500">{{ log.details }}</p>
          </div>

          <!-- Date -->
          <div class="text-xs text-gray-400 text-right whitespace-nowrap shrink-0">
            {{ relativeTime(log.madeAt) }}
            <div class="text-gray-500">
              {{ log.performedBy?.name ?? 'Sistema' }} {{ log.performedBy?.lastName ?? '' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
  </div>
</template>


<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { auditApi } from '@/services/api';
import { useLabStore } from '@/stores/labStore';
import type { LabData } from '@/services/interfaces/lab';
import type { GetExtendQuerys } from '@/services/interfaces/global';

dayjs.extend(relativeTimePlugin);
dayjs.locale('es');

const logs = ref([]);
const loading = ref(false);
const offset = ref(0);
const limit = 10;
const total = ref(0);

function relativeTime(dateString: string) {
  return dayjs(dateString).fromNow();
}

function actionLabel(action: string) {
  switch (action) {
    case 'create': return 'Creación';
    case 'update': return 'Actualización';
    case 'delete': return 'Eliminación';
    case 'set_state': return 'Cambio de estado';
    default: return action;
  }
}

function iconForAction(action: string) {
  if (action === 'create') return 'add';
  if (action === 'update') return 'edit';
  if (action === 'delete') return 'delete';
  if (action === 'set_state') return 'sync_alt';
  return 'info';
}

function colorForAction(action: string) {
  if (action === 'create') return 'success';
  if (action === 'update') return 'info';
  if (action === 'delete') return 'danger';
  if (action === 'set_state') return 'primary';
  return 'secondary';
}

function colorClassForAction(action: string) {
  if (action === 'create') return 'text-green-600';
  if (action === 'update') return 'text-blue-600';
  if (action === 'delete') return 'text-red-600';
  if (action === 'set_state') return 'text-indigo-600';
  return 'text-gray-600';
}

async function fetchLogs() {
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
    const res = await auditApi.getAuditLogs(queries);
    const { data, total: totalCount } = res.data;
    logs.value.push(...data);
    total.value = totalCount;
    offset.value += limit;
  } catch (error) {
    console.error('Error al cargar auditoría:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchLogs();
});
</script>


<style scoped>
/* Transición de fade para cambiar suavemente entre los estados de carga, vacío y contenido */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
