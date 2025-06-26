<template>
  <span class="logo-wrapper mb-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :height="height"
      viewBox="0 0 489.24 224.58"
      class="logo-animated"
    >
      <!-- PATH 1 - Contorno -->
      <path
        class="stroke-path path1"
        :stroke="color || '#3ca2a2'"
        fill="none"
        stroke-width="1"
        d="M56.62,98.44C61.69,101.53,67,105,72.37,108.85c7.63,5.45,14.45,10.93,20.48,16.22q1.44,25.65,2.11,52.47.3,12.35.41,24.43c1.79-.15,33.45-3.18,38.92-21,2.85-9.3-2.29-19.7-15.88-35.47C103,127.64,75.22,101,27,78.16c99.18,25.32,153.08,83,145,118.41-6.58,29-56.15,49.25-113.37,54Z"
        transform="translate(-26.99 -25.97)"
      />
      <!-- PATH 1 - Relleno -->
      <path
        class="fill-path fill1"
        stroke="none"
        :fill="color || '#3ca2a2'"
        fill-opacity="0"
        d="M56.62,98.44C61.69,101.53,67,105,72.37,108.85c7.63,5.45,14.45,10.93,20.48,16.22q1.44,25.65,2.11,52.47.3,12.35.41,24.43c1.79-.15,33.45-3.18,38.92-21,2.85-9.3-2.29-19.7-15.88-35.47C103,127.64,75.22,101,27,78.16c99.18,25.32,153.08,83,145,118.41-6.58,29-56.15,49.25-113.37,54Z"
        transform="translate(-26.99 -25.97)"
      />

      <!-- PATH 2 - Contorno -->
      <path
        class="stroke-path path2"
        :stroke="color || '#215a6d'"
        fill="none"
        stroke-width="1"
        d="M56.86,26c.69.83,9.62,11.2,23,9.6A25.94,25.94,0,0,0,96,26.93Q94.64,45.25,94.11,65.2q-.44,18.36-.06,35.39c-5.12-2.85-10.86-5.75-17.21-8.51A192.76,192.76,0,0,0,57.4,84.82q0-9.84,0-19.8Q57.31,45.25,56.86,26Z"
        transform="translate(-26.99 -25.97)"
      />
      <!-- PATH 2 - Relleno -->
      <path
        class="fill-path fill2"
        stroke="none"
        :fill="color || '#215a6d'"
        fill-opacity="0"
        d="M56.86,26c.69.83,9.62,11.2,23,9.6A25.94,25.94,0,0,0,96,26.93Q94.64,45.25,94.11,65.2q-.44,18.36-.06,35.39c-5.12-2.85-10.86-5.75-17.21-8.51A192.76,192.76,0,0,0,57.4,84.82q0-9.84,0-19.8Q57.31,45.25,56.86,26Z"
        transform="translate(-26.99 -25.97)"
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
