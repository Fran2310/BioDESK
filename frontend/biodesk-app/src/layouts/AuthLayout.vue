<template>
  <!-- Vista de escritorio -->
  <VaLayout
    v-if="breakpoint.lgUp"
    class="min-h-screen h-screen overflow-hidden max-h-screen bg-Lightbase"
    :left="{ fixed: true }"
    color="bg-Lightbase"
  >
    <template #left>
      <div
        class="flex items-center justify-center h-full bg-primary"
        style="width: 35dvw; max-width: 35dvw"
      >
        <!-- Logo con tamaño dinámico según resolución -->
        <Logo :height="desktopLogoHeight" :color="'#ffffff'" />
      </div>
    </template>
    <template #content>
      <main
        class="bg-Lightbase h-full min-h-screen flex items-center justify-center"
        style="max-width: 65dvw"
      >
        <RouterView />
      </main>
    </template>
  </VaLayout>

  <!-- Vista móvil -->
  <VaLayout v-else class="bg-Lightbase">
    <template #content>
      <main
        class="bg-Lightbase h-full min-h-screen flex items-center justify-center mx-5"
      >
        <div class="min-h-full flex flex-col items-center justify-start gap-8">
          <Logo :height="'6rem'" />
          <RouterView />
        </div>
      </main>
    </template>
  </VaLayout>
</template>

<script lang="ts" setup>
  import { useBreakpoint } from 'vuestic-ui';
  import { useWindowSize } from '@vueuse/core'; // 🆕 Hook para tamaño de ventana
  import { computed } from 'vue';
  import Logo from '@/components/Logo.vue';

  const breakpoint = useBreakpoint();
  const { width } = useWindowSize();

  // 🆕 Computed que ajusta el tamaño del logo según resolución
  const desktopLogoHeight = computed(() => {
    if (width.value >= 2560) return '20rem'; // 4K
    if (width.value >= 1920) return '11rem'; // Full HD
    return '9rem'; // default
  });
</script>

<style scoped></style>
