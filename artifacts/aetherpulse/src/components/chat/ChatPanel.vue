<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import { useAuthStore } from '@/stores/auth.store'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'

const props = defineProps<{ roomId: string }>()
const chatStore = useChatStore()
const auth = useAuthStore()
const scrollEl = ref<HTMLElement | null>(null)

const typingList = computed(() => [...chatStore.typingUsers].filter(id => id !== auth.user?.id))

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

watch(() => chatStore.messages.length, scrollToBottom)

function handleSend(content: string) {
  if (!auth.user) return
  chatStore.sendMessage(props.roomId, auth.user.id, content)
}

function handleTyping(isTyping: boolean) {
  if (!auth.user) return
  chatStore.setTyping(props.roomId, auth.user.id, isTyping)
}
</script>

<template>
  <div class="chat-panel">
    <div class="chat-header">
      <span class="chat-title"># chat</span>
      <span class="chat-count">{{ chatStore.messages.length }} messages</span>
    </div>

    <div class="chat-messages" ref="scrollEl">
      <div v-if="chatStore.loading" class="chat-empty">Loading...</div>
      <div v-else-if="chatStore.messages.length === 0" class="chat-empty">
        No messages yet. Say hello! 👋
      </div>
      <ChatMessage
        v-for="(msg, i) in chatStore.messages"
        :key="msg.id"
        :message="msg"
        :is-own="msg.userId === auth.user?.id"
        :show-avatar="i === 0 || chatStore.messages[i-1]?.userId !== msg.userId"
      />
      <div v-if="typingList.length > 0" class="typing-indicator">
        <span class="typing-dots"><span /><span /><span /></span>
        <span>Someone is typing...</span>
      </div>
    </div>

    <ChatInput :room-id="roomId" @send="handleSend" @typing="handleTyping" />
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  width: 280px;
  min-width: 280px;
}
.chat-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chat-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.chat-count { font-size: 12px; color: var(--text-muted); }
.chat-messages { flex: 1; overflow-y: auto; padding: 8px 0; }
.chat-empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  padding: 40px 16px;
}
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-muted);
}
.typing-dots {
  display: flex;
  gap: 3px;
  align-items: center;
}
.typing-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s ease-in-out infinite both;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
