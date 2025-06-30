<template>
  <tr class="va-timeline-item">
    <td class="va-timeline-item__icon-cell">
      <div class="va-timeline-item__icon">
        <VaIcon name="schedule" size="22px" color="backgroundBorder" />
      </div>
    </td>
    <td class="va-timeline-item__content-cell">
      <div class="va-timeline-item__content">
        <slot />
      </div>
    </td>
    <td class="va-timeline-item__date-cell">
      <slot name="date">
        {{ $props.date }}
      </slot>
    </td>
  </tr>
</template>
  
<script setup lang="ts">
defineProps({
  date: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
  .va-timeline-item {
    display: table-row;
  }

  .va-timeline-item__icon-cell {
    vertical-align: top;
    height: 1px;
    padding-right: 1rem;
  }

  .va-timeline-item__icon {
    width: 24px;
    position: relative;
    display: inline-flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .va-timeline-item__icon::after {
    content: '';
    width: 2px;
    height: 100%;
    background: var(--va-background-border);
  }

  .va-timeline-item__content {
    margin-bottom: 1rem;
  }

  .va-timeline-item__content-cell {
    width: 100%;
  }

  .va-timeline-item__date-cell {
    vertical-align: top;
    color: var(--va-secondary);
    text-wrap: nowrap;
    white-space: nowrap;
    padding-left: 0.5rem;
    text-align: end;
  }

  .va-timeline-item:last-child .va-timeline-item__icon::after {
    background: transparent;
  }
</style>