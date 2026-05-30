<script setup lang="ts">
import { ref } from 'vue'
import { Send } from 'lucide-vue-next'

const props = defineProps<{
  roomId: string
  placeholder?: string
}>()
const emit = defineEmits<{
  (e: 'send', content: string): void
  (e: 'typing', isTyping: boolean): void
}>()

const input = ref('')
let typingTimeout: ReturnType<typeof setTimeout> | null = null

function handleInput() {
  emit('typing', true)
  if (typingTimeout) clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => emit('typing', false), 2000)
}

function sendMessage() {
  const content = input.value.trim()
  if (!content) return
  emit('send', content)
  emit('typing', false)
  input.value = ''
  if (typingTimeout) clearTimeout(typingTimeout)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="chat-input-wrap">
    <textarea
      v-model="input"
      class="chat-input"
      :placeholder="placeholder || 'Message...'"
      rows="1"
      @keydown="handleKeydown"
      @input="handleInput"
    />
    <button class="send-btn" :disabled="!input.trim()" @click="sendMessage">
      <Send :size="16" />
    </button>
  </div>
</template>

<style scoped>
.chat-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
}
.chat-input {
  flex: 1;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 14px;
  resize: none;
  outline: none;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.4;
}
.chat-input:focus { border-color: var(--accent-violet); }
.chat-input::placeholder { color: var(--text-muted); }
.send-btn {
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  border: none;
  border-radius: 8px;
  padding: 10px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
