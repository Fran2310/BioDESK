<template>
  <span class="logo-wrapper mb-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :height="height"
      viewBox="0 0 489.25 229.59"
      class="logo-animated"
    >
      <!-- PATH 1 - Contorno -->
      <path
        class="stroke-path path1"
        :stroke="color || '#3ca2a2'"
        fill="none"
        stroke-width="3"
        d="M29.71,82.79c7.66,3.89,16.36,9.14,25.25,16.24,4.16,3.32,7.87,6.65,11.18,9.89.83,15.55,1.45,31.44,1.84,47.65.2,8.23.34,16.37.41,24.43,1.51-.11,32.69-2.69,38.92-21.04,2-5.88,2.33-16.02-15.18-37.87C78.44,105,51.22,77.48,0,57.19c99.18,25.32,153.08,82.99,145.04,118.41-6.58,29.03-56.16,49.25-113.37,53.99-.64-48.93-1.3-97.87-1.96-146.8Z"
      />
      <!-- PATH 1 - Relleno -->
      <path
        class="fill-path fill1"
        stroke="none"
        :fill="color || '#3ca2a2'"
        fill-opacity="0"
        d="M29.71,82.79c7.66,3.89,16.36,9.14,25.25,16.24,4.16,3.32,7.87,6.65,11.18,9.89.83,15.55,1.45,31.44,1.84,47.65.2,8.23.34,16.37.41,24.43,1.51-.11,32.69-2.69,38.92-21.04,2-5.88,2.33-16.02-15.18-37.87C78.44,105,51.22,77.48,0,57.19c99.18,25.32,153.08,82.99,145.04,118.41-6.58,29.03-56.16,49.25-113.37,53.99-.64-48.93-1.3-97.87-1.96-146.8Z"
      />

      <!-- PATH 2 - Contorno -->
      <path
        class="stroke-path path2"
        :stroke="color || '#215a6d'"
        fill="none"
        stroke-width="3"
        d="M29.88,0c.69.83,9.62,11.2,23.03,9.6,9.08-1.08,14.62-6.98,16.08-8.64-.89,12.21-1.54,24.98-1.86,38.27-.28,11.71-.3,23.02-.09,33.91-4.84-2-9.75-3.98-14.74-5.95-7.39-2.92-14.69-5.69-21.88-8.34.03-6.55.03-13.15,0-19.8-.06-13.18-.24-26.2-.54-39.05Z"
      />
      <!-- PATH 2 - Relleno -->
      <path
        class="fill-path fill2"
        stroke="none"
        :fill="color || '#215a6d'"
        fill-opacity="0"
        d="M29.88,0c.69.83,9.62,11.2,23.03,9.6,9.08-1.08,14.62-6.98,16.08-8.64-.89,12.21-1.54,24.98-1.86,38.27-.28,11.71-.3,23.02-.09,33.91-4.84-2-9.75-3.98-14.74-5.95-7.39-2.92-14.69-5.69-21.88-8.34.03-6.55.03-13.15,0-19.8-.06-13.18-.24-26.2-.54-39.05Z"
      />

      <!-- Texto -->
      <text
        x="156.7"
        y="173.08"
        font-size="87"
        font-family="Candara"
        class="logo-text"
        :fill="color || '#215a6d'"
      >
        BIODESK
      </text>
    </svg>
  </span>
</template>

<script setup lang="ts">
  defineProps({
    height: {
      type: String,
      default: '9rem',
    },
    color: {
      type: String,
      default: null,
    },
  });
</script>

<style scoped>
  .logo-wrapper {
    display: inline-block;
    opacity: 0;
    animation: fadeIn 0.5s ease-in forwards;
    animation-delay: 0.2s;
  }

  .logo-animated {
    display: block;
  }

  .stroke-path {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: draw 2s ease forwards;
  }

  .path2 {
    animation-delay: 0.3s;
  }

  .fill-path {
    animation: fillIn 0.5s ease forwards;
    animation-delay: 2s;
  }

  .logo-text {
    opacity: 0;
    animation: fadeText 1s ease forwards;
    animation-delay: 2.5s;
  }

  /* Keyframes */
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes fillIn {
    to {
      fill-opacity: 1;
    }
  }

  @keyframes fadeText {
    to {
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
</style>
