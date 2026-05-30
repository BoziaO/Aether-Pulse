<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '@/types/message.types'
import UserAvatar from '@/components/profile/UserAvatar.vue'

const props = defineProps<{
  message: Message
  isOwn?: boolean
  showAvatar?: boolean
}>()

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="message" :class="{ own: isOwn }">
    <div v-if="showAvatar !== false" class="message-avatar">
      <UserAvatar :user="(message.user as any)" :size="32" />
    </div>
    <div class="message-content">
      <div v-if="showAvatar !== false" class="message-meta">
        <span class="message-author">{{ message.user?.displayName || 'Unknown' }}</span>
        <span class="message-time">{{ formatTime(message.createdAt) }}</span>
      </div>
      <div class="message-bubble">{{ message.content }}</div>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 16px;
  border-radius: 4px;
  transition: background 0.1s;
}
.message:hover { background: rgba(255,255,255,0.02); }
.message-avatar { flex-shrink: 0; margin-top: 2px; }
.message-content { flex: 1; min-width: 0; }
.message-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}
.message-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.message-time {
  font-size: 11px;
  color: var(--text-muted);
}
.message-bubble {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}
</style>
