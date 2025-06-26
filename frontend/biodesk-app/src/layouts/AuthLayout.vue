<template>
  <VaLayout
    v-if="breakpoint.lgUp"
    class="min-h-screen h-screen overflow-hidden max-h-screen bg-Lightbase"
    :left="{ fixed: true }"
    color="bg-Lightbase"
  >
    <template #left>
      <div
        class="flex items-center justify-center h-full bg-backgroundLightPrimary"
        style="width: 35dvw; max-width: 35dvw"
      >
        <Logo :height="'9rem'" />
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

  <VaLayout v-else class="bg-Lightbase">
    <template #content>
      <main
        class="bg-Lightbase h-full min-h-screen flex items-center justify-center mx-5"
      >
        <div class="min-h-full flex flex-col items-center justify-start">
          <Logo :height="'6rem'" />
          <RouterView />
        </div>
      </main>
    </template>
  </VaLayout>
</template>

<script lang="ts" setup>
  import { useBreakpoint } from 'vuestic-ui';
  import Logo from '@/components/Logo.vue';

  const breakpoint = useBreakpoint();
</script>

<style scoped></style>
