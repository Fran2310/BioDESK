<script lang="ts" setup>
import LastMedicTestsCard from './cards/LastMedicTestsCard.vue';
import TimelineCard from './cards/TimelineCard.vue';

</script>

<template>
  <h1 class="page-title font-bold text-center mb-4">Dashboard</h1>

  <section class="flex flex-col gap-4">
    <!-- Sección 1: Superior, centrada, ancho completo -->
    <div class="w-full flex justify-center">
      <p class="w-full max-w-4xl" >seccion 1</p>
    </div>

    <!-- Sección 2 y 3: fila debajo de sección 1 -->
    <div class="flex flex-col md:flex-row gap-4">
      <LastMedicTestsCard class="w-full md:w-1/2" />
      <TimelineCard class="w-full md:w-1/2" />
    </div>
  </section>
</template>
