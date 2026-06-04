<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'select', emoji: string): void
}>()

const open = ref(false)

const QUICK = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👀', '💯', '✨']
const MORE = [
  '😀',
  '😁',
  '😅',
  '🤣',
  '😊',
  '😍',
  '🤔',
  '😎',
  '🥳',
  '😴',
  '👏',
  '🙌',
  '🤝',
  '💪',
  '🚀',
  '⭐',
  '💜',
  '💙',
  '💚',
  '🎯',
  '🎮',
  '🎵',
  '🎧',
  '📌',
  '✅',
  '❌',
  '⚡',
  '🌙',
  '☀️',
  '🍕',
]

function pick(emoji: string) {
  emit('select', emoji)
  open.value = false
}
</script>

<template>
  <div class="emoji-picker">
    <button type="button" class="trigger" title="Add emoji" @click="open = !open">😊</button>
    <div v-if="open" class="panel">
      <div class="section-label">Quick</div>
      <div class="grid">
        <button v-for="e in QUICK" :key="e" type="button" class="emoji-btn" @click="pick(e)">
          {{ e }}
        </button>
      </div>
      <div class="section-label">More</div>
      <div class="grid">
        <button v-for="e in MORE" :key="e" type="button" class="emoji-btn" @click="pick(e)">
          {{ e }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  position: relative;
}
.trigger {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  line-height: 1;
}
.trigger:hover {
  background: var(--bg-hover);
}
.panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  width: 260px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  z-index: 20;
}
.section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 4px 0 6px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}
.emoji-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}
.emoji-btn:hover {
  background: var(--bg-hover);
}
</style>
