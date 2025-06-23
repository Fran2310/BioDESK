<!--
  Logo.vue
  Componente para mostrar el logo SVG de BioDESK.
  Props:
    - height (String, opcional): Altura del logo (por defecto '9rem').
    - color (String, opcional): Color para sobrescribir el color de los elementos SVG. Si no se especifica, se usan los colores originales del logo.
  Uso:
    <Logo :height="'6rem'" :color="'#3ca2a2'" />
    <Logo />
-->
<template>
  <span class="w-auto">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :height="height"
      viewBox="0 0 489.24 224.58"
    >
      <path
        :fill="color || '#3ca2a2'"
        d="M56.62,98.44C61.69,101.53,67,105,72.37,108.85c7.63,5.45,14.45,10.93,20.48,16.22q1.44,25.65,2.11,52.47.3,12.35.41,24.43c1.79-.15,33.45-3.18,38.92-21,2.85-9.3-2.29-19.7-15.88-35.47C103,127.64,75.22,101,27,78.16c99.18,25.32,153.08,83,145,118.41-6.58,29-56.15,49.25-113.37,54Z"
        transform="translate(-26.99 -25.97)"
      />
      <path
        :fill="color || '#215a6d'"
        d="M56.86,26c.69.83,9.62,11.2,23,9.6A25.94,25.94,0,0,0,96,26.93Q94.64,45.25,94.11,65.2q-.44,18.36-.06,35.39c-5.12-2.85-10.86-5.75-17.21-8.51A192.76,192.76,0,0,0,57.4,84.82q0-9.84,0-19.8Q57.31,45.25,56.86,26Z"
        transform="translate(-26.99 -25.97)"
      />
      <text
        x="156.7"
        y="173.08"
        font-size="87"
        font-family="Candara"
        :fill="color || '#215a6d'"
      >
        BIODESK
      </text>
    </svg>
  </span>
</template>

<script setup lang="ts">
  // Props:
  //   height: Altura del logo (por defecto '9rem').
  //   color: Color para sobrescribir el color del SVG (opcional).
  defineProps({
    height: {
      type: String,
      default: '9rem',
    },
    color: {
      type: String,
      default: null, // No cambia el color por defecto
    },
  });
</script>

<style scoped>
  /* El span actúa como contenedor flexible para el SVG */
  .span {
    display: inline-block;
  }
</style>
