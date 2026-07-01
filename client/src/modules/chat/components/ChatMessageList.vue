<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'

  import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
  import type { Message } from '../types/message.types'
  import { messageGroupMeta } from '../utils/message.utils'
  import { useAuthStore } from '@/stores/auth.store'
  import { useChatStore } from '../stores/chat.store'
  import { usePresenceStore } from '../stores/presence.store'
  import { useSettingsStore } from '@/stores/settings.store'
  import ChatMessageItem from './ChatMessageItem.vue'
  import ChatTypingIndicator from './ChatTypingIndicator.vue'
  import ChatNewMessage from './ChatNewMessage.vue'
  import { useInfiniteScroll } from '../composables/useInfiniteScroll'

  const props = defineProps<{
    roomId: string
    members?: Array<{ id: string; displayName: string; status?: string | undefined }>
    searchActive?: boolean
    searchResults?: Message[]
  }>()

  const emit = defineEmits<{
    (e: 'reply', message: Message): void
    (e: 'edit', message: Message): void
    (e: 'delete', messageId: string): void
    (e: 'react', messageId: string, emoji: string): void
    (e: 'star', messageId: string): void
    (e: 'open-profile', userId: string): void
    (e: 'load-more'): void
  }>()

  const chatStore = useChatStore()
  const presenceStore = usePresenceStore()
  const settingsStore = useSettingsStore()

  const containerRef = ref<HTMLElement | null>(null)
  const lastReadIndex = ref<number>(-1)

  const {
    nearBottom: _,
    showNewMessage,
    onScroll,
    scrollDown,
    onNewMessage,
  } = useInfiniteScroll(
    containerRef,
    () => chatStore.loadMore(),
    () => chatStore.hasMore,
    () => chatStore.loadingMore
  )

  const displayMessages = computed(() => {
    if (props.searchActive && props.searchResults) {
      return props.searchResults
    }
    return chatStore.sortedMessages
  })

  const groupMeta = computed(() => messageGroupMeta(displayMessages.value))

  const typingNames = computed(() => {
    const typingIds = presenceStore.getTypingUsers(props.roomId)
    const authStore = useAuthStore()
    const memberMap = new Map(props.members?.map((m) => [m.id, m.displayName]) || [])
    return typingIds
      .filter((id) => id !== authStore.user?.id)
      .map((id) => memberMap.get(id) || 'Someone')
  })

  const isCompactPanel = computed(
    () => settingsStore.compactChatMode || settingsStore.chatLayout === 'compact'
  )
  const layoutClass = computed(() => `layout-${settingsStore.chatLayout}`)

  const minItemSize = computed(() => (isCompactPanel.value ? 48 : 64))

  function handleScroll(): void {
    onScroll()
  }

  function handleScrollerUpdate(
    _startIndex: number,
    _endIndex: number,
    visibleStartIndex: number
  ): void {
    if (visibleStartIndex < 3 && chatStore.hasMore && !chatStore.loadingMore && !props.searchActive) {
      emit('load-more')
    }
  }

  function scrollToBottom(smooth = false): void {
    scrollDown(smooth)
  }

  function scrollToFirstUnread(): void {
    if (!chatStore.lastReadMessageId) return
    const idx = displayMessages.value.findIndex(
      (m) => m.serverId === chatStore.lastReadMessageId || m.clientId === chatStore.lastReadMessageId
    )
    if (idx >= 0) {
      lastReadIndex.value = idx
      // Scroll to the unread message - we'll use a simple approach
      const el = document.getElementById('msg-' + displayMessages.value[idx].clientId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  function handleReact(msgId: string, emoji: string): void {
    emit('react', msgId, emoji)
  }

  watch(
    () => chatStore.sortedMessages.length,
    () => {
      onNewMessage()
    }
  )

  watch(
    () => props.roomId,
    () => {
      nextTick(() => scrollToBottom())
    }
  )

  defineExpose({ scrollToBottom, scrollToFirstUnread })
</script>

<template>
  <div class="chat-messages-wrapper" :class="layoutClass">
    <div
      ref="containerRef"
      class="chat-messages"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      @scroll="handleScroll"
    >
      <DynamicScroller
        v-if="!chatStore.loading"
        :items="displayMessages"
        :min-item-size="minItemSize"
        :key-field="'clientId'"
        page-mode
        @update="handleScrollerUpdate"
      >
        <template #default="{ item, active }">
          <DynamicScrollerItem :item="item" :active="active" :size-dirty="false">
            <div
              :id="'msg-' + item.clientId"
              :class="{ 'unread-divider': chatStore.lastReadMessageId && item.serverId === chatStore.lastReadMessageId }"
            >
              <ChatMessageItem
                v-memo="[
                  item.clientId,
                  item.serverId,
                  item.content,
                  item.editedAt,
                  item.reactions,
                  item.isDeleted,
                  item.isStarred,
                  item.status,
                  item.attachments,
                  groupMeta.get(item.clientId)?.showAvatar,
                  groupMeta.get(item.clientId)?.showAuthor,
                  groupMeta.get(item.clientId)?.isGrouped,
                ]"
                :message="item"
                :room-id="roomId"
                :show-avatar="groupMeta.get(item.clientId)?.showAvatar ?? true"
                :show-author="groupMeta.get(item.clientId)?.showAuthor ?? true"
                :is-grouped="groupMeta.get(item.clientId)?.isGrouped ?? false"
                @reply="emit('reply', $event)"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
                @react="(msgId: string, emoji: string) => handleReact(msgId, emoji)"
                @star="(msgId: string) => emit('star', msgId)"
                @open-profile="emit('open-profile', $event)"
              />
            </div>
          </DynamicScrollerItem>
        </template>
        <template #before>
          <div v-if="chatStore.loadingMore" class="load-more-indicator">
            Loading older messages...
          </div>
        </template>
        <template #empty>
          <div class="chat-empty">
            {{ props.searchActive ? 'No results found.' : 'No messages yet. Say hello!' }}
          </div>
        </template>
      </DynamicScroller>

      <div v-if="chatStore.loading" class="chat-empty">Loading messages...</div>
    </div>

    <ChatNewMessage
      v-if="showNewMessage && chatStore.newMessageCount > 0"
      :count="chatStore.newMessageCount"
      @scroll-down="scrollToBottom(true)"
    />

    <ChatTypingIndicator :names="typingNames" />
  </div>
</template>

<style scoped>
.chat-messages-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-anchor: none;
}
.load-more-indicator {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  padding: 12px;
}
.chat-empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  padding: 48px 20px;
}
.unread-divider {
  position: relative;
}
.unread-divider::before {
  content: 'NEW';
  position: absolute;
  top: -1px;
  left: 16px;
  right: 16px;
  height: 2px;
  background: var(--accent-violet);
  z-index: 2;
}
.unread-divider::after {
  content: 'NEW';
  position: absolute;
  top: -8px;
  left: 16px;
  font-size: 9px;
  font-weight: 700;
  color: var(--accent-violet);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 4px;
  z-index: 3;
  letter-spacing: 0.5px;
}
</style>
