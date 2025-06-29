<script setup lang="ts">
import { type PropType } from 'vue'
import { type User } from '../types'

const avatarColor = (userName: string) => {
  const colors = ['primary', '#FFD43A', '#ADFF00', '#262824', 'danger']
  const index = userName.charCodeAt(0) % colors.length
  return colors[index]
}

defineProps({
  user: {
    type: Object as PropType<User>,
    required: true,
  },
  size: {
    type: String,
    default: 'medium',
  },
})

const isUrl = (avatar: string) => {
  if (!avatar) return false

  return avatar.startsWith('http') || avatar.startsWith('blob:')
}

const fallback = (fullname: string) => {
  try {
    // Remove leading/trailing spaces, replace multiple spaces with a single space, then split
    const cleaned = fullname.trim().replace(/\s+/g, ' ')
    const names = cleaned.split(' ')
    if (names.length === 0) return ''
    if (names.length === 1) return names[0][0]
    return `${names[0][0]}${names[1][0]}`
  } catch {
    return fullname[0] || ''
  }
}
</script>

<template>
  <VaAvatar
    :size="size"
    :src="isUrl(user.avatar) ? user.avatar : ''"
    :fallback-text="fallback(user.fullname)"
    :color="avatarColor(user.fullname)"
  />
</template>
