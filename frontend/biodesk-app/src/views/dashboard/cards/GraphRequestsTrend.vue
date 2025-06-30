<template>
  <div class="bg-white rounded shadow p-4 h-[500px] flex flex-col">
    <h3 class="text-lg font-semibold mb-2">Tendencia de solicitudes</h3>

    <div v-if="loading" class="text-center py-8 flex-1 flex items-center justify-center">
      <span>Cargando gráfica...</span>
    </div>

    <div v-else ref="chartContainer" class="flex-1" />
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted, onBeforeUnmount } from 'vue';
import { createChart, LineSeries } from 'lightweight-charts';
import dayjs from 'dayjs';

import { medicTestRequestApi } from '@/services/api';
import { useLabStore } from '@/stores/labStore';
import type { LabData } from '@/services/interfaces/lab';
import type { GetExtendQuerys } from '@/services/interfaces/global';

type ViewType = 'all' | 'month' | 'week';

const selectedView = ref<ViewType>('all');
const loading = ref(false);

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: ReturnType<typeof createChart> | null = null;
let lineSeries: any;


const mockResponse = {
  total: 40,
  offset: 0,
  limit: 50,
  data: [
    // Junio
    { id: 40, requestedAt: "2025-06-29T10:20:00Z", completedAt: null, state: "PENDING", priority: "HIGH", byLabUserId: 1, medicHistoryId: 1, medicTestCatalogId: 2 },
    { id: 39, requestedAt: "2025-06-28T14:15:00Z", completedAt: null, state: "IN_PROCESS", priority: "LOW", byLabUserId: 1, medicHistoryId: 2, medicTestCatalogId: 3 },
    { id: 38, requestedAt: "2025-06-28T09:45:00Z", completedAt: null, state: "TO_VERIFY", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 3, medicTestCatalogId: 1 },
    { id: 37, requestedAt: "2025-06-27T08:30:00Z", completedAt: "2025-06-28T11:00:00Z", state: "COMPLETED", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 4, medicTestCatalogId: 4 },
    { id: 36, requestedAt: "2025-06-27T07:00:00Z", completedAt: null, state: "PENDING", priority: "HIGH", byLabUserId: 1, medicHistoryId: 5, medicTestCatalogId: 5 },
    { id: 35, requestedAt: "2025-06-26T13:00:00Z", completedAt: null, state: "IN_PROCESS", priority: "LOW", byLabUserId: 1, medicHistoryId: 6, medicTestCatalogId: 1 },
    { id: 34, requestedAt: "2025-06-26T11:00:00Z", completedAt: "2025-06-27T10:00:00Z", state: "COMPLETED", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 7, medicTestCatalogId: 2 },
    { id: 33, requestedAt: "2025-06-25T08:00:00Z", completedAt: null, state: "TO_VERIFY", priority: "HIGH", byLabUserId: 1, medicHistoryId: 8, medicTestCatalogId: 3 },
    { id: 32, requestedAt: "2025-06-25T09:15:00Z", completedAt: null, state: "PENDING", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 9, medicTestCatalogId: 4 },
    { id: 31, requestedAt: "2025-06-24T07:45:00Z", completedAt: "2025-06-25T08:30:00Z", state: "COMPLETED", priority: "LOW", byLabUserId: 1, medicHistoryId: 10, medicTestCatalogId: 5 },
    { id: 30, requestedAt: "2025-06-23T16:00:00Z", completedAt: null, state: "IN_PROCESS", priority: "HIGH", byLabUserId: 1, medicHistoryId: 11, medicTestCatalogId: 1 },
    { id: 29, requestedAt: "2025-06-23T14:00:00Z", completedAt: null, state: "PENDING", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 12, medicTestCatalogId: 2 },
    { id: 28, requestedAt: "2025-06-22T09:30:00Z", completedAt: "2025-06-23T10:30:00Z", state: "COMPLETED", priority: "LOW", byLabUserId: 1, medicHistoryId: 13, medicTestCatalogId: 3 },
    { id: 27, requestedAt: "2025-06-22T08:00:00Z", completedAt: null, state: "TO_VERIFY", priority: "HIGH", byLabUserId: 1, medicHistoryId: 14, medicTestCatalogId: 4 },
    { id: 26, requestedAt: "2025-06-21T11:00:00Z", completedAt: null, state: "IN_PROCESS", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 15, medicTestCatalogId: 5 },
    { id: 25, requestedAt: "2025-06-21T10:00:00Z", completedAt: "2025-06-22T07:00:00Z", state: "COMPLETED", priority: "HIGH", byLabUserId: 1, medicHistoryId: 16, medicTestCatalogId: 1 },
    { id: 24, requestedAt: "2025-06-20T09:00:00Z", completedAt: null, state: "PENDING", priority: "LOW", byLabUserId: 1, medicHistoryId: 17, medicTestCatalogId: 2 },
    { id: 23, requestedAt: "2025-06-20T08:00:00Z", completedAt: null, state: "TO_VERIFY", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 18, medicTestCatalogId: 3 },
    { id: 22, requestedAt: "2025-06-19T15:00:00Z", completedAt: null, state: "IN_PROCESS", priority: "HIGH", byLabUserId: 1, medicHistoryId: 19, medicTestCatalogId: 4 },
    { id: 21, requestedAt: "2025-06-19T13:00:00Z", completedAt: "2025-06-20T12:00:00Z", state: "COMPLETED", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 20, medicTestCatalogId: 5 },

    // Mayo
    { id: 20, requestedAt: "2025-05-31T10:00:00Z", completedAt: null, state: "PENDING", priority: "LOW", byLabUserId: 1, medicHistoryId: 21, medicTestCatalogId: 1 },
    { id: 19, requestedAt: "2025-05-30T09:30:00Z", completedAt: null, state: "TO_VERIFY", priority: "HIGH", byLabUserId: 1, medicHistoryId: 22, medicTestCatalogId: 2 },
    { id: 18, requestedAt: "2025-05-29T08:45:00Z", completedAt: "2025-05-30T07:30:00Z", state: "COMPLETED", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 23, medicTestCatalogId: 3 },
    { id: 17, requestedAt: "2025-05-29T08:00:00Z", completedAt: null, state: "IN_PROCESS", priority: "LOW", byLabUserId: 1, medicHistoryId: 24, medicTestCatalogId: 4 },
    { id: 16, requestedAt: "2025-05-28T07:30:00Z", completedAt: null, state: "PENDING", priority: "HIGH", byLabUserId: 1, medicHistoryId: 25, medicTestCatalogId: 5 },
    { id: 15, requestedAt: "2025-05-28T07:00:00Z", completedAt: "2025-05-29T06:00:00Z", state: "COMPLETED", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 26, medicTestCatalogId: 1 },
    { id: 14, requestedAt: "2025-05-27T13:00:00Z", completedAt: null, state: "TO_VERIFY", priority: "LOW", byLabUserId: 1, medicHistoryId: 27, medicTestCatalogId: 2 },
    { id: 13, requestedAt: "2025-05-27T10:00:00Z", completedAt: null, state: "IN_PROCESS", priority: "HIGH", byLabUserId: 1, medicHistoryId: 28, medicTestCatalogId: 3 },
    { id: 12, requestedAt: "2025-05-26T09:00:00Z", completedAt: null, state: "PENDING", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 29, medicTestCatalogId: 4 },
    { id: 11, requestedAt: "2025-05-26T08:00:00Z", completedAt: "2025-05-27T07:00:00Z", state: "COMPLETED", priority: "LOW", byLabUserId: 1, medicHistoryId: 30, medicTestCatalogId: 5 },
    { id: 10, requestedAt: "2025-05-25T14:00:00Z", completedAt: null, state: "TO_VERIFY", priority: "HIGH", byLabUserId: 1, medicHistoryId: 31, medicTestCatalogId: 1 },
    { id: 9, requestedAt: "2025-05-24T10:30:00Z", completedAt: null, state: "IN_PROCESS", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 32, medicTestCatalogId: 2 },
    { id: 8, requestedAt: "2025-05-23T08:00:00Z", completedAt: "2025-05-24T07:00:00Z", state: "COMPLETED", priority: "LOW", byLabUserId: 1, medicHistoryId: 33, medicTestCatalogId: 3 },
    { id: 7, requestedAt: "2025-05-22T13:00:00Z", completedAt: null, state: "TO_VERIFY", priority: "HIGH", byLabUserId: 1, medicHistoryId: 34, medicTestCatalogId: 4 },
    { id: 6, requestedAt: "2025-05-22T08:30:00Z", completedAt: null, state: "IN_PROCESS", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 35, medicTestCatalogId: 5 },
    { id: 5, requestedAt: "2025-05-21T09:15:00Z", completedAt: "2025-05-22T07:00:00Z", state: "COMPLETED", priority: "LOW", byLabUserId: 1, medicHistoryId: 36, medicTestCatalogId: 1 },
    { id: 4, requestedAt: "2025-05-20T07:00:00Z", completedAt: null, state: "PENDING", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 37, medicTestCatalogId: 2 },
    { id: 3, requestedAt: "2025-05-19T10:00:00Z", completedAt: null, state: "TO_VERIFY", priority: "HIGH", byLabUserId: 1, medicHistoryId: 38, medicTestCatalogId: 3 },
    { id: 2, requestedAt: "2025-05-18T08:30:00Z", completedAt: "2025-05-19T07:30:00Z", state: "COMPLETED", priority: "LOW", byLabUserId: 1, medicHistoryId: 39, medicTestCatalogId: 4 },
    { id: 1, requestedAt: "2025-05-17T09:00:00Z", completedAt: null, state: "IN_PROCESS", priority: "MEDIUM", byLabUserId: 1, medicHistoryId: 40, medicTestCatalogId: 5 },
  ]
};



