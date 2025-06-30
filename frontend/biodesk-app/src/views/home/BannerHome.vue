<template>
  <div class="flex justify-center banner">
    <Logo/>

    <!-- Línea vertical -->
    <div class="vl"></div>

    <div class="lab-details">
      <!-- Nombre del lab -->
      <transition name="fade">
        <p class="text-5xl text-details">{{ props.labName }}</p>
      </transition>
      
      <!-- Rol del usuario -->
      <p class="text-3xl text-details">{{ props.role }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { defineProps } from 'vue';
  import Logo from '@/components/icons/Logo.vue';

  const props = defineProps<{
    labName?: string;
    role?: string;
  }>();
</script>

<style>
  .banner {
    display: flex;
    flex-direction: row;
    height: 10em;
    margin-top: 2em;
    margin-bottom: 5em;
    align-items: center;
    justify-content: center;
    justify-items: center;
  }

  .vl {
    /* Línea vertical */
    height: 10em;
    border-left: 6px solid var(--va-primary);
    margin-left: 30px;
    margin-right: 40px;
  }

  .lab-details {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: left;
    gap: 2em;
  }

  .text-details {
    color: var(--va-primary);
    justify-items: left;
  }

  /* Fade transition */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.8s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
