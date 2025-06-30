<template>
  <div class="bg-white rounded p-4 flex flex-col">
    <h3 class="text-lg font-semibold mb-2">Distribución de estados de solicitudes</h3>

    <div
      v-if="loading"
      class="text-center py-8 flex-1 flex items-center justify-center"
    >
      <span>Cargando gráfica...</span>
    </div>

    <VChart
      v-else
      ref="chartContainer"
      :option="chartOptions"
      autoresize
      style="width: 100%; height: 100%;"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { use } from 'echarts/core';
  import VChart from 'vue-echarts';
  import { CanvasRenderer } from 'echarts/renderers';
  import { PieChart } from 'echarts/charts';
  import { TooltipComponent, LegendComponent } from 'echarts/components';

  use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent]);

  const props = defineProps<{
    data: any[];
    loading: boolean;
  }>();

  const loading = ref(true);
  const chartOptions = ref({});

  const stateDisplayNames: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_PROCESS: 'En Proceso',
    TO_VERIFY: 'Por Verificar',
    CANCELED: 'Cancelado',
    COMPLETED: 'Completado',
  };

  function updateChartOptions(rawData: any[]) {
    const groupedByState: Record<string, number> = {};
    rawData.forEach((item) => {
      groupedByState[item.state] = (groupedByState[item.state] || 0) + 1;
    });

    const pieData = Object.entries(groupedByState).map(([state, count]) => ({
      name: stateDisplayNames[state] ?? state,
      value: count,
    }));

    chartOptions.value = {
      tooltip: { trigger: 'item' },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: 'Estados',
          type: 'pie',
          radius: '70%',
          center: ['60%', '50%'],
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            formatter: '{b}: {d}%',
          },
        },
      ],
    };
  }

  // Vigila cambios en props.data
  watch(
    () => props.data,
    (newData) => {
      if (newData && newData.length > 0) {
        loading.value = false;
        updateChartOptions(newData);
      } else {
        loading.value = true;
        chartOptions.value = {};
      }
    },
    { immediate: true }
  );
</script>
