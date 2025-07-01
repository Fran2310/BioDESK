<template>
  <transition name="fade" mode="out-in">
    <div
      v-if="props.loading"
      key="loading"
      :class="['w-full flex px-4', justifyClass]"
    >
      <div
        :class="[widthClass, 'bg-gray-200 rounded-lg animate-pulse']"
        :style="{ height }"
      ></div>
    </div>

    <div
      v-else
      key="content"
      class="flex items-center justify-between px-4 sm:pl-6 sm:pr-4 w-full h-full"
    >
      <slot />
    </div>
  </transition>
</template>
<script setup lang="ts">
  const props = defineProps<{
    loading: boolean;
    widthClass?: string;
    height?: string;
    justifyClass?: string;
  }>();

  // Valores por defecto
  const widthClass = props.widthClass ?? 'w-3/4';
  const height = props.height ?? '50dvh';
  const justifyClass = props.justifyClass ?? 'justify-center';
</script>
<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
