<template>
  <VaDropdown
    :offset="[13, 0]"
    class="notification-dropdown"
    stick-to-edges
    :close-on-content-click="false"
  >
    <template #anchor>
      <VaButton preset="secondary" color="textPrimary">
        <VaBadge overlap>
          <VaIconNotification
            color="#ffffff"
            class="notification-dropdown__icon"
          />
        </VaBadge>
      </VaButton>
    </template>
    <VaDropdownContent class="h-full sm:max-w-[450px] sm:h-auto">
      <TimelineCard class="w-full md:w-[430px]" :title="'Notificaciones'" />
    </VaDropdownContent>
  </VaDropdown>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import VaIconNotification from '../../../icons/VaIconNotification.vue';
  import TimelineCard from '@/views/dashboard/cards/TimelineCard.vue';

  const { t, locale } = useI18n();

  const baseNumberOfVisibleNotifications = 4;
  const rtf = new Intl.RelativeTimeFormat(locale.value, { style: 'short' });
  const displayAllNotifications = ref(false);

  interface INotification {
    message: string;
    icon: string;
    id: number;
    separator?: boolean;
    updateTimestamp: Date;
  }

  const makeDateFromNow = (timeFromNow: number) => {
    const date = new Date();
    date.setTime(date.getTime() + timeFromNow);
    return date;
  };

  const notifications: INotification[] = [
    {
      message: '4 pending requests',
      icon: 'favorite_outline',
      id: 1,
      separator: true,
      updateTimestamp: makeDateFromNow(-3 * 60 * 1000),
    },
    {
      message: '3 new reports',
      icon: 'calendar_today',
      id: 2,
      separator: true,
      updateTimestamp: makeDateFromNow(-12 * 60 * 60 * 1000),
    },
    {
      message: 'Whoops! Your trial period has expired.',
      icon: 'error_outline',
      id: 3,
      separator: true,
      updateTimestamp: makeDateFromNow(-2 * 24 * 60 * 60 * 1000),
    },
    {
      message:
        'It looks like your timezone is set incorrectly, please change it to avoid issues with Memory.',
      icon: 'schedule',
      id: 4,
      updateTimestamp: makeDateFromNow(-2 * 7 * 24 * 60 * 60 * 1000),
    },
    {
      message: '2 new team members added',
      icon: 'group_add',
      id: 5,
      separator: false,
      updateTimestamp: makeDateFromNow(-3 * 60 * 1000),
    },
    {
      message: 'Monthly budget exceeded by 10%',
      icon: 'trending_up',
      id: 6,
      separator: true,
      updateTimestamp: makeDateFromNow(-3 * 24 * 60 * 60 * 1000),
    },
    {
      message: '7 tasks are approaching their deadlines',
      icon: 'alarm',
      id: 7,
      separator: false,
      updateTimestamp: makeDateFromNow(-5 * 60 * 60 * 1000),
    },
    {
      message: 'New software update available',
      icon: 'system_update',
      id: 8,
      separator: true,
      updateTimestamp: makeDateFromNow(-1 * 24 * 60 * 60 * 1000),
    },
  ].sort(
    (a, b) =>
      new Date(b.updateTimestamp).getTime() -
      new Date(a.updateTimestamp).getTime()
  );

  const TIME_NAMES = {
    second: 1000,
    minute: 1000 * 60,
    hour: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24,
    week: 1000 * 60 * 60 * 24 * 7,
    month: 1000 * 60 * 60 * 24 * 30,
    year: 1000 * 60 * 60 * 24 * 365,
  };

  const getTimeName = (differenceTime: number) => {
    return Object.keys(TIME_NAMES).reduce(
      (acc, key) =>
        TIME_NAMES[key as keyof typeof TIME_NAMES] < differenceTime ? key : acc,
      'month'
    ) as keyof typeof TIME_NAMES;
  };

  const notificationsWithRelativeTime = computed(() => {
    const list = displayAllNotifications.value
      ? notifications
      : notifications.slice(0, baseNumberOfVisibleNotifications);

    return list.map((item, index) => {
      const timeDifference = Math.round(
        new Date().getTime() - new Date(item.updateTimestamp).getTime()
      );
      const timeName = getTimeName(timeDifference);

      let separator = false;

      const nextItem = list[index + 1];
      if (nextItem) {
        const nextItemDifference = Math.round(
          new Date().getTime() - new Date(nextItem.updateTimestamp).getTime()
        );
        const nextItemTimeName = getTimeName(nextItemDifference);

        if (timeName !== nextItemTimeName) {
          separator = true;
        }
      }

      return {
        ...item,
        updateTimestamp: rtf.format(
          -1 * Math.round(timeDifference / TIME_NAMES[timeName]),
          timeName
        ),
        separator,
      };
    });
  });
</script>

<style scoped>
  .notification-dropdown {
    cursor: pointer;
  }

  .notification-dropdown__icon {
    position: relative;
    display: flex;
    align-items: center;
    width: 24px;
  }

  .va-dropdown__anchor {
    display: inline-block;
  }
</style>
