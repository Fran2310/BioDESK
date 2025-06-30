<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import LastMedicTestsCard from './cards/LastMedicTestsCard.vue';
  import TimelineCard from './cards/TimelineCard.vue';

import { medicTestRequestApi } from '@/services/api';
import { useLabStore } from '@/stores/labStore';
import type { LabData } from '@/services/interfaces/lab';
import type { GetExtendQuerys } from '@/services/interfaces/global';
import GraphWrapper from './graphs/GraphWrapper.vue';

  const loading = ref(true);
  const rawData = ref<any[]>([]);

  async function fetchRequests() {
    loading.value = true;
    try {
      const labData: LabData = {
        id: 29,
        name: 'Laboratorium',
        status: 'active',
        rif: 'j853946049',
        logoPath: null,
      };
      useLabStore().setCurrentLab(labData);

      const queries: GetExtendQuerys = {
        offset: 0,
        limit: 500,
        includeData: true,
      };
      const res = await medicTestRequestApi.getMedicTestRequests(queries);
      rawData.value = res.data.data;
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetchRequests);
</script>

<template>
  <h1 class="page-title font-bold text-center mb-4">Dashboard</h1>

  <section class="flex flex-col gap-4 items-center">
    <GraphWrapper :raw-data="rawData" :loading="loading" />

    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl px-4">
      <LastMedicTestsCard class="w-full md:w-1/2" />
      <TimelineCard class="w-full md:w-1/2" />
    </div>
  </section>
</template>
