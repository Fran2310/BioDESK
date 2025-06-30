 <template>
  <img :src="logoSrc" :style="{height: '9em'}" alt="BioDESK logo" />
</template>

<script lang="ts" setup>
  import { withDefaults, defineProps } from 'vue'

  const { logoSrc } = withDefaults(
    defineProps<{
      logoSrc?: string
    }>(),
    {
      logoSrc: '/BioDESK-logo.webp', // default logo src
    },
  )
</script>