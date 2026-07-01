<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { MessageSquare, Edit3, Trash2, AlertCircle, Star } from 'lucide-vue-next'

  import type { Message } from '../types/message.types'
  import { MessageStatus } from '../types/message.types'
  import { useAuthStore } from '@/stores/auth.store'
  import ChatMessageStatus from './ChatMessageStatus.vue'
  import ChatReactions from './ChatReactions.vue'
  import UserAvatar from '@/components/profile/UserAvatar.vue'
  import MessageContent from '@/components/chat/MessageContent.vue'

  const props = defineProps<{
    message: Message
    roomId: string
    showAvatar: boolean
    showAuthor: boolean
    isGrouped: boolean
  }>()

  const emit = defineEmits<{
    (e: 'reply', message: Message): void
    (e: 'edit', message: Message): void
    (e: 'delete', messageId: string): void
    (e: 'react', messageId: string, emoji: string): void
    (e: 'star', messageId: string): void
    (e: 'open-profile', userId: string): void
  }>()

  const authStore = useAuthStore()
  const showActions = ref(false)

  const isOwn = computed(() => props.message.userId === authStore.user?.id)
  const isFailed = computed(() => props.message.status === MessageStatus.Failed)
  const isStarred = computed(() => props.message.isStarred ?? false)

  const messageTime = computed(() => {
    const date = new Date(props.message.createdAt)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })

  const userForAvatar = computed(() => props.message.user ?? null)

  function handleReply(): void {
    emit('reply', props.message)
  }

  function handleEdit(): void {
    emit('edit', props.message)
  }

  function handleDelete(): void {
    if (props.message.serverId) {
      emit('delete', props.message.serverId)
    }
  }

  function handleRetry(): void {
    emit('delete', props.message.clientId)
  }

  function handleReact(emoji: string): void {
    if (props.message.serverId) {
      emit('react', props.message.serverId, emoji)
    }
  }

  function handleStar(): void {
    if (props.message.serverId) {
      emit('star', props.message.serverId)
    }
  }
</script>

