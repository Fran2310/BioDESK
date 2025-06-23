<template>
  <VaLayout
    v-if="breakpoint.lgUp"
    class="min-h-screen h-screen overflow-hidden max-h-screen"
    :left="{ fixed: true }"
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
        class="h-full min-h-screen bg-base flex items-center justify-center"
        style="max-width: 65dvw"
      >
        <RouterView />
      </main>
    </template>
  </VaLayout>

  <VaLayout v-else>
    <p>
      Current breakpoint is:
      <strong>{{ breakpoint.lgUp ? 'Es large' : 'es otro' }}</strong>
    </p></VaLayout
  >
</template>

<script setup>
  import { useBreakpoint } from 'vuestic-ui';
  import Logo from '@/components/Logo.vue';

  const breakpoint = useBreakpoint();
</script>

<style scoped></style>
