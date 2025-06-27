 
<template>
  <img :src="logoSrc" :style="{height: '9em'}" alt="Biodesk Admin" />
</template>

<script lang="ts" setup>
  import { withDefaults, defineProps } from 'vue'

  const props = withDefaults(
    defineProps<{
      logoSrc?: string
    }>(),
    {
      logoSrc: '/BioDesk-logo.png', // default logo src
    },
  )
</script>
