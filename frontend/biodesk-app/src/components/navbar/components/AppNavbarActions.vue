<template>
  <div class="app-navbar-actions">
    <NotificationDropdown class="app-navbar-actions__item" />
    <ProfileDropdown
      class="app-navbar-actions__item app-navbar-actions__item--profile mr-1"
    />
  </div>
</template>

<script lang="ts" setup>
  import ProfileDropdown from './dropdowns/ProfileDropdown.vue';
  import NotificationDropdown from './dropdowns/NotificationDropdown.vue';

  defineProps({
    isMobile: { type: Boolean, default: false },
  });
</script>

<style scoped>
  .app-navbar-actions {
    display: flex;
    align-items: center;
  }

  .app-navbar-actions .va-dropdown__anchor {
    color: var(--va-primary);
    fill: var(--va-primary);
  }

  .app-navbar-actions__item {
    padding: 0;
    margin-left: 0.25rem;
    margin-right: 0.25rem;
  }

  .app-navbar-actions__item svg {
    height: 20px;
  }

  .app-navbar-actions__item--profile {
    display: flex;
    justify-content: center;
  }

  .app-navbar-actions__item .va-dropdown-content {
    background-color: var(--va-white);
  }

  @media screen and (max-width: 640px) {
    .app-navbar-actions__item {
      margin-left: 0;
      margin-right: 0;
    }
    .app-navbar-actions__item:first-of-type {
      margin-left: 0;
    }
  }
</style>
