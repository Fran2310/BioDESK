<template>
  <div class="profile-dropdown-wrapper">
    <VaDropdown
      v-model="isShown"
      :offset="[9, 0]"
      class="profile-dropdown"
      stick-to-edges
    >
      <template #anchor>
        <VaButton
          size="medium"
          preset="secondary"
          color="textPrimary"
          round
          class="h-full"
        >
          <span class="profile-dropdown__anchor min-w-max">
            <slot />
            <VaAvatar icon="person" class="w-full"></VaAvatar>
          </span>
        </VaButton>
      </template>
      <VaDropdownContent
        class="profile-dropdown__content md:w-60 px-0 py-4 w-full"
        :style="{ '--hover-color': hoverColor }"
      >
        <VaList v-for="group in options" :key="group.name">
          <header
            v-if="group.name"
            class="uppercase text-[var(--va-secondary)] opacity-80 font-bold text-xs px-4"
          >
            {{ t(`user.${group.name}`) }}
          </header>
          <VaListItem
            v-for="item in group.list"
            :key="item.name"
            class="menu-item px-4 text-base cursor-pointer h-8"
            v-bind="resolveLinkAttribute(item)"
          >
            <VaIcon :name="item.icon" class="pr-1" color="secondary" />
            {{ t(`user.${item.name}`) }}
          </VaListItem>
          <VaListSeparator v-if="group.separator" class="mx-3 my-2" />
        </VaList>
      </VaDropdownContent>
    </VaDropdown>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useColors } from 'vuestic-ui';

  const { colors, setHSLAColor } = useColors();
  const hoverColor = computed(() => setHSLAColor(colors.focus, { a: 0.1 }));

  const { t } = useI18n();

  type ProfileListItem = {
    name: string;
    to?: string;
    href?: string;
    icon: string;
  };

  type ProfileOptions = {
    name: string;
    separator: boolean;
    list: ProfileListItem[];
  };

  withDefaults(
    defineProps<{
      options?: ProfileOptions[];
    }>(),
    {
      options: () => [
        {
          name: 'account',
          separator: true,
          list: [
            {
              name: 'profile',
              to: 'ProfileUserView',
              icon: 'account_circle',
            },
            {
              name: 'settings',
              to: 'Settings',
              icon: 'settings',
            },
          ],
        },
        {
          name: '',
          separator: false,
          list: [
            {
              name: 'select-lab',
              to: 'SelectLab',
              icon: 'science',
            },
            {
              name: 'logout',
              to: 'Login',
              icon: 'logout',
            },
          ],
        },
      ],
    }
  );

  const isShown = ref(false);

  const resolveLinkAttribute = (item: ProfileListItem) => {
    return item.to
      ? { to: { name: item.to } }
      : item.href
      ? { href: item.href, target: '_blank' }
      : {};
  };
</script>

<style scoped>
  .profile-dropdown {
    cursor: pointer;
  }

  ::v-deep(.va-avatar:hover) {
    background: var(--hover-color);
  }

  .profile-dropdown__anchor {
    display: inline-block;
  }

  ::v-deep(.va-icon.material-icons) {
    font-size: 28px !important;
    color: var(--va-base);
  }
</style>
