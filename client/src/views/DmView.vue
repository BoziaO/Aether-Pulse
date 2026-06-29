<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick, markRaw } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ArrowLeft, X, MessageCircle } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'
  import { useDmStore } from '@/stores/dm.store'
  import { useFriendsStore } from '@/stores/friends.store'
  import { useSettingsStore } from '@/stores/settings.store'
  import { useToastStore } from '@/stores/toast.store'
  import { defineAsyncComponent } from 'vue'
  import ChatMessage from '@/components/chat/ChatMessage.vue'
  import ChatInput from '@/components/chat/ChatInput.vue'
  import UserAvatar from '@/components/profile/UserAvatar.vue'
  import type { Message } from '@/types/message.types'
  import type { DmMessage } from '@/types/dm.types'

  const UserProfileModal = markRaw(defineAsyncComponent(() => import('@/components/profile/UserProfileModal.vue')))

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const dm = useDmStore()
  const friends = useFriendsStore()
  const settings = useSettingsStore()

  const otherUserId = computed(() => route.params.userId as string)
  const conversationId = ref<string | null>(null)
  const otherUser = ref(friends.friends.find((f) => f.user.id === otherUserId.value)?.user ?? null)
  const scrollEl = ref<HTMLElement | null>(null)
  const selectedUserId = ref<string | null>(null)
  const uploading = ref(false)
  const editingMessage = ref<Message | null>(null)
  const editContent = ref('')
  const mouse = ref({ x: 0, y: 0 })

  let mouseFn: ((e: MouseEvent) => void) | null = null

  onMounted(() => {
    mouseFn = (e: MouseEvent) => {
      mouse.value = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', mouseFn, { passive: true })
  })

  onUnmounted(() => {
    if (mouseFn) window.removeEventListener('mousemove', mouseFn)
  })

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
  const isCompactView = computed(() => settings.compactChatMode || settings.chatLayout === 'compact')
  const layoutClass = computed(() => `layout-${settings.chatLayout}`)

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
      router.push('/app/friends')
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
  <div class="dm-view" :class="[layoutClass, { compact: isCompactView }]">
    <div class="dm-bg-orbs" aria-hidden="true">
      <div class="dm-orb dm-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="dm-orb dm-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="dm-orb dm-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="dm-orb dm-orb--teal"></div>
    </div>

    <header class="dm-header">
      <button class="btn btn-ghost dm-back" @click="router.push('/friends')">
        <ArrowLeft :size="16" />
      </button>
      <UserAvatar v-if="otherUser" :user="otherUser" :size="36" />
      <div class="header-info">
        <h2>{{ otherUser?.displayName || 'Direct Message' }}</h2>
        <p>@{{ otherUser?.username }}</p>
      </div>
      <div v-if="otherUser" class="dm-header-badge badge badge-violet">
        <MessageCircle :size="12" />
        DM
      </div>
    </header>

    <div v-if="editingMessage" class="edit-bar">
      <span>Editing message</span>
      <button type="button" class="btn btn-ghost btn-sm" @click="cancelEdit">
        <X :size="14" />
      </button>
    </div>

    <div ref="scrollEl" class="dm-messages" @scroll="handleScroll">
      <div v-if="dm.loadingMessages && displayMessages.length === 0" class="empty">Loading...</div>
      <div v-else-if="dm.loadingMessages" class="load-more">Loading older messages...</div>
      <div v-else-if="displayMessages.length === 0" class="empty-state card glass">
        <div class="empty-icon">
          <MessageCircle :size="32" />
        </div>
        <h3>Początek rozmowy</h3>
        <p>To jest początek historii wiadomości z {{ otherUser?.displayName }}.</p>
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
  position: relative;
}

/* BG ORBS */
.dm-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.dm-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.dm-orb--violet {
  width: 500px;
  height: 500px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.06);
}

.dm-orb--pink {
  width: 400px;
  height: 400px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.04);
}

.dm-orb--blue {
  width: 350px;
  height: 350px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.04);
}

.dm-orb--teal {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.03);
  animation: dmOrbDrift 20s ease-in-out infinite;
}

@keyframes dmOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

.dm-view.compact .dm-header {
  padding-top: 10px;
  padding-bottom: 10px;
}

.dm-view.layout-bubble {
  background: linear-gradient(180deg, var(--bg-primary), rgba(59, 130, 246, 0.025));
}

.dm-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
  backdrop-filter: blur(20px);
}

.dm-back {
  padding: 6px;
  border-radius: 8px;
}

.dm-header-badge {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.dm-view.layout-compact .dm-messages {
  padding-top: 4px;
  padding-bottom: 4px;
}

.dm-view.compact .dm-messages {
  padding-top: 6px;
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

.empty-state {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 24px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(139, 92, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-violet);
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.edit-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.dm-view.compact .edit-bar {
  padding-top: 8px;
  padding-bottom: 8px;
}

.edit-bar span {
  flex: 1;
  font-size: 13px;
}

.typing-indicator {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.dm-view.compact .typing-indicator {
  padding-top: 6px;
  padding-bottom: 6px;
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

/* Mobile responsive styles */
@media (max-width: 767px) {
  .dm-view.layout-bubble {
    background: var(--bg-primary);
  }

  .dm-view.layout-compact .dm-header,
  .dm-view.layout-bubble .dm-header {
    padding-top: 10px;
    padding-bottom: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dm-orb {
    animation: none !important;
  }
}
</style>
