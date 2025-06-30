<template>
  <!-- Sustituye el bloque <VaVirtualScroller ...> por esto -->
  <VaInfiniteScroll
    :items="logs"
    :item-size="LOG_HEIGHT"
    :load="fetchLogs"
    :has-more="logs.length < total"
    :height="MAX_SCROLLER_HEIGHT"
    class="space-y-2"
  >
    <template #default="{ item: log }">
      <div
        :key="log.id"
        class="flex items-start gap-3 bg-white rounded shadow-sm p-3 hover:bg-gray-50 transition"
        style="height: 75px"
      >
        <!-- Icono, contenido y fecha igual que antes -->
        <VaIcon
          :name="iconForAction(log.action)"
          size="20px"
          :color="colorForAction(log.action)"
          class="mt-1 shrink-0"
        />
        <div class="flex-1">
          <p class="text-sm text-gray-700">
            <span
              :class="colorClassForAction(log.action)"
              class="font-semibold capitalize"
            >
              {{ actionLabel(log.action) }}
            </span>
            en
            <span class="font-medium">{{ log.entity }}</span>
          </p>
          <p class="text-xs text-gray-500">{{ log.details }}</p>
        </div>
        <div
          class="text-xs text-gray-400 text-right whitespace-nowrap shrink-0"
        >
          {{ relativeTime(log.madeAt) }}
          <div class="text-gray-500">
            {{ log.performedBy?.name ?? 'Sistema' }}
            {{ log.performedBy?.lastName ?? '' }}
          </div>
        </div>
      </div>
    </template>
  </VaInfiniteScroll>
</template>
