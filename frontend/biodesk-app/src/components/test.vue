<template>
  <Transition :name="transitionName" @after-leave="onAfterLeave">
    <div
      v-if="showAnimate"
      :style="{
        '--enter-duration': props.enterDuration || '2s',
        '--leave-duration': props.leaveDuration || '1s',
        '--transition-delay': props.delay || '0s',
      }"
      class="animate-block-content"
    >
      <slot />
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useBreakpoint } from 'vuestic-ui';

  const props = defineProps<{
    /**
     * Si se pasa, fuerza el nombre de la transición.
     * Si no, se calcula automáticamente según el breakpoint.
     */
    transition?: string;
    /**
     * Si se pasa, se ejecuta después de la animación de salida.
     */
    onAfterLeave?: () => void;

    enterDuration?: string; // Ejemplo: '2s'
    leaveDuration?: string; // Ejemplo: '1s'
    delay?: string; // Ejemplo: '0.5s'
  }>();

  const emit = defineEmits<{
    (e: 'after-leave'): void;
  }>();

  const showAnimate = ref(false);

  const breakpoint = useBreakpoint();
  const transitionName = computed(() =>
    props.transition
      ? props.transition
      : breakpoint.lgUp
      ? 'slide-fade-x'
      : 'slide-fade-y'
  );

  onMounted(() => {
    showAnimate.value = true;
  });

  function hide() {
    showAnimate.value = false;
  }

  function onAfterLeave() {
    emit('after-leave');
    props.onAfterLeave?.();
  }

  defineExpose({ hide, showAnimate });
</script>
<style scoped>
  /** Animaciones */
  .slide-fade-x-enter-active,
  .slide-fade-x-leave-active,
  .slide-fade-y-enter-active,
  .slide-fade-y-leave-active {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.73, -0.12, 0.16, 1.05);
    transition-duration: var(--enter-duration, 2s);
  }

  .slide-fade-x-leave-active,
  .slide-fade-y-leave-active {
    transition-duration: var(--leave-duration, 1s);
  }

  /* Aplica el delay solo al contenido animado */
  .animate-block-content {
    transition-delay: var(--transition-delay, 0s);
  }

  .slide-fade-x-enter-from,
  .slide-fade-x-leave-to {
    opacity: 0;
    transform: translateX(200px);
    filter: blur(1px);
  }
  .slide-fade-x-enter-to,
  .slide-fade-x-leave-from {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }

  .slide-fade-y-enter-from,
  .slide-fade-y-leave-to {
    opacity: 0;
    transform: translateY(200px);
    filter: blur(1px);
  }
  .slide-fade-y-enter-to,
  .slide-fade-y-leave-from {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
</style>
