/* ThemeSwitcher.vue * Idea: integrarlo para que funciones junto con dark: de
tailwind y el preset de Vuestic. * [NO FUNCIONA] */
<template>
  <VaSwitch
    v-model="theme"
    color="#5123a1"
    off-color="#ffd300"
    style="--va-switch-checker-background-color: #252723"
    class="theme-switcher"
  >
    <template #innerLabel>
      <div class="va-text-center">
        <VaIcon :name="theme ? 'dark_mode' : 'light_mode'" />
      </div>
    </template>
  </VaSwitch>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import { useColors } from 'vuestic-ui';

  const { applyPreset, currentPresetName } = useColors();
  const theme = computed({
    get() {
      return currentPresetName.value;
    },
    set(value) {
      applyPreset(value);
    },
  });
</script>
<style scoped>
  .theme-switcher {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 1000; /* Asegura que el switch esté por encima de otros elementos */
  }
</style>
