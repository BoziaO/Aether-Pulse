<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Search, Users, X } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRtcStore } from '@/stores/rtc.store'
import { useToastStore } from '@/stores/toast.store'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import UserProfileModal from '@/components/profile/UserProfileModal.vue'
import type { Message } from '@/types/message.types'

const props = defineProps<{
  roomId: string
  roomName?: string
  members?: Array<{ id: number; displayName: string; status?: string }>
}>()

const emit = defineEmits<{
  (e: 'toggle-members'): void
}>()

const chatStore = useChatStore()
const auth = useAuthStore()
const rtc = useRtcStore()
const scrollEl = ref<HTMLElement | null>(null)
const selectedUserId = ref<number | null>(null)
const showSearch = ref(false)
const searchInput = ref('')
const editingMessage = ref<Message | null>(null)
const editContent = ref('')
const uploading = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const typingList = computed(() => [...chatStore.typingUsers].filter((id) => id !== auth.user?.id))

const displayMessages = computed(() =>
  showSearch.value && searchInput.value.trim() ? chatStore.searchResults : chatStore.messages
)

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

watch(() => chatStore.messages.length, scrollToBottom)

function handleScroll() {
  if (!scrollEl.value || showSearch.value) return
  if (scrollEl.value.scrollTop < 40 && chatStore.hasMore && !chatStore.loadingMore) {
    const prevHeight = scrollEl.value.scrollHeight
    chatStore.loadMore().then(() => {
      nextTick(() => {
        if (scrollEl.value) {
          scrollEl.value.scrollTop = scrollEl.value.scrollHeight - prevHeight
        }
      })
    })
  }
}

function handleSend(content: string) {
  if (!auth.user) return
  if (editingMessage.value) {
    chatStore.editMessage(props.roomId, editingMessage.value.id, content)
    editingMessage.value = null
    editContent.value = ''
    return
  }
  chatStore.sendMessage(props.roomId, auth.user.id, content)
}

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    chatStore.searchMessages(props.roomId, searchInput.value)
  }, 300)
}

function closeSearch() {
  showSearch.value = false
  searchInput.value = ''
}

function startEdit(message: Message) {
  editingMessage.value = message
  editContent.value = message.content
}

function cancelEdit() {
  editingMessage.value = null
  editContent.value = ''
}

async function handleUpload(dataUrl: string, fileName: string, caption: string) {
  uploading.value = true
  try {
    await chatStore.uploadFile(props.roomId, dataUrl, fileName, caption || undefined)
  } catch (e) {
    useToastStore().error(e instanceof Error ? e.message : 'Upload failed')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="chat-panel">
    <div class="chat-header">
      <span class="chat-title"># {{ roomName || 'chat' }}</span>
      <div class="header-actions">
        <button
          class="icon-btn"
          :class="{ active: showSearch }"
          title="Search"
          @click="showSearch = !showSearch"
        >
          <Search :size="15" />
        </button>
        <button class="icon-btn" title="Members" @click="emit('toggle-members')">
          <Users :size="15" />
          <span class="count-badge">{{ rtc.roomUsers.length || members?.length || 0 }}</span>
        </button>
      </div>
    </div>

    <div v-if="showSearch" class="search-bar">
      <Search :size="14" />
      <input v-model="searchInput" placeholder="Search messages..." @input="handleSearch" />
      <button type="button" @click="closeSearch">
        <X :size="14" />
      </button>
    </div>

    <div v-if="editingMessage" class="edit-bar">
      <span>Editing message</span>
      <button type="button" @click="cancelEdit"><X :size="14" /></button>
    </div>

    <div class="chat-messages" ref="scrollEl" @scroll="handleScroll">
      <div v-if="chatStore.loadingMore" class="load-more">Loading older messages...</div>
      <div v-if="chatStore.loading" class="chat-empty">Loading...</div>
      <div v-else-if="displayMessages.length === 0" class="chat-empty">
        {{ showSearch && searchInput ? 'No results found.' : 'No messages yet. Say hello! 👋' }}
      </div>
      <ChatMessage
        v-for="(msg, i) in displayMessages"
        :key="msg.id"
        :message="msg"
        :room-id="roomId"
        :current-user-id="auth.user?.id"
        :is-own="msg.userId === auth.user?.id"
        :show-avatar="
          i === 0 || displayMessages[i - 1]?.userId !== msg.userId || msg.type === 'system'
        "
        @open-profile="selectedUserId = $event"
        @reply="chatStore.setReply($event)"
        @edit="startEdit"
        @delete="chatStore.deleteMessage(roomId, $event)"
        @react="(id, emoji) => chatStore.toggleReaction(roomId, id, emoji)"
      />
      <div v-if="typingList.length > 0" class="typing-indicator">
        <span class="typing-dots"><span /><span /><span /></span>
        <span>{{
          typingList.length === 1 ? 'Someone is typing...' : `${typingList.length} people typing...`
        }}</span>
      </div>
    </div>

    <ChatInput
      :room-id="roomId"
      :reply-to="chatStore.replyTo"
      :initial-value="editingMessage ? editContent : ''"
      :placeholder="editingMessage ? 'Edit your message...' : undefined"
      :uploading="uploading"
      @send="handleSend"
      @upload="handleUpload"
      @typing="auth.user && chatStore.setTyping(roomId, auth.user.id, $event)"
      @cancel-reply="chatStore.setReply(null)"
    />
  </div>

  <UserProfileModal
    v-if="selectedUserId !== null"
    :user-id="selectedUserId"
    @close="selectedUserId = null"
  />
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  width: 360px;
  min-width: 320px;
}
.chat-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chat-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.header-actions {
  display: flex;
  gap: 4px;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}
.icon-btn:hover,
.icon-btn.active {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.count-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--success);
}
.search-bar,
.edit-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
}
.search-bar input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13px;
}
.search-bar button,
.edit-bar button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.load-more {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px;
}
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
.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
