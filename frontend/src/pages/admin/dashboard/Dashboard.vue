<script lang="ts" setup>
import RevenueUpdates from './cards/RevenueReport.vue'
import ProjectTable from './cards/ProjectTable.vue'
import RevenueByLocationMap from './cards/RevenueByLocationMap.vue'
import DataSection from './DataSection.vue'
import YearlyBreakup from './cards/YearlyBreakup.vue'
import MonthlyEarnings from './cards/MonthlyEarnings.vue'
import RegionRevenue from './cards/RegionRevenue.vue'
import Timeline from './cards/Timeline.vue'
import { useAuthStore } from '../../../stores/authStore'

import { ref } from 'vue'

const authStore = useAuthStore()
const showModal = ref(true)

const closeModal = () => {
  showModal.value = false
}

alert(authStore.labs)


</script>

<template>
  <h1 class="page-title font-bold">Dashboard</h1>
  
  <template>
  <div class="p-6">
    <!-- Welcome Modal -->
    <VaModal v-model="showModal" title="Bienvenido" size="large" hide-default-actions>
      <div class="p-4">
        <h2 class="font-bold text-xl mb-2">Token</h2>
        <pre class="bg-gray-100 p-2 rounded mb-4 overflow-x-auto max-w-full text-sm">
          {{ authStore.token?.substring(0, 200) }}...
        </pre>

        <h2 class="font-bold text-xl mb-2">Laboratorios Asignados</h2>
        <div v-if="authStore.labs.length">
          <ul class="list-disc pl-5 mb-4">
            <li v-for="lab in authStore.labs" :key="lab.id">
              {{ lab.name }} (RIF: {{ lab.rif }})
            </li>
          </ul>
        </div>
        <div v-else>
          <p class="text-gray-600">No tienes laboratorios asignados.</p>
        </div>

        <div class="flex justify-end mt-4">
          <VaButton @click="closeModal">Cerrar</VaButton>
        </div>
      </div>
      <div><pre>{{ authStore.labs }}</pre></div>
    </VaModal>

    <!-- Dashboard Content -->
    <h1 class="text-3xl font-semibold mb-4">Panel Principal</h1>
    <p>¡Bienvenido!</p>
  </div>

  
  

</template>

  <section class="flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- <RevenueUpdates class="bg red w-full sm:w-[70%]" />
      <div class="  flex flex-col gap-4 w-full sm:w-[30%]">
        <YearlyBreakup class="h-full" />
        <MonthlyEarnings />
      </div> -->
    </div>
   <!--  <DataSection />
    <div class="flex flex-col md:flex-row gap-4">
      <RevenueByLocationMap class="w-full md:w-4/6" />
      <RegionRevenue class="w-full md:w-2/6" />
    </div>
    <div class="flex flex-col md:flex-row gap-4">
      <ProjectTable class="w-full md:w-1/2" />
      <Timeline class="w-full md:w-1/2" />
    </div> -->
  </section>
</template>
