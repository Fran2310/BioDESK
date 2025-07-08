<template>
  <div
    class="relative flex items-center justify-center min-h-screen w-screen overflow-hidden"
  >
    <!-- Fondo animado gradiente -->
    <div
      class="absolute inset-0 z-0 transition-all duration-1000"
      :class="[
        isLeaving
          ? 'bg-[#f2f0eb] opacity-100'
          : 'animate-gradient-move bg-gradient-to-br from-primary via-secondary to-primary brightness-125 opacity-90',
      ]"
    />

    <!-- Contenido centrado -->
    <div
      class="relative z-10 transition-all duration-700 w-full max-w-[80vw] sm:max-w-[400px] md:max-w-[600px] lg:max-w-[800px] flex flex-col items-center gap-4 px-4"
      :class="isLeaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'"
    >
      <!-- Componente animado del logo con altura responsiva -->
      <LogoAnimate :height="logoHeight" />
      <VaProgressBar indeterminate />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useWindowSize } from '@vueuse/core'; // 🆕 Hook de VueUse para tamaño de ventana
  import { useUserRole } from '@/composables/getBannerData';
  import LogoAnimate from '@/components/icons/LogoAnimate.vue';

  const router = useRouter();
  const isLeaving = ref(false);

  // 🆕 Hook reactivo que da el ancho actual del viewport
  const { width } = useWindowSize();

  // 🆕 Computed para definir la altura del logo según resolución
  const logoHeight = computed(() => {
    if (width.value >= 2560) return '50rem'; // 4K
    if (width.value >= 1440) return '15rem'; // Desktop
    if (width.value >= 768) return '10rem'; // Tablet
    return '7rem'; // Mobile
  });

  // ⚙️ Simula precarga de recursos y chunks
  const preloadAppChunks = () => {
    return Promise.all([
      import('@/views/home/HomeView.vue'),
      // Agrega más si necesitas
    ]);
  };

  // ⏱ Función para esperar un tiempo mínimo (mínimo visible de splash)
  const waitMinTime = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  //    Cargar la info para el banner
  const { loadUserRole } = useUserRole();

  // 🧠 Cuando el componente se monta, inicia precarga + espera
  onMounted(async () => {
    await Promise.all([preloadAppChunks(), loadUserRole(), waitMinTime(6000)]);
    isLeaving.value = true; // 🔁 Inicia transición de salida
    setTimeout(() => {
      router.push({ name: 'HomeView' }); // ✅ Redirige cuando termina la animación
    }, 1300);
  });
</script>

<style scoped>
  /*  Animación de gradiente de fondo */
  @keyframes gradient-move {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .animate-gradient-move {
    background-size: 200% 200%;
    animation: gradient-move 6s ease-in-out infinite;
  }

  /* 🎨 Gradiente personalizado compatible con Tailwind (opcional si usas variables) */
  .bg-gradient-to-br {
    background-image: linear-gradient(
      135deg,
      var(--va-primary, #215a6d),
      var(--va-secondary-light, #92c7a3),
      var(--va-primary-light, #215a6d)
    );
  }
</style>
