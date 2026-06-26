<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Send, Paperclip, Smile, X } from 'lucide-vue-next'

import { useComposerStore } from '../stores/composer.store'
import ChatUploadPreview from './ChatUploadPreview.vue'
import { useUpload } from '../composables/useUpload'
import type { MentionMatch } from '../types/composer.types'
import { validateFile } from '../utils/upload.utils'
import { getFilteredCommands } from '../utils/command.utils'

const props = defineProps<{
  roomId: string
  members?: Array<{ id: string; displayName: string; status?: string | undefined }>
}>()

const emit = defineEmits<{
  (e: 'send', content: string): void
  (e: 'typing', isTyping: boolean): void
}>()

const composerStore = useComposerStore()
const { uploadFile, retryUpload, removeUpload } = useUpload(props.roomId)

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const memberOptions = computed<MentionMatch[]>(() => {
  return (props.members || []).map((m) => ({
    id: m.id,
    displayName: m.displayName,
    username: m.displayName,
  }))
})

const placeholderText = computed(() => {
  if (composerStore.isEditing) return 'Edit your message...'
  return `Message #${props.members?.[0]?.displayName || 'chat'}`
})

let typingTimeout: ReturnType<typeof setTimeout> | null = null
const TYPING_DEBOUNCE = 2000

function onInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  composerStore.setContent(target.value)
  composerStore.setCursorPos(target.selectionStart)
  autoResize()
  notifyTyping()
}

function onClick(): void {
  if (textareaRef.value) {
    composerStore.setCursorPos(textareaRef.value.selectionStart)
  }
}

function autoResize(): void {
  if (!textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 140) + 'px'
}

function notifyTyping(): void {
  emit('typing', true)
  if (typingTimeout) clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => emit('typing', false), TYPING_DEBOUNCE)
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (composerStore.mentions.visible || composerStore.commands.visible) return
    sendMessage()
    return
  }

  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    sendMessage()
    return
  }

  if (e.key === 'Escape') {
    if (composerStore.isReplying) {
      composerStore.cancelReply()
      return
    }
    if (composerStore.isEditing) {
      composerStore.cancelEdit()
      return
    }
    if (composerStore.showEmojiPicker) {
      composerStore.closeEmojiPicker()
      return
    }
  }

  if (composerStore.mentions.visible) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      composerStore.navigateMentions('down')
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      composerStore.navigateMentions('up')
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const match = composerStore.mentions.matches[composerStore.mentions.selectedIndex]
      if (match) composerStore.selectMention(match)
      return
    }
  }

  if (composerStore.commands.visible) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      composerStore.navigateCommands('down')
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      composerStore.navigateCommands('up')
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const filtered = getFilteredCommands(composerStore.commands.query)
      const cmd = filtered[composerStore.commands.selectedIndex]
      if (cmd) composerStore.setContent(cmd.name + ' ')
      return
    }
  }
}

function sendMessage(): void {
  if (!composerStore.hasContent && composerStore.uploads.length === 0) return

  if (composerStore.uploads.length > 0) {
    for (const upload of composerStore.uploads) {
      if (upload.status === 'compressing' || upload.status === 'uploading') return
    }
  }

  const transformed = composerStore.executeSlashCommand()
  const content = transformed || composerStore.content
  if (!content.trim() && composerStore.uploads.length === 0) return

  if (composerStore.isEditing) {
    emit('send', content)
    composerStore.cancelEdit()
    return
  }

  emit('send', content)
  composerStore.clear()
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  for (const file of Array.from(input.files)) {
    const validation = validateFile(file)
    if (validation.valid) {
      uploadFile(file)
    }
  }
  input.value = ''
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault()
  e.stopPropagation()
}

function handleDrop(e: DragEvent): void {
  e.preventDefault()
  e.stopPropagation()
  if (!e.dataTransfer?.files.length) return
  for (const file of Array.from(e.dataTransfer.files)) {
    const validation = validateFile(file)
    if (validation.valid) {
      uploadFile(file)
    }
  }
}

watch(
  () => composerStore.mentions.visible,
  () => {
    composerStore.updateMentionMatches(memberOptions.value)
  }
)