<template>
  <div
    :class="[
      'message-item',
      {
        'message-own': isOwn,
        'message-failed': isFailed,
        'message-deleted': message.isDeleted,
        'message-grouped': isGrouped,
        'message-system': message.type === 'system',
      },
    ]"
    role="listitem"
    :aria-label="`Message from ${message.user?.displayName || 'Unknown'}`"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
    @focusin="showActions = true"
    @focusout="showActions = false"
  >
    <div v-if="message.type === 'system'" class="system-message">
      <span class="system-text">{{ message.content }}</span>
    </div>

    <template v-else>
      <div v-if="showAvatar" class="message-avatar" @click="emit('open-profile', message.userId)">
        <UserAvatar v-if="userForAvatar" :user="userForAvatar" :size="36" />
        <div v-else class="avatar-placeholder">{{ message.user?.displayName?.[0] || '?' }}</div>
      </div>

      <div v-if="isGrouped && !showAvatar" class="message-spacer" />

      <div class="message-body">
        <div v-if="showAuthor && !isGrouped" class="message-header">
          <button class="message-author" @click="emit('open-profile', message.userId)">
            {{ message.user?.displayName || 'Unknown' }}
          </button>
          <span class="message-time">{{ messageTime }}</span>
          <span v-if="message.editedAt" class="edited-tag">(edited)</span>
          <ChatMessageStatus :status="message.status" :is-own="isOwn" />
        </div>

        <div v-if="message.replyTo && !message.replyTo.isDeleted" class="reply-preview">
          <div class="reply-line" />
          <span class="reply-author">{{ message.replyTo.user?.displayName || 'Unknown' }}</span>
          <span class="reply-content">{{ message.replyTo.content }}</span>
        </div>

        <MessageContent
          v-if="!message.isDeleted"
          :type="message.type"
          :content="message.content"
        />
        <div v-else class="message-content message-deleted-content">This message has been deleted</div>

        <div v-if="message.attachments.length > 0" class="message-attachments">
          <div v-for="att in message.attachments" :key="att.url" class="attachment">
            <img
              v-if="att.mime.startsWith('image/')"
              :src="att.url"
              :alt="att.name"
              class="attachment-image"
              loading="lazy"
            />
            <a v-else :href="att.url" class="attachment-file" download>
              {{ att.name }}
            </a>
          </div>
        </div>

        <ChatReactions
          :reactions="message.reactions"
          :message-id="message.serverId || message.clientId"
          :on-react="handleReact"
        />

        <div v-if="isFailed" class="failed-banner">
          <AlertCircle :size="12" />
          <span>Failed to send</span>
          <button class="retry-btn" @click="handleRetry">Retry</button>
        </div>
      </div>

      <div v-if="showActions && !message.isDeleted" class="message-actions">
        <button class="action-btn" aria-label="Reply" title="Reply" @click="handleReply">
          <MessageSquare :size="14" />
        </button>
        <button
          class="action-btn"
          :class="{ 'action-starred': isStarred }"
          aria-label="Star message"
          :title="isStarred ? 'Unstar' : 'Star'"
          @click="handleStar"
        >
          <Star :size="14" :fill="isStarred ? 'currentColor' : 'none'" />
        </button>
        <button
          v-if="isOwn && !isFailed"
          class="action-btn"
          aria-label="Edit"
          title="Edit"
          @click="handleEdit"
        >
          <Edit3 :size="14" />
        </button>
        <button
          v-if="isOwn"
          class="action-btn action-danger"
          aria-label="Delete"
          title="Delete"
          @click="handleDelete"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.message-item {
  display: flex;
  gap: 8px;
  padding: 2px 16px;
  position: relative;
  transition: background 0.1s ease;
  animation: message-enter 0.15s ease-out;
}
.message-item:hover {
  background: var(--bg-hover);
}
.message-item.message-grouped {
  padding-top: 1px;
  padding-bottom: 1px;
}
.message-item.message-grouped:hover + .message-item.message-grouped {
  padding-top: 0;
}
.message-avatar {
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
}
.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
}
.message-spacer {
  width: 36px;
  flex-shrink: 0;
}
.message-body {
  flex: 1;
  min-width: 0;
}
.message-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}
.message-author {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
}
.message-author:hover {
  text-decoration: underline;
}
.message-time {
  font-size: 10px;
  color: var(--text-muted);
}
.edited-tag {
  font-size: 10px;
  color: var(--text-muted);
  font-style: italic;
}
.message-deleted-content {
  color: var(--text-muted);
  font-style: italic;
  font-size: 13px;
}
.message-attachments {
  margin-top: 6px;
}
.attachment-image {
  max-width: 360px;
  max-height: 240px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--border);
}
.attachment-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  font-size: 13px;
  color: var(--accent-blue);
  text-decoration: none;
}
.attachment-file:hover {
  background: var(--bg-hover);
}
.reply-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  font-size: 12px;
  color: var(--text-muted);
}
.reply-line {
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: var(--accent-violet);
  flex-shrink: 0;
}
.reply-author {
  font-weight: 600;
  color: var(--accent-violet);
}
.reply-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.message-actions {
  position: absolute;
  right: 16px;
  top: 0;
  display: flex;
  gap: 2px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 5;
  animation: fade-in 0.1s ease-out;
}
.action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}
.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.action-btn.action-danger:hover {
  color: var(--danger);
}
.action-btn.action-starred {
  color: #fbbf24;
}
.action-btn.action-starred:hover {
  color: #f59e0b;
}
.failed-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--danger);
}
.retry-btn {
  background: transparent;
  border: none;
  color: var(--accent-blue);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 0;
  text-decoration: underline;
}
.system-message {
  width: 100%;
  text-align: center;
  padding: 8px 0;
}
.system-text {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}
@keyframes message-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
