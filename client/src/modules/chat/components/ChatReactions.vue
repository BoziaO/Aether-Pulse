<script setup lang="ts">
  import type { Reaction } from '../types/message.types'
  import { useAuthStore } from '@/stores/auth.store'

  const props = defineProps<{
    reactions: Reaction[]
    messageId: string
    onReact: (messageId: string, emoji: string) => void
  }>()

  const authStore = useAuthStore()

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  function hasReacted(reaction: Reaction): boolean {
    return authStore.user ? reaction.userIds.includes(authStore.user.id) : false
  }

  function handleToggle(emoji: string): void {
    props.onReact(props.messageId, emoji)
  }
</script>

<template>
  <div v-if="reactions.length > 0" class="reactions-row">
    <button
      v-for="reaction in reactions"
      :key="reaction.emoji"
      :class="['reaction-chip', { reacted: hasReacted(reaction) }]"
      :aria-label="`${reaction.emoji} — ${reaction.count} ${reaction.count === 1 ? 'reaction' : 'reactions'}`"
      @click="handleToggle(reaction.emoji)"
    >
      <span class="reaction-emoji">{{ reaction.emoji }}</span>
      <span class="reaction-count">{{ reaction.count }}</span>
    </button>

    <div class="quick-react">
      <button
        v-for="emoji in QUICK_EMOJIS"
        :key="emoji"
        class="quick-emoji"
        :aria-label="`React with ${emoji}`"
        @click="handleToggle(emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>

  <div v-else class="hover-reactions">
    <button
      v-for="emoji in QUICK_EMOJIS"
      :key="emoji"
      class="quick-emoji"
      :aria-label="`React with ${emoji}`"
      @click="handleToggle(emoji)"
    >
      {{ emoji }}
    </button>
  </div>
</template>

<style scoped>
.reactions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  align-items: center;
}
.reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}
.reaction-chip:hover {
  border-color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.08);
}
.reaction-chip.reacted {
  border-color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.12);
}
.reaction-emoji {
  font-size: 14px;
  line-height: 1;
}
.reaction-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}
.reaction-chip.reacted .reaction-count {
  color: var(--accent-violet);
}
.quick-react,
.hover-reactions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.reactions-row:hover .quick-react {
  opacity: 1;
}
.quick-emoji {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 2px;
  border-radius: 4px;
  line-height: 1;
  transition: transform 0.1s ease;
}
.quick-emoji:hover {
  transform: scale(1.2);
}
</style>
