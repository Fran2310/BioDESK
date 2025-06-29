<script lang="ts" setup>
import Timeline from './cards/Timeline.vue';
</script>

<template>
  <h1 class="page-title font-bold">Dashboard</h1>
  <section class="flex flex-col gap-4">
    <DataSection />
    <div class="flex flex-col md:flex-row gap-4">
      <Timeline class="w-full md:w-1/2" />
    </div>
  </section>
</template>