<script setup lang="ts">
  import { ref, computed } from 'vue'
  import EmojiPicker from './EmojiPicker.vue'
  import { QUICK_REACTIONS } from '@/utils/text-formatter'

  export interface Reaction {
    emoji: string
    users: { id: string; username: string }[]
    count: number
  }

  const props = defineProps<{
    reactions: Reaction[]
    currentUserId: string
  }>()

  const emit = defineEmits<{
    (e: 'add', emoji: string): void
    (e: 'remove', emoji: string): void
  }>()

  const showPicker = ref(false)

  const groupedReactions = computed(() => {
    return props.reactions
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
  })

  function hasReacted(reaction: Reaction): boolean {
    return reaction.users.some((u) => u.id === props.currentUserId)
  }

  function toggleReaction(emoji: string) {
    const existing = props.reactions.find((r) => r.emoji === emoji)
    if (existing && hasReacted(existing)) {
      emit('remove', emoji)
    } else {
      emit('add', emoji)
    }
    showPicker.value = false
  }

  function getReactionTooltip(reaction: Reaction): string {
    const names = reaction.users.map((u) => u.username)
    if (names.length <= 3) {
      return names.join(', ') + ' reacted with ' + reaction.emoji
    }
    return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more reacted with ${reaction.emoji}`
  }
</script>

<template>
  <div class="reactions-container">
    <div v-if="groupedReactions.length > 0" class="reactions-list">
      <button
        v-for="reaction in groupedReactions"
        :key="reaction.emoji"
        type="button"
        class="reaction-chip"
        :class="{ reacted: hasReacted(reaction) }"
        :title="getReactionTooltip(reaction)"
        @click="toggleReaction(reaction.emoji)"
      >
        <span class="reaction-emoji">{{ reaction.emoji }}</span>
        <span class="reaction-count">{{ reaction.count }}</span>
      </button>
      <div class="quick-add">
        <EmojiPicker
          inline
          @select="(e) => toggleReaction(e)"
        >
          <button type="button" class="add-reaction-btn" title="Add reaction">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <span class="plus-icon">+</span>
          </button>
        </EmojiPicker>
      </div>
    </div>
    <div v-else class="no-reactions">
      <div class="quick-reactions">
        <button
          v-for="emoji in QUICK_REACTIONS.slice(0, 5)"
          :key="emoji"
          type="button"
          class="quick-reaction-btn"
          @click="toggleReaction(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reactions-container {
  margin-top: 4px;
}

.reactions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.reaction-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
}

.reaction-chip:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.reaction-chip.reacted {
  background: rgba(88, 166, 255, 0.15);
  border-color: var(--color-primary);
}

.reaction-emoji {
  font-size: 16px;
}

.reaction-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.reaction-chip.reacted .reaction-count {
  color: var(--color-primary);
}

.quick-add {
  position: relative;
}

.add-reaction-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px dashed var(--border);
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s ease;
  position: relative;
}

.add-reaction-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(88, 166, 255, 0.1);
}

.plus-icon {
  position: absolute;
  font-size: 14px;
  font-weight: 700;
}

.no-reactions {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.reactions-container:hover .no-reactions {
  opacity: 1;
}

.quick-reactions {
  display: flex;
  gap: 4px;
}

.quick-reaction-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  opacity: 0.5;
  transition: all 0.1s ease;
}

.quick-reaction-btn:hover {
  opacity: 1;
  background: var(--bg-hover);
  transform: scale(1.2);
}
</style>
