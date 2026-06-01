<script setup lang="ts">
import { ref, computed } from 'vue'
import { Reply, Pencil, Trash2, SmilePlus, Download, FileText } from 'lucide-vue-next'
import type { Message } from '@/types/message.types'
import UserAvatar from '@/components/profile/UserAvatar.vue'
import MessageContent from './MessageContent.vue'

const props = defineProps<{
  message: Message
  isOwn?: boolean
  showAvatar?: boolean
  roomId?: string
  currentUserId?: number
}>()

const emit = defineEmits<{
  (e: 'open-profile', userId: number): void
  (e: 'reply', message: Message): void
  (e: 'edit', message: Message): void
  (e: 'delete', messageId: number): void
  (e: 'react', messageId: number, emoji: string): void
}>()

const showActions = ref(false)
const showReactionPicker = ref(false)

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉']

const displayName = computed(() => props.message.user?.displayName || 'Unknown')

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function hasReacted(reaction: { emoji: string; userIds: number[] }) {
  return props.currentUserId != null && reaction.userIds.includes(props.currentUserId)
}

const isImage = computed(() =>
  props.message.attachmentMime?.startsWith('image/') ?? false,
)
</script>

<template>
  <div
    class="message"
    :class="{ own: isOwn, system: message.type === 'system' }"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false; showReactionPicker = false"
    @dblclick="isOwn && !message.isDeleted && emit('edit', message)"
  >
    <div v-if="showAvatar !== false && message.type !== 'system'" class="message-avatar">
      <button
        v-if="message.user?.id"
        class="avatar-btn"
        type="button"
        @click="emit('open-profile', message.user!.id)"
        title="View profile"
      >
        <UserAvatar :user="message.user" :size="36" />
      </button>
      <UserAvatar v-else :user="message.user" :size="36" />
    </div>

    <div class="message-body">
      <div v-if="message.replyTo" class="reply-preview">
        <Reply :size="12" />
        <span>{{ message.replyTo.isDeleted ? 'Message deleted' : message.replyTo.content }}</span>
      </div>

      <div v-if="showAvatar !== false && message.type !== 'system'" class="message-meta">
        <button
          v-if="message.user?.id"
          class="author-btn"
          type="button"
          @click="emit('open-profile', message.user!.id)"
        >
          {{ displayName }}
        </button>
        <span v-else class="message-author">{{ displayName }}</span>
        <span class="message-time">{{ formatTime(message.createdAt) }}</span>
        <span v-if="message.editedAt" class="edited-tag">edited</span>
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
          <img :src="message.attachmentUrl" :alt="message.attachmentName || 'Image'" />
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
      <MessageContent
        v-else
        :content="message.content"
        :type="message.type"
      />

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

    <div v-if="showActions && message.type !== 'system' && !message.isDeleted" class="message-actions">
      <button type="button" title="Reply" @click="emit('reply', message)"><Reply :size="14" /></button>
      <button type="button" title="React" @click="showReactionPicker = !showReactionPicker"><SmilePlus :size="14" /></button>
      <button v-if="isOwn" type="button" title="Edit" @click="emit('edit', message)"><Pencil :size="14" /></button>
      <button v-if="isOwn" type="button" title="Delete" @click="emit('delete', message.id)"><Trash2 :size="14" /></button>
    </div>

    <div v-if="showReactionPicker" class="reaction-picker">
      <button
        v-for="emoji in QUICK_REACTIONS"
        :key="emoji"
        type="button"
        @click="emit('react', message.id, emoji); showReactionPicker = false"
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
.message.system {
  padding-left: 56px;
}
.message-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}
.message-body {
  flex: 1;
  min-width: 0;
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
  text-overflow: ellipsis;
  white-space: nowrap;
}
.message-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 3px;
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
