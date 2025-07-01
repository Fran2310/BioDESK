<template>
  <div
    class="bg-white rounded p-4 min-h-[300px] flex flex-col justify-center"
    style="height: 40dvh"
  >
    <h3 class="text-lg font-semibold mb-2 mt-2">Tendencia de solicitudes</h3>

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
      class="flex-1 mb-5"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { use } from 'echarts/core';
  import VChart from 'vue-echarts';
  import { CanvasRenderer } from 'echarts/renderers';
  import { LineChart } from 'echarts/charts';
  import {
    GridComponent,
    TooltipComponent,
    TitleComponent,
    LegendComponent,
  } from 'echarts/components';
  import dayjs from 'dayjs';

  use([
    CanvasRenderer,
    LineChart,
    GridComponent,
    TooltipComponent,
    TitleComponent,
    LegendComponent,
  ]);

  const props = defineProps<{
    data: any[];
    loading: boolean;
  }>();

  const loading = ref(true);
  const chartOptions = ref({});

  function updateChartOptions(rawData: any[]) {
    const grouped: Record<string, number> = {};
    rawData.forEach((item) => {
      const date = dayjs(item.requestedAt).format('YYYY-MM-DD');
      grouped[date] = (grouped[date] || 0) + 1;
    });

    const dates = Object.keys(grouped).sort();
    if (dates.length === 0) {
      chartOptions.value = {};
      return;
    }

    const data = dates.map((date) => grouped[date]);
    const maxData = Math.max(...data) + 1;

    chartOptions.value = {
      title: {
        text: '',
      },
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: maxData,
      },
      series: [
        {
          name: 'Solicitudes',
          type: 'line',
          smooth: true,
          data: data,
          areaStyle: {
            color: '#BFDBFE',
          },
          lineStyle: {
            color: '#3B82F6',
            width: 2,
          },
          symbolSize: 6,
          emphasis: {
            focus: 'series',
          },
        },
      ],
    };
  }

  // Reacciona a cambios en props.data
  watch(
    () => props.data,
    (newData) => {
      loading.value = props.loading; // sincronizar loading
      if (newData && newData.length > 0) {
        updateChartOptions(newData);
        loading.value = false;
      } else {
        chartOptions.value = {};
        loading.value = true;
      }
    },
    { immediate: true }
  );
</script>
