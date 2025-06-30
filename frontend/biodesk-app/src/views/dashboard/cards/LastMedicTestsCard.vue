<template>
  <div class="p-2">
    <h2 class="text-xl font-semibold mb-4 text-center">
      Solicitudes de Exámenes
    </h2>

    <transition name="fade" mode="out-in">
      <!-- 🔄 CARGA INICIAL -->
      <div
        v-if="loading && offset === 0"
        key="loading"
        class="grid grid-cols-3 md:grid-cols-1 gap-4 sm:gap-6"
      >
        <div
          class="w-full bg-gray-200 rounded-lg animate-pulse"
          :style="{ height: `${LOG_HEIGHT}px` }"
        ></div>
        <div
          class="w-full bg-gray-200 rounded-lg animate-pulse"
          :style="{ height: `${LOG_HEIGHT}px` }"
        ></div>
        <div
          class="w-full bg-gray-200 rounded-lg animate-pulse"
          :style="{ height: `${LOG_HEIGHT}px` }"
        ></div>
      </div>

      <div v-else>
        <div
          :style="{ maxHeight: `${MAX_SCROLLER_HEIGHT}px`, overflowY: 'auto' }"
        >
          <VaInfiniteScroll
            :load="fetchRequests"
            :has-more="requests.length < total"
            :height="MAX_SCROLLER_HEIGHT"
            class="space-y-2"
          >
            <!-- 🧾 LISTA DE SOLICITUDES -->
            <div
              v-for="request in requests"
              :key="request.id"
              class="flex items-start gap-3 bg-white rounded shadow-sm p-3 hover:bg-gray-50 transition"
            >
              <VaIcon
                :name="iconForState(request.state)"
                size="20px"
                :color="colorForState(request.state)"
                class="mt-1 shrink-0"
              />

              <div class="flex-1">
                <p class="text-sm text-gray-700">
                  <span
                    :class="colorClassForState(request.state)"
                    class="font-semibold capitalize"
                  >
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
                  <span v-if="request.completedAt"
                    >| Completado: {{ relativeTime(request.completedAt) }}</span
                  >
                </p>
              </div>

              <va-popover
                placement="left-start"
                trigger="hover"
                class="popover-fix"
              >
                <template #body>
                  <div class="p-2">
                    <div>
                      <strong>Solicitado:</strong>
                      {{ formatDate(request.requestedAt) }}
                    </div>
                    <div v-if="request.completedAt">
                      <strong>Completado:</strong>
                      {{ formatDate(request.completedAt) }}
                    </div>
                  </div>
                </template>
                <va-icon
                  name="info"
                  color="secondary"
                  class="hover:text-primary cursor-pointer"
                  size="small"
                />
              </va-popover>
            </div>

            <!-- 🔄 CARGA EN SCROLL -->
            <div
              v-if="loadingMore"
              class="grid grid-cols-3 md:grid-cols-1 gap-4 sm:gap-6"
            >
              <div
                v-for="n in 2"
                :key="n"
                class="w-full bg-gray-200 rounded-lg animate-pulse"
                :style="{ height: `${LOG_HEIGHT}px` }"
              ></div>
            </div>
          </VaInfiniteScroll>
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

  import { medicTestRequestApi } from '@/services/api';
  import { useLabStore } from '@/stores/labStore';
  import type { LabData } from '@/services/interfaces/lab';
  import type { GetExtendQuerys } from '@/services/interfaces/global';

  dayjs.extend(relativeTimePlugin);
  dayjs.locale('es');

  // 🔢 Altura de ítems y scroll
  const LOG_HEIGHT = 75;
  const MAX_VISIBLE_LOGS = 5;
  const MAX_SCROLLER_HEIGHT = LOG_HEIGHT * MAX_VISIBLE_LOGS;

  // 📦 Estado principal
  const requests = ref<any[]>([]);
  const offset = ref(0);
  const limit = 10;
  const total = ref(0);

  const loading = ref(false);
  const loadingMore = ref(false);

  // ⏱️ Formatos de fecha
  function relativeTime(dateString: string) {
    return dayjs(dateString).fromNow();
  }

  function formatDate(dateString: string) {
    return dayjs(dateString).format('DD MMM YYYY HH:mm');
  }

  // 🏷️ Etiquetas según estado
  function stateLabel(state: string) {
    switch (state) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PROCESS':
        return 'En Proceso';
      case 'TO_VERIFY':
        return 'Por Verificar';
      case 'CANCELED':
        return 'Cancelado';
      case 'COMPLETED':
        return 'Completado';
      default:
        return state;
    }
  }

  function iconForState(state: string) {
    switch (state) {
      case 'COMPLETED':
        return 'check_circle';
      case 'PENDING':
        return 'schedule';
      case 'IN_PROCESS':
        return 'hourglass_empty';
      case 'TO_VERIFY':
        return 'task_alt';
      case 'CANCELED':
        return 'cancel';
      default:
        return 'info';
    }
  }

  function colorForState(state: string) {
    switch (state) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'IN_PROCESS':
        return 'info';
      case 'TO_VERIFY':
        return 'primary';
      case 'CANCELED':
        return 'danger';
      default:
        return 'primary';
    }
  }

  function colorClassForState(state: string) {
    switch (state) {
      case 'COMPLETED':
        return 'text-green-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'IN_PROCESS':
        return 'text-blue-500';
      case 'TO_VERIFY':
        return 'text-indigo-600';
      case 'CANCELED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  function badgeClassForPriority(priority: string) {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'LOW':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  // 📥 Cargar solicitudes paginadas
  async function fetchRequests() {
    const lab: LabData = {
      id: 29,
      name: 'Laboratorium',
      status: 'active',
      rif: 'j853946049',
      logoPath: null,
    };
    useLabStore().setCurrentLab(lab);

    const queries: GetExtendQuerys = {
      offset: offset.value,
      limit,
      includeData: true,
    };

    if (offset.value === 0) loading.value = true;
    else loadingMore.value = true;

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
      loadingMore.value = false;
    }
  }

  onMounted(() => {
    fetchRequests();
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
