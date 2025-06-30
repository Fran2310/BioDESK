<template>
  <VaNavbar class="app-layout-navbar py-0 px-0 bg-primary" color="primary">
    <template #left>
      <div class="left">
        <Transition v-if="isMobile" name="icon-fade" mode="out-in">
          <VaIcon
            color="base"
            :name="isSidebarMinimized ? 'menu' : 'close'"
            size="32px"
            @click="isSidebarMinimized = !isSidebarMinimized"
          />
        </Transition>

        <Logo :height="'3.5em'" :color="'#ffffff'" />
      </div>
    </template>
    <template #right>
      <AppNavbarActions class="app-navbar__actions" :is-mobile="isMobile" />
    </template>
  </VaNavbar>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { useGlobalStore } from '../../stores/global-store';
  import AppNavbarActions from './components/AppNavbarActions.vue';
  import Logo from '../icons/Logo.vue';

  defineProps({
    isMobile: { type: Boolean, default: false },
  });

  const GlobalStore = useGlobalStore();

  const { isSidebarMinimized } = storeToRefs(GlobalStore);
</script>

<style scoped>
  .va-navbar {
    z-index: 2;
  }
  @media screen and (max-width: 950px) {
    .left {
      width: 100%;
    }

    .app-navbar__actions {
      display: flex;
      justify-content: space-between;
    }
  }

  .left {
    display: flex;
    align-items: center;
    margin-left: 1rem;
  }

  .icon-fade-enter-active,
  .icon-fade-leave-active {
    transition: transform 1s ease;
  }

  .icon-fade-enter,
  .icon-fade-leave-to {
    transform: scale(0.5);
  }
</style>
