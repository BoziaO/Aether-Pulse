<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { Search, Users, X } from 'lucide-vue-next'

  import { useChatStore } from '../stores/chat.store'
  import { useComposerStore } from '../stores/composer.store'
  import { usePresenceStore } from '../stores/presence.store'
  import { useSearchStore } from '../stores/search.store'
  import { useAuthStore } from '@/stores/auth.store'
  import { useSettingsStore } from '@/stores/settings.store'
  import { useRtcStore } from '@/stores/rtc.store'
  import { ChatSocketService } from '../services/chatSocket.service'
  import { sendMessage } from '../services/chatMessage.service'
  import ChatMessageList from './ChatMessageList.vue'
  import ChatComposer from './ChatComposer.vue'
  import ChatSearch from './ChatSearch.vue'
  import type { Message } from '../types/message.types'
  import UserProfileModal from '@/components/profile/UserProfileModal.vue'

  const props = withDefaults(
    defineProps<{
      roomId: string
      roomName?: string
      members?: Array<{ id: string; displayName: string; status?: string }>
    }>(),
    {
      members: () => [],
    }
  )

  const emit = defineEmits<{
    (e: 'toggle-members'): void
  }>()

  const chatStore = useChatStore()
  const composerStore = useComposerStore()
  const presenceStore = usePresenceStore()
  const searchStore = useSearchStore()
  const authStore = useAuthStore()
  const settingsStore = useSettingsStore()
  const rtcStore = useRtcStore()

  const socket = ChatSocketService.getInstance()
  const selectedUserId = ref<string | null>(null)
  const showSearch = ref(false)

  let cleanupFns: Array<() => void> = []

  const isCompactPanel = computed(
    () => settingsStore.compactChatMode || settingsStore.chatLayout === 'compact'
  )
  const layoutClass = computed(() => `layout-${settingsStore.chatLayout}`)

  function ensureConnected(): void {
    if (!socket.isConnected) {
      socket.connect()
    }
  }

  function initialize(): void {
    if (!authStore.user) return

    ensureConnected()
    chatStore.loadMessages(props.roomId)

    cleanupFns.push(
      socket.onMessage((payload) => {
        chatStore.handleIncomingMessage(payload)
      }),
      socket.onUpdate((payload) => {
        chatStore.handleMessageUpdate(payload)
      }),
      socket.onTyping((data) => {
        if (data.roomId === props.roomId) {
          presenceStore.setTyping(data.roomId, data.userId, data.isTyping)
        }
      }),
      socket.onPresence((data) => {
        if (data.roomId === props.roomId) {
          presenceStore.setOnlineUsers(data.userIds)
        }
      })
    )

    socket.joinRoom(props.roomId, authStore.user.id)
  }

  function teardown(): void {
    cleanupFns.forEach((fn) => fn())
    cleanupFns = []
    if (authStore.user) {
      socket.leaveRoom(props.roomId, authStore.user.id)
    }
  }

  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    teardown()
    chatStore.clearMessages()
  })

  watch(
    () => props.roomId,
    (newId, oldId) => {
      if (oldId && newId !== oldId) {
        teardown()
        if (newId) initialize()
      }
    }
  )

  function handleSend(content: string): void {
    if (!authStore.user || composerStore.isUploading) return

    if (composerStore.isEditing) {
      const msg = composerStore.editingMessage
      if (msg?.serverId) {
        chatStore.editMessage(props.roomId, msg.serverId, content).catch(() => {})
      }
      composerStore.cancelEdit()
      return
    }

    const replyToId = composerStore.replyTo?.serverId

    sendMessage({
      roomId: props.roomId,
      userId: authStore.user.id,
      content: content.trim(),
      user: authStore.user
        ? {
          id: authStore.user.id,
          displayName: authStore.user.displayName,
          avatarUrl: authStore.user.avatarUrl,
          accentColor: authStore.user.accentColor,
          profileGradient: authStore.user.profileGradient,
          primaryColor: authStore.user.primaryColor ?? null,
          displayNameStyle: authStore.user.displayNameStyle ?? null,
          status: authStore.user.status,
        }
        : undefined,
      replyToId: replyToId || undefined,
      onEmit: (rid, text, clientId, rId) => {
        socket.sendMessage(rid, text, clientId, authStore.user!.id, rId)
      },
      onOptimistic: (msg) => {
        chatStore.addOptimisticMessage(msg)
      },
      onConfirm: () => {},
      onFail: (clientId) => {
        chatStore.markFailed(clientId)
      },
    })

    composerStore.clear()
  }

  function handleTyping(isTyping: boolean): void {
    if (!authStore.user) return
    socket.sendTyping(props.roomId, authStore.user.id, isTyping)
  }

  function handleReply(message: Message): void {
    composerStore.setReply(message)
  }

  function handleEdit(message: Message): void {
    composerStore.setEditing(message)
  }

  function handleDelete(messageId: string): void {
    chatStore.deleteMessage(props.roomId, messageId).catch(() => {})
  }

  function handleReact(msgServerId: string, emoji: string): void {
    chatStore.toggleReaction(props.roomId, msgServerId, emoji).catch(() => {})
  }

  function handleLoadMore(): void {
    chatStore.loadMore()
  }

  function handleOpenProfile(userId: string): void {
    selectedUserId.value = userId
  }

  function handleSearchClose(): void {
    showSearch.value = false
    searchStore.clear()
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
          title="Search messages"
          aria-label="Search messages"
          @click="showSearch = !showSearch"
        >
          <Search :size="15" />
        </button>
        <button
          class="icon-btn"
          title="Toggle members"
          aria-label="Toggle members sidebar"
          @click="emit('toggle-members')"
        >
          <Users :size="15" />
          <span class="count-badge">{{ rtcStore.roomUsers.length || members.length || 0 }}</span>
        </button>
      </div>
    </div>

    <ChatSearch v-if="showSearch" :room-id="roomId" @close="handleSearchClose" />

    <div v-if="composerStore.isEditing" class="edit-bar">
      <span class="edit-label">Editing message</span>
      <span class="edit-preview">{{ composerStore.editContent?.slice(0, 80) }}</span>
      <button class="icon-btn" @click="composerStore.cancelEdit">
        <X :size="14" />
      </button>
    </div>

    <ChatMessageList
      ref="messageListRef"
      :room-id="roomId"
      :members="members"
      :search-active="showSearch && searchStore.hasSearched"
      :search-results="searchStore.results"
      @reply="handleReply"
      @edit="handleEdit"
      @delete="handleDelete"
      @react="handleReact"
      @open-profile="handleOpenProfile"
      @load-more="handleLoadMore"
    />

    <ChatComposer :room-id="roomId" :members="members" @send="handleSend" @typing="handleTyping" />
  </div>

  <UserProfileModal
    v-if="selectedUserId"
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
  flex-shrink: 0;
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
.edit-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-tertiary);
  font-size: 13px;
}
.edit-label {
  color: var(--accent-violet);
  font-weight: 600;
  flex-shrink: 0;
}
.edit-preview {
  color: var(--text-muted);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 767px) {
  .chat-panel {
    width: 100% !important;
    min-width: 100% !important;
    border-left: none !important;
  }
}
</style>
