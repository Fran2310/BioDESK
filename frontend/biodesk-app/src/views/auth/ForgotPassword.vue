<template>
  <AnimateBlock
    ref="animatedBlock"
    @after-leave="() => onAfterLeave(router)"
    enter-duration="2s"
    leave-duration="1s"
  >
    <AuthContentBlock>
      <h1 class="font-semibold text-4xl mb-4">Cambio de contraseña</h1>
    </AuthContentBlock>
  </AnimateBlock>
</template>
<script setup lang="ts">
  import AnimateBlock from '@/components/AnimateBlock.vue';
  import AuthContentBlock from '@/components/AuthContentBlock.vue';
  import router from '@/router';
  import { ref } from 'vue';
  import { useAnimatedRouteLeave } from '@/composables/useAnimatedRouteLeave';

  const animatedBlock = ref();
  const { onAfterLeave } = useAnimatedRouteLeave(animatedBlock);
</script>
<style scoped></style>
