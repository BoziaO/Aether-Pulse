<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { Search, Users, X } from 'lucide-vue-next'
  import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
  import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

  import { useChatStore } from '@/stores/chat.store'
  import { useAuthStore } from '@/stores/auth.store'
  import { useSettingsStore } from '@/stores/settings.store'
  import { useRtcStore } from '@/stores/rtc.store'
  import { useToastStore } from '@/stores/toast.store'
  import ChatMessage from './ChatMessage.vue'
  import ChatInput from './ChatInput.vue'
  import UserProfileModal from '@/components/profile/UserProfileModal.vue'
  import type { Message } from '@/types/message.types'

  const props = defineProps<{
    roomId: string
    roomName?: string | undefined
    members?: Array<{ id: string; displayName: string; status?: string | undefined }> | undefined
  }>()

  const emit = defineEmits<{
    (e: 'toggle-members'): void
  }>()

  const chatStore = useChatStore()
  const auth = useAuthStore()
  const settings = useSettingsStore()
  const rtc = useRtcStore()
  const scrollerRef = ref<any>(null)
  const selectedUserId = ref<string | null>(null)
  const showSearch = ref(false)
  const searchInput = ref('')
  const editingMessage = ref<Message | null>(null)
  const editContent = ref('')
  const uploading = ref(false)
  const nearBottom = ref(true)
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  const typingList = computed(() => [...chatStore.typingUsers].filter((id) => id !== auth.user?.id))

  const memberMap = computed(() => {
    const map = new Map<string, string>()
    if (props.members) {
      props.members.forEach((m) => map.set(m.id, m.displayName))
    }
    return map
  })

  const typingNames = computed(() =>
    typingList.value.map((id) => memberMap.value.get(id) || 'Someone')
  )

  const displayMessages = computed(() =>
    showSearch.value && searchInput.value.trim() ? chatStore.searchResults : chatStore.messages
  )

  const GROUP_WINDOW = 5 * 60 * 1000

  const messageMeta = computed(() => {
    const msgs = displayMessages.value
    const meta = new Map<string, { showAvatar: boolean; showAuthor: boolean; isGrouped: boolean }>()

    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i]
      if (msg.type === 'system') {
        meta.set(msg.id, { showAvatar: true, showAuthor: true, isGrouped: false })
        continue
      }

      const prev = i > 0 ? msgs[i - 1] : null
      const next = i < msgs.length - 1 ? msgs[i + 1] : null

      const sameAsPrev = prev != null && prev.userId === msg.userId && prev.type !== 'system'
      const sameAsNext = next != null && next.userId === msg.userId && next.type !== 'system'

      if (!sameAsPrev && !sameAsNext) {
        meta.set(msg.id, { showAvatar: true, showAuthor: true, isGrouped: false })
        continue
      }

      const currTime = new Date(msg.createdAt).getTime()

      let inGroup = false
      if (sameAsPrev) {
        const prevTime = new Date(prev!.createdAt).getTime()
        inGroup = currTime - prevTime < GROUP_WINDOW
      }
      if (!inGroup && sameAsNext) {
        const nextTime = new Date(next!.createdAt).getTime()
        inGroup = nextTime - currTime < GROUP_WINDOW
      }

      if (!inGroup) {
        meta.set(msg.id, { showAvatar: true, showAuthor: true, isGrouped: false })
      } else {
        const showAvatar = !sameAsPrev
        const showAuthor = !sameAsPrev
        meta.set(msg.id, { showAvatar, showAuthor, isGrouped: !showAvatar })
      }
    }

    return meta
  })

  const isCompactPanel = computed(
    () => settings.compactChatMode || settings.chatLayout === 'compact'
  )
  const layoutClass = computed(() => `layout-${settings.chatLayout}`)

  function scrollToBottom() {
    nextTick(() => {
      if (scrollerRef.value) {
        scrollerRef.value.scrollToBottom()
      }
    })
  }

  // Smart autoscroll: only when near bottom
  function checkNearBottom() {
    if (!scrollerRef.value) return
    const el = (scrollerRef.value as any).$el as HTMLElement | undefined
    if (!el) return
    const threshold = 150
    nearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }

  function handleScrollerScroll() {
    checkNearBottom()
    if (!scrollerRef.value || showSearch.value) return
  }

  function handleScrollerUpdate(_startIndex: number, _endIndex: number, visibleStartIndex: number, _visibleEndIndex: number) {
    if (visibleStartIndex < 3 && chatStore.hasMore && !chatStore.loadingMore && !showSearch.value) {
      chatStore.loadMore()
    }
  }

  // Auto-scroll on new messages when near bottom
  watch(() => chatStore.messages.length, () => {
    if (nearBottom.value) {
      scrollToBottom()
    }
  })

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
  <div class="chat-panel" :class="[layoutClass, { compact: isCompactPanel }]">
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

    <div class="chat-messages">
      <DynamicScroller
        v-if="!chatStore.loading"
        ref="scrollerRef"
        :items="displayMessages"
        :min-item-size="isCompactPanel ? 48 : 64"
        key-field="id"
        @scroll="handleScrollerScroll"
        @update="handleScrollerUpdate"
      >
        <template #default="{ item, active }">
          <DynamicScrollerItem :item="item" :active="active" :size-dirty="false">
            <ChatMessage
              v-memo="[item.id, item.content, item.editedAt, item.reactions, item.isDeleted, item.status, item.attachmentUrl]"
              :message="item"
              :room-id="roomId"
              :current-user-id="auth.user?.id"
              :is-own="item.userId === auth.user?.id"
              :show-avatar="messageMeta.get(item.id)?.showAvatar ?? true"
              :show-author="messageMeta.get(item.id)?.showAuthor ?? true"
              @open-profile="selectedUserId = $event"
              @reply="chatStore.setReply($event)"
              @edit="startEdit"
              @delete="chatStore.deleteMessage(roomId, $event)"
              @react="(id, emoji) => chatStore.toggleReaction(roomId, id, emoji)"
            />
          </DynamicScrollerItem>
        </template>
        <template #before>
          <div v-if="chatStore.loadingMore" class="load-more">Loading older messages...</div>
        </template>
        <template #empty>
          <div class="chat-empty">
            {{ showSearch && searchInput ? 'No results found.' : 'No messages yet. Say hello! 👋' }}
          </div>
        </template>
      </DynamicScroller>
      <div v-if="chatStore.loading" class="chat-empty">Loading...</div>
      <div v-if="typingList.length > 0" class="typing-indicator">
        <span class="typing-dots"><span /><span /><span /></span>
        <span>{{
          typingNames.length === 1
            ? `${typingNames[0]} pisze...`
            : `${typingNames.join(', ')} piszą...`
        }}</span>
      </div>
    </div>

    <ChatInput
      :reply-to="chatStore.replyTo"
      :initial-value="editingMessage ? editContent : ''"
      :placeholder="editingMessage ? 'Edit your message...' : 'Message...'"
      :uploading="uploading"
      :members="members"
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
.chat-panel.compact {
  width: 344px;
  min-width: 304px;
}
.chat-panel.layout-bubble {
  background: linear-gradient(180deg, var(--bg-secondary), rgba(139, 92, 246, 0.03));
}
.chat-panel.layout-modern {
  background: var(--bg-secondary);
}
.chat-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chat-panel.compact .chat-header {
  padding: 12px 14px;
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
.chat-panel.compact .search-bar,
.chat-panel.compact .edit-bar {
  padding-top: 8px;
  padding-bottom: 8px;
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
  overflow: hidden;
  position: relative;
}
.chat-messages :deep(.vue-recycle-scroller) {
  height: 100%;
}
.chat-messages :deep(.vue-recycle-scroller__item-wrapper) {
  overflow: visible;
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
.chat-panel.compact .typing-indicator {
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

/* Message enter animation */
.chat-messages :deep(.message) {
  animation: message-enter 0.2s ease-out;
}
@keyframes message-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsive styles */
@media (max-width: 767px) {
  .chat-panel {
    width: 100% !important;
    min-width: 100% !important;
    border-left: none !important;
  }
  .chat-panel.compact {
    width: 100% !important;
    min-width: 100% !important;
  }
  .chat-panel.layout-bubble,
  .chat-panel.layout-modern {
    width: 100% !important;
    min-width: 100% !important;
    border-left: none !important;
  }
}
</style>
