<template>
  <VaLayout v-if="breakpoint.lgUp" class="h-screen bg-[var(--va-background-secondary)]">
    <template #left>
      <RouterLink
        class="bg-tertiary h-full flex items-center justify-center"
        style="width: 35vw"
        to="login"
        aria-label="Visit homepage"
      >
        

      <BiodeskLogo/>

      </RouterLink>
    </template>
    <template #content>
      <main class="h-full flex items-center justify-center mx-auto max-w-[600px]">
        <RouterView />
      </main>
    </template>
  </VaLayout>

  <VaLayout v-else class="h-screen bg-[var(--va-background-secondary)]">
    <template #content>
      <div class="p-4">
        <main class="h-full flex flex-row items-center justify-start mx-auto max-w-[420px]">
          <div class="flex flex-col items-start">
            <RouterLink class="py-4" to="login" aria-label="Visit homepage">
              
               <BiodeskLogo/>

            </RouterLink>
            <RouterView />
          </div>
        </main>
      </div>
    </template>
  </VaLayout>
</template>

<script lang="ts" setup>
import { useBreakpoint } from 'vuestic-ui'

import BiodeskLogo from '../components/Biodesk-logo.vue';

const breakpoint = useBreakpoint()
</script>

