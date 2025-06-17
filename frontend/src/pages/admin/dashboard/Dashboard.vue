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

import { ref, computed } from 'vue'

const authStore = useAuthStore()
const showModal = ref(true)

const closeModal = () => {
  showModal.value = false
}

/* alert(authStore.labs) */
const labCards = computed(() => {
  return [...authStore.labs]
})

</script>


<template>
  <h1 class="page-title font-bold">Dashboard</h1>
  
  <template>
  <h1 class="page-title font-bold">Dashboard</h1>

  <div class="p-6">
    <!-- Welcome Modal -->
    <VaModal v-model="showModal" title="Bienvenido" size="medium" hide-default-actions :close-on-click-outside="false">
      <div class="p-4 max-w-xl mx-auto">
        <!-- <h2 class="font-bold text-xl mb-2">Token</h2>
        <pre class="bg-gray-100 p-2 rounded mb-4 overflow-x-auto max-w-full text-sm">
          {{ authStore.token?.substring(0, 200) }}...
        </pre> -->

        <h2 class="font-bold text-xl mb-4">Laboratorios Asignados</h2>

        <!-- Laboratorios como cards -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- Cards de laboratorios -->
          <VaCard v-for="lab in labCards" :key="lab.id" class="p-3 text-center">
            <div class="font-semibold">{{ lab.name }}</div>
            <div class="text-sm text-gray-600">RIF: {{ lab.rif }}</div>
          </VaCard>

          <!-- Card de "Agregar Laboratorio" -->
          <VaCard
            color="tertiary"
            
            outlined
            text-color="white"
            class="p-3 text-center cursor-pointer flex items-center justify-center h-full"
            @click="() => {}"
          >
            <span class="text-3xl font-bold">+</span>
            <span class="ml-2 font-medium">Agregar</span>
          </VaCard>
        </div>

        <div class="flex justify-end mt-2">
          <VaButton @click="closeModal">Cerrar</VaButton>
        </div>
      </div>
    </VaModal>

    <!-- Dashboard Content -->
    <h1 class="text-3xl font-semibold mb-4">Panel Principal</h1>
    <p>¡Bienvenido!</p>
  </div>

  <!-- Aquí va el contenido del dashboard original si lo deseas reintegrar después -->
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
