<template>
  <div
    class="min-h-full flex flex-col items-center justify-center bg-Lightbase py-2"
  >
    <h1 class="font-semibold text-2xl">Selecciona un laboratorio</h1>
    <div class="w-full flex flex-col items-center">
      <AnimateBlock
        ref="animatedBlock"
        @after-leave="onAfterLeave"
        enter-duration="2s"
        leave-duration="1s"
      >
        <!-- Contenedor con scroll solo si es necesario -->
        <component
          :is="needsScroll ? 'VaScrollContainer' : 'div'"
          :class="[
            'overflow-y-auto p-3',
            breakpoint.lgUp ? 'max-h-[70vh]' : 'max-h-[55vh]',
          ]"
          ref="scrollWrapper"
        >
          <div
            class="grid gap-4 pr-3"
            :class="{
              'grid-cols-1': !isDesktop,
              'grid-cols-2': isDesktop,
            }"
            ref="gridContent"
          >
            <VaButton
              v-for="lab in labStore.labs"
              :key="lab.id"
              class="w-full p-4 text-lg font-semibold shadow-md p-2 h-auto transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95"
              color="base"
              borderColor="primary"
              :style="{ borderWidth: '3px', borderRadius: '0.5rem' }"
              @click="selectLab(lab)"
            >
              <template #prepend>
                <div
                  class="min-w-16 w-16 min-h-16 h-16 flex items-center justify-center"
                >
                  <template v-if="!lab.logoPath">
                    <svg
                      version="1.0"
                      xmlns="http://www.w3.org/2000/svg"
                      width="48.000000pt"
                      height="48.000000pt"
                      viewBox="0 0 512.000000 512.000000"
                      preserveAspectRatio="xMidYMid meet"
                      class="min-w-16 w-16 min-h-16 h-16"
                    >
                      <g
                        transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                        fill="#215A6D"
                        stroke="none"
                      >
                        <path
                          d="M2169 5097 c-25 -17 -166 -228 -547 -822 -282 -439 -517 -816 -523
                      -837 -12 -45 1 -102 32 -141 11 -15 47 -43 80 -63 33 -21 58 -40 57 -44 -2 -3
                      -34 -54 -71 -113 -79 -122 -89 -162 -62 -233 15 -39 29 -53 93 -95 41 -27 86
                      -52 99 -55 38 -10 116 1 145 20 14 9 59 68 98 131 l72 113 61 -39 c34 -22 72
                      -42 85 -46 38 -9 112 3 141 24 14 11 120 166 236 346 l209 326 18 -47 c27 -72
                      96 -152 168 -194 206 -121 467 -43 572 170 31 63 33 72 33 179 0 91 3 112 13
                      108 41 -15 177 -121 253 -195 205 -201 336 -451 385 -733 12 -70 15 -132 11
                      -257 -6 -208 -38 -343 -121 -516 -74 -153 -141 -249 -261 -370 -146 -146 -304
                      -248 -488 -313 l-89 -31 -277 0 c-271 0 -279 1 -321 23 -50 26 -90 90 -90 144
                      l0 33 -380 0 -380 0 0 -362 0 -363 1167 2 c827 2 1180 6 1208 14 93 26 188
                      110 234 208 23 49 26 68 26 161 0 98 -2 110 -32 170 -18 36 -45 78 -61 93
                      l-30 29 59 81 c79 110 179 307 227 448 186 539 109 1131 -207 1600 -176 263
                      -425 479 -706 615 -183 89 -225 77 -340 -97 -68 -103 -71 -107 -100 -100 -16
                      3 -60 6 -97 6 -58 0 -65 2 -57 17 5 9 64 101 130 205 67 103 131 208 142 232
                      26 60 17 121 -26 167 -18 19 -169 122 -336 229 l-303 195 -58 0 c-43 0 -65 -6
                      -91 -23z m672 -1310 c74 -49 86 -135 27 -202 -64 -74 -180 -59 -222 28 -28 61
                      -16 116 36 163 45 41 108 45 159 11z m890 -2442 c63 -33 87 -120 50 -181 -20
                      -33 -75 -64 -113 -64 -31 0 -83 33 -105 66 -37 57 -15 135 50 174 39 24 78 25
                      118 5z"
                        />
                        <path
                          d="M874 2000 c-44 -18 -64 -58 -64 -127 0 -61 2 -67 34 -99 l34 -34 922
                      0 922 0 35 35 c35 35 35 36 31 105 -3 60 -8 74 -31 98 l-27 27 -918 2 c-504 1
                      -927 -2 -938 -7z"
                        />
                        <path
                          d="M1322 655 c-35 -8 -103 -33 -150 -56 -70 -33 -103 -58 -168 -123
                      -120 -120 -182 -247 -199 -409 l-7 -67 1414 0 1415 0 34 23 c66 44 69 59 69
                      370 l0 277 -1172 -1 c-955 0 -1185 -3 -1236 -14z"
                        />
                      </g>
                    </svg>
                  </template>
                  <template v-else>
                    <!-- Imagen del logo -->
                    <img
                      :src="lab.logoPath"
                      alt="Logo del laboratorio"
                      class="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </template>
                </div>
              </template>
              <template #append>
                <span
                  class="inline-block min-w-4 min-h-4 rounded-full m-3 align-middle border-2 border-gray-300"
                  :class="lab.status === 'active' ? 'bg-success' : 'bg-danger'"
                ></span>
              </template>
              <div class="flex flex-col items-start ml-1">
                <span class="text-lg text-left">{{ lab.name }}</span>
                <span class="text-base text-gray-700 font-light"
                  >RIF: {{ formatRif(lab.rif) }}</span
                >
              </div>
            </VaButton>
          </div>
        </component>
      </AnimateBlock>
      <AnimateBlock
        ref="registerLabBlock"
        enter-duration="3s"
        leave-duration="1.5s"
        delay="5s"
        @after-leave="onRegisterLabAfterLeave"
      >
        <!-- Botón para registrar nuevo laboratorio -->
        <VaButton
          class="my-4 py-5 px-4 text-xl font-bold flex items-center justify-center shadow-xl transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95"
          gradient
          color="primary"
          @click="onRegisterLab"
        >
          <template #prepend>
            <!-- Icono de suma  -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8 mr-4 fill-current text-white"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 5v14m-7-7h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
            </svg>
          </template>
          Registrar nuevo laboratorio
        </VaButton>
      </AnimateBlock>
    </div>
  </div>
