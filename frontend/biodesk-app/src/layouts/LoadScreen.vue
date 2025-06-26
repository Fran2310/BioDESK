<template>
  <div
    class="relative flex items-center justify-center min-h-screen w-full overflow-hidden"
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
      class="relative z-10 transition-all duration-700"
      :class="isLeaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'"
    >
      <LogoAnimate height="15rem"></LogoAnimate>
      <VaProgressBar indeterminate />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import LogoAnimate from '@/components/LogoAnimate.vue';

  const router = useRouter();
  const isLeaving = ref(false);

  const preloadAppChunks = () => {
    return Promise.all([
      import('@/views/home/HomeView.vue'),
      // Agrega más si necesitas
    ]);
  };

  const waitMinTime = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  onMounted(async () => {
    await Promise.all([preloadAppChunks(), waitMinTime(6000)]);
    isLeaving.value = true; // Activar salida
    setTimeout(() => {
      router.push({ name: 'HomeView' });
    }, 1300); // Esperar a que fondo y logo se desvanezcan
  });
</script>

<style scoped>
  /* Animación de gradiente */
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

  .bg-gradient-to-br {
    background-image: linear-gradient(
      135deg,
      var(--va-primary, #215a6d),
      var(--va-secondary-light, #92c7a3),
      var(--va-primary-light, #215a6d)
    );
  }
</style>
