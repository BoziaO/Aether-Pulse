<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    Reply,
    Pencil,
    Trash2,
    SmilePlus,
    Download,
    FileText,
    Check,
    CheckCheck,
    Loader,
  } from 'lucide-vue-next'

  import type { Message } from '@/types/message.types'
  import { useSettingsStore } from '@/stores/settings.store'
  import UserAvatar from '@/components/profile/UserAvatar.vue'
  import MessageContent from './MessageContent.vue'

  const props = defineProps<{
    message: Message
    isOwn?: boolean | undefined
    showAvatar?: boolean | undefined
    showAuthor?: boolean | undefined
    roomId?: string | undefined
    currentUserId?: string | undefined
  }>()

  const emit = defineEmits<{
    (e: 'open-profile', userId: string): void
    (e: 'reply', message: Message): void
    (e: 'edit', message: Message): void
    (e: 'delete', messageId: string): void
    (e: 'react', messageId: string, emoji: string): void
  }>()

  const showActions = ref(false)
  const showReactionPicker = ref(false)
  const settings = useSettingsStore()

  const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉']
  const isCompactMessage = computed(
    () => settings.compactChatMode || settings.chatLayout === 'compact'
  )
  const layoutClass = computed(() => `layout-${settings.chatLayout}`)

  const displayName = computed(() => props.message.user?.displayName || 'Unknown')

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function hasReacted(reaction: { emoji: string; userIds: string[] }) {
    return props.currentUserId != null && reaction.userIds.includes(props.currentUserId)
  }

  const isImage = computed(() => props.message.attachmentMime?.startsWith('image/') ?? false)

  const replyId = computed(() => props.message.replyTo?.id)

  const truncatedContent = computed(() => {
    const content = props.message.replyTo?.content
    if (!content) return ''
    return content.length > 100 ? content.slice(0, 100) + '...' : content
  })

  function scrollToMessage(id: string | undefined) {
    if (!id) return
    const el = document.getElementById('message-' + id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function hideActions() {
    showActions.value = false
    showReactionPicker.value = false
  }

  function selectReaction(emoji: string) {
    emit('react', props.message.id, emoji)
    showReactionPicker.value = false
  }

  const statusIcon = computed(() => {
    if (!props.isOwn) return null
    switch (props.message.status) {
      case 'sending':
        return Loader
      case 'delivered':
        return Check
      case 'read':
        return CheckCheck
      default:
        return null
    }
  })

  const statusLabel = computed(() => {
    if (!props.isOwn) return ''
    switch (props.message.status) {
      case 'sending':
        return 'Sending'
      case 'delivered':
        return 'Delivered'
      case 'read':
        return 'Read'
      default:
        return ''
    }
  })
</script>

<template>
  <div
    :id="'message-' + message.id"
    class="message"
    :class="[
      {
        own: isOwn,
        system: message.type === 'system',
        grouped: !showAvatar && message.type !== 'system',
      },
      layoutClass,
      { compact: isCompactMessage },
    ]"
    @mouseenter="showActions = true"
    @mouseleave="hideActions"
    @focusin="showActions = true"
    @focusout="hideActions"
    @dblclick="isOwn && !message.isDeleted && emit('edit', message)"
  >
    <div v-if="showAvatar && message.type !== 'system'" class="message-avatar">
      <button
        v-if="message.user?.id"
        class="avatar-btn"
        type="button"
        title="View profile"
        @click="emit('open-profile', message.user!.id)"
      >
        <UserAvatar :user="message.user" :size="36" />
      </button>
      <UserAvatar v-else :user="message.user" :size="36" />
    </div>

    <div class="message-body">
      <div v-if="message.replyTo" class="reply-preview" @click="scrollToMessage(replyId)">
        <Reply :size="12" />
        <div class="reply-author">{{ message.replyTo.user?.displayName || 'Unknown' }}</div>
        <div class="reply-content">
          {{ message.replyTo.isDeleted ? 'Message deleted' : truncatedContent }}
        </div>
      </div>

      <div v-if="showAuthor && message.type !== 'system'" class="message-meta">
        <button
          v-if="message.user?.id"
          class="author-btn"
          :class="
            message.user?.displayNameStyle ? `name-style-${message.user.displayNameStyle}` : ''
          "
          type="button"
          @click="emit('open-profile', message.user!.id)"
        >
          {{ displayName }}
        </button>
        <span
          v-else
          class="message-author"
          :class="
            message.user?.displayNameStyle ? `name-style-${message.user.displayNameStyle}` : ''
          "
        >
          {{ displayName }}
        </span>
        <span class="message-time">{{ formatTime(message.createdAt) }}</span>
        <span v-if="message.editedAt" class="edited-tag">edited</span>
        <span v-if="statusIcon" class="message-status" :title="statusLabel">
          <component :is="statusIcon" :size="12" />
        </span>
      </div>

      <div v-if="message.isDeleted" class="deleted-msg">Message deleted</div>
      <template v-else-if="message.type === 'file' && message.attachmentUrl">
        <a
          v-if="isImage"
          :href="message.attachmentUrl"
          target="_blank"
          rel="noreferrer"
          class="attachment-image"
        >
          <img
            :src="message.attachmentUrl"
            :alt="message.attachmentName || 'Image'"
            loading="lazy"
            decoding="async"
          />
        </a>
        <a
          v-else
          :href="message.attachmentUrl"
          target="_blank"
          rel="noreferrer"
          class="attachment-file"
        >
          <FileText :size="18" />
          <span>{{ message.attachmentName || 'Download file' }}</span>
          <Download :size="14" />
        </a>
        <MessageContent
          v-if="message.content && message.content !== message.attachmentName"
          :content="message.content"
          type="text"
        />
      </template>
      <MessageContent v-else :content="message.content" :type="message.type" />

      <div v-if="message.reactions?.length" class="reactions">
        <button
          v-for="reaction in message.reactions"
          :key="reaction.emoji"
          class="reaction-chip"
          :class="{ active: hasReacted(reaction) }"
          type="button"
          @click="emit('react', message.id, reaction.emoji)"
        >
          {{ reaction.emoji }} {{ reaction.count }}
        </button>
      </div>
    </div>

    <div
      v-if="showActions && message.type !== 'system' && !message.isDeleted"
      class="message-actions"
    >
      <button type="button" title="Reply" @click="emit('reply', message)">
        <Reply :size="14" />
      </button>
      <button type="button" title="React" @click="showReactionPicker = !showReactionPicker">
        <SmilePlus :size="14" />
      </button>
      <button v-if="isOwn" type="button" title="Edit" @click="emit('edit', message)">
        <Pencil :size="14" />
      </button>
      <button v-if="isOwn" type="button" title="Delete" @click="emit('delete', message.id)">
        <Trash2 :size="14" />
      </button>
    </div>

    <div v-if="showReactionPicker" class="reaction-picker">
      <button
        v-for="emoji in QUICK_REACTIONS"
        :key="emoji"
        type="button"
        @click="selectReaction(emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 16px;
  border-radius: 4px;
  position: relative;
  transition: background 0.1s;
}
.message:hover {
  background: rgba(255, 255, 255, 0.025);
}
.message.compact {
  gap: 10px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.message.grouped {
  padding-top: 2px;
  padding-bottom: 2px;
}
.message.layout-compact {
  padding-left: 12px;
  padding-right: 12px;
}
.message.layout-bubble {
  margin: 4px 12px;
  padding: 10px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.message.layout-bubble:hover {
  background: var(--bg-surface-2);
}
.message.layout-bubble.own {
  margin-left: 56px;
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.18);
}
.message.layout-modern {
  border-radius: 10px;
}
.message.layout-modern:hover {
  background: rgba(255, 255, 255, 0.03);
}
.message.system {
  padding-left: 56px;
}
.message.layout-compact.system {
  padding-left: 44px;
}
.message-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}
.message.compact .message-avatar {
  margin-top: 0;
}
.message-body {
  flex: 1;
  min-width: 0;
}
.message.layout-bubble .message-body {
  width: 100%;
}
.reply-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  border-left: 3px solid var(--accent-violet);
  padding-left: 8px;
  margin-bottom: 4px;
  overflow: hidden;
}
.reply-author {
  font-weight: 700;
  color: var(--text-secondary);
  white-space: nowrap;
}
.reply-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.message-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 3px;
}
.message.compact .message-meta {
  gap: 6px;
}
.message-author,
.author-btn {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.author-btn,
.avatar-btn {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}
.author-btn:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.message-time,
.edited-tag {
  font-size: 11px;
  color: var(--text-muted);
}
.message-status {
  display: inline-flex;
  align-items: center;
  color: var(--text-muted);
}
.deleted-msg {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
}
.reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.message.compact .reactions {
  gap: 4px;
}
.reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}
.reaction-chip.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.15);
}
.message-actions {
  position: absolute;
  top: -10px;
  right: 12px;
  display: flex;
  gap: 2px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.message.layout-bubble .message-actions,
.message.layout-bubble .reaction-picker {
  top: -12px;
  right: 10px;
}
.message-actions button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  display: flex;
}
.message-actions button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.reaction-picker {
  position: absolute;
  top: -10px;
  right: 12px;
  display: flex;
  gap: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.reaction-picker button {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}
.reaction-picker button:hover {
  background: var(--bg-hover);
}
.attachment-image {
  display: block;
  max-width: min(100%, 320px);
  margin-top: 4px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.attachment-image img {
  display: block;
  width: 100%;
  max-height: 280px;
  object-fit: cover;
}
.attachment-file {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
}
.attachment-file:hover {
  border-color: var(--border-accent);
  color: var(--text-primary);
}
</style>
