// src/composables/useAnimatedRouteLeave.ts
import { ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
// Para navegación interna (ej: submit)
// Para navegación externa (cualquier cambio de ruta)
/**
 * Guard de navegación para animar la retirada en cualquier cambio de ruta.
 * Si se navega fuera del Login (por router.push, RouterLink, botón atrás, etc),
 * primero se anima la salida y luego se permite la navegación.
 */
/**
 * Handler que se ejecuta después de la animación de salida.
 * - Si hay navegación pendiente por cambio de ruta, la realiza.
 * - Si hay navegación interna (ej: submit), navega a la ruta indicada.
 */
// Si necesitas navegación interna (ej: submit), puedes hacer:
// pendingRoute.value = { name: 'OtraRuta' };
// animatedBlock.value.hide();

export function useAnimatedRouteLeave(animatedBlockOrBlocks: any) {
  // Permite pasar un solo bloque o un array de bloques
  const blocks = Array.isArray(animatedBlockOrBlocks)
    ? animatedBlockOrBlocks
    : [animatedBlockOrBlocks];

  const pendingRoute = ref<null | { name: string }>(null);
  const nextRoute = ref<null | (() => void)>(null);
  const blocksLeaving = ref(0);

  onBeforeRouteLeave((to, from, next) => {
    // Si todos los bloques ya están ocultos, permite la navegación
    if (blocks.every((block) => !block.value?.showAnimate)) {
      next();
      return;
    }
    nextRoute.value = next;
    // Oculta todos los bloques
    blocks.forEach((block) => block.value?.hide());
    // El next() se llamará en onAfterLeave cuando todos hayan terminado
  });

  // Llama esto en cada @after-leave de tus bloques
  const onAfterLeave = (router: any) => {
    blocksLeaving.value++;
    if (blocksLeaving.value < blocks.length) return;
    if (nextRoute.value) {
      nextRoute.value();
      nextRoute.value = null;
    } else if (pendingRoute.value) {
      router.push(pendingRoute.value);
      pendingRoute.value = null;
    }
    blocksLeaving.value = 0; // Resetea el contador para la próxima vez
  };

  return {
    pendingRoute,
    nextRoute,
    onAfterLeave,
  };
}
