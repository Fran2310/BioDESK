<template>
  <section class="flex flex-col gap-4 items-center justify-between max-h-full">
    <!--<GraphWrapper :raw-data="rawData" :loading="loading" />-->
    <div class="flex w-full h-full">
      <lazyAnimateGraph
        :loading="loading"
        :justifyClass="'justify-between'"
        :widthClass="'w-full'"
      >
        <div class="max-w-full w-full" style="height: 50dvh">
          <GraphRequestsPie
            :data="rawData"
            :loading="loading"
            class="w-full h-full"
          />
        </div>
      </lazyAnimateGraph>

      <div
        class="min-h-full flex flex-col lg:flex-col justify-between w-1/4 gap-4 pr-4"
      >
        <!--USUARIOS CARD COUNTER-->
        <VaSkeleton
          v-if="loading"
          height="50%"
          class="rounded-xl"
          color="#E9EBEE"
        />
        <VaCard
          v-else
          class="cursor-pointer transition-transform hover:scale-105 shadow-md h-full w-full"
          @click="onClickUsers"
        >
          <VaCardContent
            class="flex flex-col items-center justify-center gap-4 p-4"
          >
            <div class="flex">
              <VaIcon
                name="people"
                color="primary"
                size="large"
                class="bg-secondary/10 p-1 rounded-full"
              />
              <p class="text-2xl text-gray-500">Usuarios</p>
            </div>
            <h2 class="text-8xl font-semibold text-gray-600">
              {{ totalUsers }}
            </h2>
          </VaCardContent>
        </VaCard>

        <!--PACIENTES CARD COUNTER-->
        <VaSkeleton
          v-if="loading"
          height="50%"
          class="rounded-xl"
          color="#E9EBEE"
        />
        <VaCard
          v-else
          class="cursor-pointer transition-transform hover:scale-105 shadow-md h-full w-full"
          @click="onClickPatients"
        >
          <VaCardContent
            class="flex flex-col items-center justify-center gap-4 p-4"
          >
            <div class="flex">
              <VaIcon
                name="people"
                color="primary"
                size="large"
                class="bg-secondary/10 p-1 rounded-full"
              />
              <p class="text-2xl text-gray-500">Pacientes</p>
            </div>
            <h2 class="text-8xl font-semibold text-gray-600">
              {{ totalPatients }}
            </h2>
          </VaCardContent>
        </VaCard>
      </div>
    </div>
    <lazyAnimateGraph
      :loading="loading"
      :widthClass="'w-full'"
      :height="'35dvh'"
    >
      <div class="max-w-full w-full" style="height: 35dvh">
        <GraphRequestsTrend
          :data="rawData"
          :loading="loading"
          class="w-full h-full"
        />
      </div>
    </lazyAnimateGraph>

    <VaDivider />
    <div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl px-4">
      <LastMedicTestsCard class="w-full md:w-1/2" />
      <TimelineCard class="w-full md:w-1/2" />
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import LastMedicTestsCard from './cards/LastMedicTestsCard.vue';
  import TimelineCard from './cards/TimelineCard.vue';
  import { medicTestRequestApi, patientApi, userApi } from '@/services/api';
  import type {
    GetExtendQuerys,
    GetWithPermissionsQuerys,
  } from '@/services/interfaces/global';
  import lazyAnimateGraph from './graphs/lazyAnimateGraph.vue';
  import GraphRequestsPie from './graphs/GraphRequestsPie.vue';
  import GraphRequestsTrend from './graphs/GraphRequestsTrend.vue';
  import router from '@/router';

  const loading = ref(true);
  const rawData = ref<any[]>([]);
  const totalUsers = ref(0);
  const totalPatients = ref(0);

  async function fetchCounts() {
    const querysUser: GetWithPermissionsQuerys = {
      offset: 0,
      limit: 1,
      includePermissions: false,
    };

    const querysPatient: GetExtendQuerys = {
      offset: 0,
      limit: 1,
      includeData: false,
    };

    try {
      const responseUsers = await userApi.getUsersMix(querysUser);

      const responsePatient = await patientApi.getPatients(querysPatient);

      totalUsers.value = responseUsers.data.total;

      totalPatients.value = responsePatient.data.total;
    } catch (e) {
      console.error('Error al cargar contadores:', e);
    }
  }

  async function fetchRequests() {
    try {
      const queries: GetExtendQuerys = {
        offset: 0,
        limit: 500,
        includeData: true,
      };
      const res = await medicTestRequestApi.getMedicTestRequests(queries);
      rawData.value = res.data.data;
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    }
  }

  async function fetchAllDashboardData() {
    loading.value = true;
    try {
      await Promise.all([fetchCounts(), fetchRequests()]);
    } catch (e) {
      console.error('Error cargando datos del dashboard', e);
    } finally {
      loading.value = false;
    }
  }

  function onClickUsers() {
    router.push({ name: 'UsersView' });
  }

  function onClickPatients() {
    router.push({ name: 'Patients' });
  }

  onMounted(async () => {
    await fetchAllDashboardData();
  });
</script>

<style scoped>
  ::v-deep(.va-card__content div.flex .va-icon.material-icons) {
    font-size: 48px !important;
  }
</style>