watch(
  () => (props.members || []).length,
  () => {
    composerStore.updateMentionMatches(memberOptions.value)
  }
)

watch(
  () => composerStore.content,
  () => {
    autoResize()
  }
)
</script>

<template>
  <div class="composer-wrapper" @dragover="handleDragOver" @drop="handleDrop">
    <div v-if="composerStore.isReplying" class="reply-bar">
      <div class="reply-info">
        <span class="reply-label">Replying to</span>
        <span class="reply-name">{{ composerStore.replyTo?.user?.displayName || 'message' }}</span>
        <span class="reply-preview">{{ composerStore.replyTo?.content?.slice(0, 80) }}</span>
      </div>
      <button class="reply-cancel" aria-label="Cancel reply" @click="composerStore.cancelReply">
        <X :size="14" />
      </button>
    </div>

    <div v-if="composerStore.isEditing" class="edit-bar">
      <div class="edit-info">
        <span class="edit-label">Editing message</span>
      </div>
      <button class="edit-cancel" aria-label="Cancel edit" @click="composerStore.cancelEdit">
        <X :size="14" />
      </button>
    </div>

    <ChatUploadPreview
      :uploads="composerStore.activeUploads"
      @remove="removeUpload"
      @retry="retryUpload"
    />

    <div class="composer-input-row">
      <button
        class="composer-btn"
        :aria-label="'Attach file'"
        title="Attach file"
        @click="fileInputRef?.click()"
      >
        <Paperclip :size="18" />
      </button>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="file-input-hidden"
        aria-hidden="true"
        @change="handleFileSelect"
      />

      <div class="input-area">
        <textarea
          ref="textareaRef"
          :value="composerStore.content"
          :placeholder="placeholderText"
          class="composer-textarea"
          rows="1"
          :aria-label="placeholderText"
          @input="onInput"
          @click="onClick"
          @keydown="handleKeydown"
        />
      </div>

      <button
        class="composer-btn"
        :aria-label="'Emoji picker'"
        title="Emoji"
        @click="composerStore.toggleEmojiPicker()"
      >
        <Smile :size="18" />
      </button>

      <button
        class="composer-btn send-btn"
        :class="{ active: composerStore.hasContent }"
        :disabled="!composerStore.hasContent && composerStore.uploads.length === 0"
        :aria-label="'Send message'"
        title="Send"
        @click="sendMessage"
      >
        <Send :size="18" />
      </button>
    </div>

    <div
      v-if="composerStore.mentions.visible && composerStore.mentions.matches.length > 0"
      class="mentions-popup"
    >
      <button
        v-for="(match, idx) in composerStore.mentions.matches"
        :key="match.id"
        :class="['mention-item', { selected: idx === composerStore.mentions.selectedIndex }]"
        @mousedown.prevent="composerStore.selectMention(match)"
      >
        <span class="mention-name">{{ match.displayName }}</span>
        <span v-if="match.username" class="mention-username">@{{ match.username }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.composer-wrapper {
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
  position: relative;
}
.reply-bar,
.edit-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border);
}
.reply-info,
.edit-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  min-width: 0;
}
.reply-label,
.edit-label {
  color: var(--accent-violet);
  font-weight: 600;
}
.reply-name {
  color: var(--text-primary);
  font-weight: 600;
}
.reply-preview {
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reply-cancel,
.edit-cancel {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}
.reply-cancel:hover,
.edit-cancel:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.composer-input-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 8px 12px;
}
.composer-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.composer-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.send-btn.active {
  color: var(--accent-violet);
}
.send-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.file-input-hidden {
  display: none;
}
.input-area {
  flex: 1;
  min-width: 0;
}
.composer-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  padding: 4px 0;
  max-height: 140px;
  font-family: inherit;
}
.composer-textarea::placeholder {
  color: var(--text-muted);
}
.mentions-popup {
  position: absolute;
  bottom: 100%;
  left: 12px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 30;
  min-width: 200px;
  padding: 4px 0;
}
.mention-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
}
.mention-item:hover,
.mention-item.selected {
  background: var(--bg-hover);
}
.mention-name {
  font-weight: 600;
  color: var(--text-primary);
}
.mention-username {
  color: var(--text-muted);
  font-size: 12px;
}
</style>
