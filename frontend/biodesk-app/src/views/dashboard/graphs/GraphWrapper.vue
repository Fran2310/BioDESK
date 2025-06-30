<script setup lang="ts">
import { computed } from 'vue';
import GraphRequestsTrend from './GraphRequestsTrend.vue';
import GraphRequestsPie from './GraphRequestsPie.vue';

const props = defineProps<{
  rawData: any[] | null, // Permitir null para un estado inicial más claro
  loading: boolean,
}>();

// Usamos una computada para darle más semántica y reactividad.
// Esto es opcional, podrías usar props.rawData directamente en el template.
const dataForGraphs = computed(() => props.rawData);

</script>

<template>
  <div
    class="bg-white rounded-lg shadow-md p-4 sm:p-6 w-full max-w-6xl"
    :aria-busy="props.loading"
  >
    <transition name="fade" mode="out-in">
      <div v-if="props.loading" key="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div class="w-full bg-gray-200 rounded-lg animate-pulse" style="height: 350px;"></div>
        <div class="w-full bg-gray-200 rounded-lg animate-pulse" style="height: 350px;"></div>
      </div>

      <div
        v-else
        key="content"
        class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      >
        <div class="min-w-0"> <GraphRequestsTrend :data="dataForGraphs" :loading="props.loading" class="w-full h-full" />
        </div>
        <div class="min-w-0">
          <GraphRequestsPie :data="dataForGraphs" :loading="props.loading" class="w-full h-full" />
        </div>
      </div>
    </transition>
  </div>
</template>

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