</template>

<script lang="ts" setup>
  /**
   * SelectLab.vue
   * Vista para seleccionar un laboratorio asociado al usuario.
   * - Lista los laboratorios disponibles desde el store.
   * - Permite seleccionar un laboratorio y actualizar el store.
   * - Permite registrar un nuevo laboratorio.
   * - El diseño es responsivo y usa Vuestic UI + Tailwind.
   */

  import router from '@/router';
  import { useLabStore } from '@/stores/labStore';
  import AnimateBlock from '@/components/AnimateBlock.vue';
  import { computed, ref, onMounted, nextTick, watch } from 'vue';
  import { onBeforeRouteLeave } from 'vue-router';
  import { useBreakpoint, VaButton } from 'vuestic-ui';

  // Store de laboratorios
  const labStore = useLabStore();

  const animatedBlock = ref();
  const registerLabBlock = ref();
  const blocksLeaving = ref(0);
  const pendingRoute = ref<null | { name: string }>(null);
  const nextRoute = ref<null | (() => void)>(null);

  // Breakpoint responsivo (igual que en Login)
  const breakpoint = useBreakpoint();
  const isDesktop = computed(() => breakpoint.mdUp);

  // Refs para scroll dinámico
  const scrollWrapper = ref<HTMLElement | null>(null);
  const gridContent = ref<HTMLElement | null>(null);
  const needsScroll = ref(false);

  /**
   * Verifica si el contenido requiere scroll.
   */
  function checkScroll() {
    nextTick(() => {
      if (scrollWrapper.value && gridContent.value) {
        needsScroll.value =
          gridContent.value.scrollHeight > scrollWrapper.value.clientHeight;
      }
    });
  }

  /**
   * Redirige a la vista de registro de laboratorio.
   */
  function onRegisterLab() {
    router.push('/auth/signup/lab');
  }

  function onAfterLeave() {
    blocksLeaving.value++;
    tryNavigateAfterLeave();
  }

  function onRegisterLabAfterLeave() {
    blocksLeaving.value++;
    tryNavigateAfterLeave();
  }

  function tryNavigateAfterLeave() {
    // Espera a que ambos bloques hayan terminado la animación de salida
    if (blocksLeaving.value < 2) return;
    if (nextRoute.value) {
      nextRoute.value();
      nextRoute.value = null;
    } else if (pendingRoute.value) {
      router.push(pendingRoute.value);
      pendingRoute.value = null;
    }
    blocksLeaving.value = 0; // Resetea el contador para la próxima vez
  }

  onBeforeRouteLeave((to, from, next) => {
    // Si ambos bloques ya están ocultos, permite la navegación
    if (
      !animatedBlock.value?.showAnimate &&
      !registerLabBlock.value?.showAnimate
    ) {
      next();
      return;
    }
    nextRoute.value = next;
    // Oculta ambos bloques
    animatedBlock.value?.hide();
    registerLabBlock.value?.hide();
    // El next() se llamará en onAfterLeave cuando ambos hayan terminado
  });

  /**
   * Selecciona el laboratorio actual en el store.
   * @param lab Laboratorio seleccionado.
   */
  function selectLab(lab: any) {
    labStore.setCurrentLab(lab);
    // Aquí puedes redirigir a la siguiente vista si lo deseas, por ejemplo:
    router.push({ name: 'LoadScreen' });
  }

  /**
   * Formatea el RIF a Letra-numeros-ultimoNumero.
   * @param rif RIF a formatear.
   * @returns RIF formateado.
   */
  function formatRif(rif: string): string {
    // Elimina espacios y guiones
    const clean = rif.replace(/[\s-]/g, '');
    // Extrae la letra inicial (si existe)
    const letterMatch = clean.match(/^[A-Za-z]/);
    const letter = letterMatch ? letterMatch[0].toUpperCase() : 'J';
    // Extrae todos los dígitos
    const digits = clean.replace(/[^0-9]/g, '');
    if (!digits.length) return rif; // Si no hay dígitos, retorna el original

    // Si hay solo 1 dígito, lo pone como último
    if (digits.length === 1) return `${letter}-0-${digits}`;

    // Si hay menos de 9, toma todo menos el último como cuerpo, el último como dígito final
    const cuerpo = digits.length > 1 ? digits.slice(0, -1) : '';
    const ultimo = digits[digits.length - 1];

    return `${letter}-${cuerpo}-${ultimo}`;
  }

  // Verifica scroll al montar y cuando cambian labs o el breakpoint
  onMounted(() => {
    blocksLeaving.value = 0;
    checkScroll();
  });
  watch(() => labStore.labs.length, checkScroll);
  watch(isDesktop, checkScroll);
</script>

<style scoped>
  /* Estilos para el scroll y los botones */
  ::v-deep(.va-button__content) {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 0;
  }

  /* Siempre mostrar la barra de scroll vertical */
  ::v-deep(.va-scroll-container__scroll) {
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: #215a6d #e5e7eb; /* Color de la barra y el fondo */
    overflow-y: scroll !important; /* Siempre mostrar scroll, incluso si no hace falta */
  }

  /* Para navegadores Webkit (Chrome, Safari, Edge) */
  ::v-deep(.va-scroll-container__scroll::-webkit-scrollbar) {
    width: 8px;
    background: #e5e7eb; /* Fondo de la barra */
  }

  ::v-deep(.va-scroll-container__scroll::-webkit-scrollbar-thumb) {
    background: #215a6d; /* Color de la barra */
    border-radius: 4px;
  }
</style>