async function fetchRequestTrends() {
  loading.value = true;
  try {
    const labData: LabData = {
      id: 29,
      name: "Laboratorium",
      status: "active",
      rif: "j853946049",
      logoPath: null,
    };
    const lab = useLabStore();
    lab.setCurrentLab(labData);

    const queries: GetExtendQuerys = { offset: 0, limit: 500, includeData: true };
    const res = await medicTestRequestApi.getMedicTestRequests(queries);
    const rawData = res.data.data;

    const grouped: Record<string, number> = {};
    rawData.forEach(item => {
      const date = dayjs(item.requestedAt).format('YYYY-MM-DD');
      grouped[date] = (grouped[date] || 0) + 1;
    });

    const dates = Object.keys(grouped).sort();
    if (dates.length === 0) return;

    let startDate = dayjs(dates[0]);
    const endDate = dayjs(dates[dates.length - 1]);

    if (selectedView.value === 'month') {
      startDate = endDate.subtract(1, 'month');
    } else if (selectedView.value === 'week') {
      startDate = endDate.subtract(7, 'day');
    }

    const data: { time: string; value: number }[] = [];
    let current = startDate;
    while (current.isBefore(endDate) || current.isSame(endDate)) {
      const dateStr = current.format('YYYY-MM-DD');
      data.push({
        time: dateStr,
        value: grouped[dateStr] || 0,
      });
      current = current.add(1, 'day');
    }

    if (!chart && chartContainer.value) {
      chart = createChart(chartContainer.value, {
        height: 400,
        width: chartContainer.value.clientWidth,
        layout: {
          background: { color: '#f9fafb' }, // gris claro
          textColor: '#374151',             // gris oscuro
        },
        grid: {
          vertLines: { color: '#e5e7eb' },
          horzLines: { color: '#e5e7eb' },
        },
        crosshair: {
          mode: 0,
        },
        rightPriceScale: {
          borderColor: '#d1d5db',
          mode: 0,
          autoScale: true,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#d1d5db',
          fixLeftEdge: true,
        },
      });

      lineSeries = chart.addSeries(LineSeries, {
        color: '#3B82F6',
        priceFormat: {
          type: 'price',
          precision: 0,
          minMove: 1,
        },
      });
    }

    // Calcular min y max para mantener espacio visual
    const maxValue = Math.max(...data.map(d => d.value)) + 1;
    const minValue = 0;

    // Ajustar escalado forzado
    lineSeries?.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue,
          maxValue,
        },
      }),
    });

    // Set data y autofit
    lineSeries?.setData(data);
    chart?.timeScale().fitContent();


    lineSeries?.setData(data);
    chart?.timeScale().fitContent();
  } catch (error) {
    console.error('Error al cargar tendencias:', error);
  } finally {
    loading.value = false;
  }
}

watchEffect(() => {
  fetchRequestTrends();
});

function handleResize() {
  if (chart && chartContainer.value) {
    chart.resize(chartContainer.value.clientWidth, 400);
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chart?.remove();
});
</script>

<style scoped>
div {
  height: 100%;
}
</style>
