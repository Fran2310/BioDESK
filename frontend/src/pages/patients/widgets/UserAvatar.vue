<script setup lang="ts">
import { computed } from 'vue'
import { type PropType } from 'vue'
import { type User } from '../types'

const props = defineProps({
  user: {
    type: Object as PropType<User>,
    required: true,
  },
  size: {
    type: String,
    default: 'medium',
  },
})

// Compute fullname
const fullname = computed(() => {
  return `${props.user.name} ${props.user.lastName}`.trim()
})

// Check if avatar is valid
const hasAvatar = computed(() => {
  return !!props.user.avatar
})

// Avatar color logic
const avatarColor = (userName: string | undefined): string => {
  if (!userName || typeof userName !== 'string' || userName.trim() === '') {
    return 'primary' // default color
  }

  const colors = ['primary', '#FFD43A', '#ADFF00', '#262824', 'danger']
  const safeName = userName.trim()
  const index = safeName.charCodeAt(0) % colors.length
  return colors[index]
}

// Fallback text logic
const fallback = (fullname: string | undefined): string => {
  if (!fullname || typeof fullname !== 'string' || fullname.trim() === '') {
    return '?'
  }

  const parts = fullname.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`
  } else {
    return parts[0][0]
  }
}
</script>

<template>
  <VaAvatar
    :size="size"
    :src="hasAvatar.value && isUrl(props.user.avatar) ? props.user.avatar : ''"
    :fallback-text="fallback(fullname.value)"
    :color="avatarColor(fullname.value)"
  />
</template>