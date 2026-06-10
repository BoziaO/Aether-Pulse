<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useDmStore } from '@/stores/dm.store'
import { useFriendsStore } from '@/stores/friends.store'
import { useToastStore } from '@/stores/toast.store'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import UserAvatar from '@/components/profile/UserAvatar.vue'
import UserProfileModal from '@/components/profile/UserProfileModal.vue'
import type { Message } from '@/types/message.types'
import type { DmMessage } from '@/types/dm.types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const dm = useDmStore()
const friends = useFriendsStore()

const otherUserId = computed(() => route.params.userId as string)
const conversationId = ref<string | null>(null)
const otherUser = ref(friends.friends.find((f) => f.user.id === otherUserId.value)?.user ?? null)
const scrollEl = ref<HTMLElement | null>(null)
const selectedUserId = ref<string | null>(null)
const uploading = ref(false)
const editingMessage = ref<Message | null>(null)
const editContent = ref('')

const isOtherTyping = computed(() => {
  return otherUser.value && dm.typingUsers.has(otherUser.value.id)
})

function startEdit(message: Message) {
  editingMessage.value = message
  editContent.value = message.content
}

function cancelEdit() {
  editingMessage.value = null
  editContent.value = ''
}

const replyForInput = computed(() => {
  const r = dm.replyTo
  if (!r) return null
  return {
    id: r.id,
    user: r.user ? { displayName: r.user.displayName } : null,
  }
})

function dmToMessage(msg: DmMessage): Message {
  return {
    id: msg.id,
    roomId: msg.conversationId,
    userId: msg.userId,
    content: msg.content,
    type: msg.type,
    replyToId: msg.replyToId ?? null,
    editedAt: msg.editedAt ?? null,
    isDeleted: msg.isDeleted ?? false,
    createdAt: msg.createdAt,
    user: msg.user ?? null,
    replyTo: msg.replyTo ?? null,
    attachmentUrl: msg.attachmentUrl ?? null,
    attachmentName: msg.attachmentName ?? null,
    attachmentMime: msg.attachmentMime ?? null,
  }
}

const displayMessages = computed(() => dm.messages.map(dmToMessage))

onMounted(async () => {
  if (!auth.user || !otherUserId.value) return
  try {
    const conv = await dm.openWith(otherUserId.value)
    conversationId.value = conv.id
    otherUser.value = conv.otherUser ?? otherUser.value
    dm.joinConversation(conv.id)
    await dm.loadMessages(conv.id)
    scrollToBottom()
  } catch (e) {
    useToastStore().error(e instanceof Error ? e.message : 'Failed to open conversation')
    router.push('/friends')
  }
})

onUnmounted(() => dm.leaveConversation())

watch(() => dm.messages.length, scrollToBottom)

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

function handleScroll() {
  if (!scrollEl.value || dm.loadingMessages || !dm.hasMore) return
  if (scrollEl.value.scrollTop < 40) {
    const prevHeight = scrollEl.value.scrollHeight
    dm.loadMore().then(() => {
      nextTick(() => {
        if (scrollEl.value) {
          scrollEl.value.scrollTop = scrollEl.value.scrollHeight - prevHeight
        }
      })
    })
  }
}

function handleSend(content: string) {
  if (!conversationId.value) return
  if (editingMessage.value) {
    dm.editMessage(conversationId.value, editingMessage.value.id, content)
    cancelEdit()
    return
  }
  dm.sendMessage(conversationId.value, content)
  scrollToBottom()
}

async function handleUpload(dataUrl: string, fileName: string, caption: string) {
  if (!conversationId.value) return
  uploading.value = true
  try {
    await dm.uploadFile(conversationId.value, dataUrl, fileName, caption || undefined)
    scrollToBottom()
  } catch (e) {
    useToastStore().error(e instanceof Error ? e.message : 'Upload failed')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="dm-view">
    <header class="dm-header">
      <button class="back-btn" @click="router.push('/friends')"><ArrowLeft :size="16" /></button>
      <UserAvatar v-if="otherUser" :user="otherUser" :size="36" />
      <div class="header-info">
        <h2>{{ otherUser?.displayName || 'Direct Message' }}</h2>
        <p>@{{ otherUser?.username }}</p>
      </div>
    </header>

    <div v-if="editingMessage" class="edit-bar">
      <span>Editing message</span>
      <button type="button" @click="cancelEdit"><X :size="14" /></button>
    </div>

    <div class="dm-messages" ref="scrollEl" @scroll="handleScroll">
      <div v-if="dm.loadingMessages && displayMessages.length === 0" class="empty">Loading...</div>
      <div v-else-if="dm.loadingMessages" class="load-more">Loading older messages...</div>
      <div v-else-if="displayMessages.length === 0" class="empty">
        This is the beginning of your direct message history with {{ otherUser?.displayName }}.
      </div>
      <ChatMessage
        v-for="(msg, i) in displayMessages"
        :key="msg.id"
        :message="msg"
        :current-user-id="auth.user?.id"
        :is-own="msg.userId === auth.user?.id"
        :show-avatar="i === 0 || displayMessages[i - 1]?.userId !== msg.userId"
        @open-profile="selectedUserId = $event"
        @reply="dm.setReply(dm.messages.find((m) => m.id === $event.id) ?? null)"
        @edit="startEdit"
        @delete="dm.deleteMessage(conversationId!, $event)"
      />
      <div v-if="isOtherTyping" class="typing-indicator">
        <span class="typing-dots"><span /><span /><span /></span>
        <span>{{ otherUser?.displayName || 'Someone' }} is typing...</span>
      </div>
    </div>

    <ChatInput
      :reply-to="replyForInput"
      :initial-value="editingMessage ? editContent : ''"
      :placeholder="
        editingMessage ? 'Edit your message...' : `Message @${otherUser?.username ?? 'user'}`
      "
      :uploading="uploading"
      @send="handleSend"
      @upload="handleUpload"
      @typing="conversationId && dm.setTyping(conversationId, $event)"
      @cancel-reply="dm.setReply(null)"
    />
  </div>

  <UserProfileModal
    v-if="selectedUserId"
    :user-id="selectedUserId"
    @close="selectedUserId = null"
  />
</template>

<style scoped>
.dm-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}
.dm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}
.back-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}
.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.header-info h2 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.header-info p {
  font-size: 12px;
  color: var(--text-muted);
}
.dm-messages {
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
.empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  padding: 40px 20px;
}
.edit-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  background: var(--bg-secondary);
}
.edit-bar span {
  flex: 1;
  font-size: 13px;
}
.edit-bar button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-bar button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
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
