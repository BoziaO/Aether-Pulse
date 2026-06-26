<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { Send, X, Paperclip } from 'lucide-vue-next'

import EmojiPicker from './EmojiPicker.vue'
import { fileToDataUrl, validateFile } from '@/utils/files'
import type { ReplyTarget } from '@/types/message.types'
import { useSettingsStore } from '@/stores/settings.store'

const props = defineProps<{
  roomId?: string
  placeholder?: string
  replyTo?: ReplyTarget | null
  initialValue?: string
  uploading?: boolean
  members?: Array<{ id: string; displayName: string }> | undefined
}>()

const emit = defineEmits<{
  (e: 'send', content: string): void
  (e: 'upload', dataUrl: string, fileName: string, caption: string): void
  (e: 'typing', isTyping: boolean): void
  (e: 'cancel-reply'): void
}>()

const input = ref(props.initialValue ?? '')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const settings = useSettingsStore()
const isCompactInput = computed(() => settings.compactChatMode || settings.chatLayout === 'compact')
const layoutClass = computed(() => `layout-${settings.chatLayout}`)
const dragOver = ref(false)
const mentionQuery = ref('')
const mentionIndex = ref(-1)
const showMentions = ref(false)
const mentionStart = ref(-1)

// Slash command registry
interface Command {
  name: string
  description: string
  run: (args: string) => string
}

const commands: Command[] = [
  {
    name: 'shrug',
    description: '¯\\_(ツ)_/¯',
    run: () => '¯\\_(ツ)_/¯',
  },
  {
    name: 'tableflip',
    description: '(╯°□°）╯︵ ┻━┻',
    run: () => '(╯°□°）╯︵ ┻━┻',
  },
  {
    name: 'me',
    description: 'Describe yourself in third person',
    run: (args: string) => `_${args}_`,
  },
]

const showSlashMenu = ref(false)
const slashFilter = ref('')
const slashIndex = ref(0)

const filteredCommands = computed(() => {
  if (!slashFilter.value) return commands
  const q = slashFilter.value.toLowerCase()
  return commands.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  )
})

// Dummy user list for mentions — real list should come from props/store
const knownUsers = computed(() => {
  // This should be populated from the room member list
  // Using a simple ref that can be set externally
  return mentionableUsers.value
})
const mentionableUsers = ref<Array<{ id: string; displayName: string }>>([])

watch(
  () => props.members,
  (m) => {
    mentionableUsers.value = m ?? []
  },
  { immediate: true }
)

const filteredMentions = computed(() => {
  if (!mentionQuery.value) return knownUsers.value
  const q = mentionQuery.value.toLowerCase()
  return knownUsers.value.filter((u) => u.displayName.toLowerCase().includes(q))
})

let typingTimeout: ReturnType<typeof setTimeout> | null = null

function resizeTextarea() {
  if (!textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 140)}px`
}

watch(input, () => {
  setTimeout(resizeTextarea, 0)
})

watch(
  () => props.initialValue,
  (v) => {
    if (v != null) {
      input.value = v
      setTimeout(resizeTextarea, 0)
    }
  }
)

function handleInput() {
  resizeTextarea()
  emit('typing', true)
  if (typingTimeout) clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => emit('typing', false), 2000)

  // Check for slash command
  const val = input.value
  const cursorPos = textareaRef.value?.selectionStart ?? val.length
  const lineStart = val.lastIndexOf('\n', cursorPos - 1) + 1
  const beforeCursor = val.slice(lineStart, cursorPos)

  if (beforeCursor === '/') {
    showSlashMenu.value = true
    slashFilter.value = ''
    slashIndex.value = 0
    showMentions.value = false
  } else if (beforeCursor.startsWith('/')) {
    showSlashMenu.value = true
    slashFilter.value = beforeCursor.slice(1)
    slashIndex.value = 0
    showMentions.value = false
  } else {
    showSlashMenu.value = false
  }

  // Check for @mention
  const atPos = val.lastIndexOf('@', cursorPos - 1)
  if (atPos >= 0 && atPos >= lineStart && (atPos === lineStart || val[atPos - 1] === ' ')) {
    const query = val.slice(atPos + 1, cursorPos)
    // Only trigger if there's no space in the query
    if (!query.includes(' ')) {
      mentionQuery.value = query
      mentionStart.value = atPos
      mentionIndex.value = 0
      showMentions.value = true
      showSlashMenu.value = false
    } else {
      showMentions.value = false
    }
  } else {
    showMentions.value = false
  }
}

function selectMention(user: { id: string; displayName: string }) {
  if (mentionStart.value < 0) return
  const before = input.value.slice(0, mentionStart.value)
  const after = input.value.slice(mentionStart.value + mentionQuery.value.length + 1)
  input.value = `${before}@${user.displayName} ${after}`
  showMentions.value = false
  mentionIndex.value = -1
  nextTick(resizeTextarea)
}

function selectSlash(command: Command) {
  const val = input.value
  const cursorPos = textareaRef.value?.selectionStart ?? val.length
  const lineStart = val.lastIndexOf('\n', cursorPos - 1) + 1
  const before = val.slice(0, lineStart)
  const after = val.slice(cursorPos)

  if (command.name === 'me') {
    input.value = `${before}/${command.name} ${after}`
  } else {
    const result = command.run('')
    input.value = `${before}${result} ${after}`
  }
  showSlashMenu.value = false
  nextTick(resizeTextarea)
}

function executeSlashCommand(content: string): string | null {
  const match = content.match(/^\/(\w+)(?:\s+(.*))?$/)
  if (!match) return null
  const cmd = commands.find((c) => c.name === match[1])
  if (!cmd) return null
  return cmd.run(match[2] || '')
}

function sendMessage() {
  let content = input.value.trim()
  if (!content) return

  const slashResult = executeSlashCommand(content)
  if (slashResult !== null) {
    content = slashResult
  }

  emit('send', content)
  emit('typing', false)
  input.value = ''
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
  if (typingTimeout) clearTimeout(typingTimeout)
  showSlashMenu.value = false
  showMentions.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (showMentions.value && filteredMentions.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      mentionIndex.value = Math.min(mentionIndex.value + 1, filteredMentions.value.length - 1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      mentionIndex.value = Math.max(mentionIndex.value - 1, 0)
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (mentionIndex.value >= 0 && filteredMentions.value[mentionIndex.value]) {
        e.preventDefault()
        selectMention(filteredMentions.value[mentionIndex.value])
        return
      }
    }
    if (e.key === 'Escape') {
      showMentions.value = false
      return
    }
  }

  if (showSlashMenu.value && filteredCommands.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      slashIndex.value = Math.min(slashIndex.value + 1, filteredCommands.value.length - 1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      slashIndex.value = Math.max(slashIndex.value - 1, 0)
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      selectSlash(filteredCommands.value[slashIndex.value])
      return
    }
    if (e.key === 'Escape') {
      showSlashMenu.value = false
      return
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
  if (e.key === 'Escape' && props.replyTo) {
    emit('cancel-reply')
  }
}

function insertEmoji(emoji: string) {
  input.value += emoji
  handleInput()
}

async function onFileSelected(e: Event) {
  fileError.value = ''
  const inputEl = e.target as HTMLInputElement
  const file = inputEl.files?.[0]
  if (!file) return

  const err = validateFile(file)
  if (err) {
    fileError.value = err
    inputEl.value = ''
    return
  }

  try {
    const dataUrl = await fileToDataUrl(file)
    emit('upload', dataUrl, file.name, input.value.trim())
    input.value = ''
  } catch {
    fileError.value = 'Failed to read file'
  } finally {
    inputEl.value = ''
  }
}

// Drag & drop
function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false

  const file = e.dataTransfer?.files?.[0]
  if (!file) return

  const err = validateFile(file)
  if (err) {
    fileError.value = err
    return
  }

  try {
    const dataUrl = await fileToDataUrl(file)
    emit('upload', dataUrl, file.name, input.value.trim())
    input.value = ''
  } catch {
    fileError.value = 'Failed to read file'
  }
}
</script>

<template>
  <div
    class="chat-input-area"
    :class="[layoutClass, { compact: isCompactInput, 'drag-over': dragOver }]"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div v-if="replyTo" class="reply-bar">
      <span
        >Replying to <strong>{{ replyTo.user?.displayName || 'Unknown' }}</strong></span
      >
      <button type="button" class="cancel-reply" @click="emit('cancel-reply')">
        <X :size="14" />
      </button>
    </div>
    <p v-if="fileError" class="file-error">{{ fileError }}</p>

    <!-- Slash command menu -->
    <div v-if="showSlashMenu && filteredCommands.length > 0" class="slash-menu">
      <button
        v-for="(cmd, i) in filteredCommands"
        :key="cmd.name"
        class="slash-item"
        :class="{ active: i === slashIndex }"
        @click="selectSlash(cmd)"
        @mouseenter="slashIndex = i"
      >
        <span class="slash-name">/{{ cmd.name }}</span>
        <span class="slash-desc">{{ cmd.description }}</span>
      </button>
    </div>

    <!-- Mention autocomplete -->
    <div v-if="showMentions && filteredMentions.length > 0" class="mention-menu">
      <button
        v-for="(user, i) in filteredMentions"
        :key="user.id"
        class="mention-item"
        :class="{ active: i === mentionIndex }"
        @click="selectMention(user)"
        @mouseenter="mentionIndex = i"
      >
        <span class="mention-name">@{{ user.displayName }}</span>
      </button>
    </div>

    <div class="chat-input-wrap">
      <input ref="fileInput" type="file" class="hidden-file" @change="onFileSelected" />
      <button
        type="button"
        class="attach-btn"
        title="Upload file"
        :disabled="uploading"
        @click="fileInput?.click()"
      >
        <Paperclip :size="16" />
      </button>
      <EmojiPicker @select="insertEmoji" />
      <textarea
        ref="textareaRef"
        v-model="input"
        class="chat-input"
        :placeholder="placeholder || 'Message... (Markdown supported)'"
        rows="1"
        @keydown="handleKeydown"
        @input="handleInput"
      />
      <button class="send-btn" :disabled="!input.trim() || uploading" @click="sendMessage">
        <Send :size="16" />
      </button>
    </div>
    <div class="input-hint">Attach images, PDF, ZIP, audio · max 10MB</div>
  </div>
</template>

<style scoped>
.chat-input-area {
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
  position: relative;
  transition: border-color 0.15s;
}
.chat-input-area.drag-over {
  border-color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.05);
}
.chat-input-area.compact .reply-bar {
  padding-top: 6px;
}
.chat-input-area.layout-bubble {
  margin: 0 12px 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
}
.chat-input-area.layout-modern {
  border-top-color: rgba(139, 92, 246, 0.12);
}
.chat-input-area.layout-compact .chat-input-wrap {
  padding-top: 10px;
  padding-bottom: 6px;
}
.reply-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 0;
  font-size: 12px;
  color: var(--text-muted);
}
.reply-bar strong {
  color: var(--accent-violet);
}
.cancel-reply {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}
.cancel-reply:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.file-error {
  padding: 6px 16px 0;
  font-size: 12px;
  color: var(--danger);
}
.hidden-file {
  display: none;
}
.chat-input-wrap {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px 8px;
}
.chat-input-area.compact .chat-input-wrap {
  gap: 6px;
}
.attach-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
}
.attach-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.attach-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.chat-input {
  flex: 1;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 14px;
  resize: none;
  outline: none;
  max-height: 140px;
  font-family: inherit;
  line-height: 1.45;
  min-height: 42px;
}
.chat-input-area.layout-bubble .chat-input {
  background: var(--bg-surface-2);
  border-radius: 999px;
  padding-left: 16px;
  padding-right: 16px;
}
.chat-input-area.layout-compact .chat-input {
  min-height: 38px;
  padding-top: 8px;
  padding-bottom: 8px;
}
.chat-input:focus {
  border-color: var(--accent-violet);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.12);
}
.chat-input::placeholder {
  color: var(--text-muted);
}
.send-btn {
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  border: none;
  border-radius: 10px;
  padding: 10px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.04);
}
.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.input-hint {
  padding: 0 16px 10px;
  font-size: 11px;
  color: var(--text-muted);
}
.chat-input-area.compact .input-hint {
  padding-bottom: 8px;
}

/* Slash command menu */
.slash-menu {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  z-index: 10;
}
.slash-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
}
.slash-item.active {
  background: var(--bg-hover);
}
.slash-name {
  font-weight: 600;
  color: var(--accent-violet);
  flex-shrink: 0;
}
.slash-desc {
  color: var(--text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mention autocomplete */
.mention-menu {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  z-index: 10;
}
.mention-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
}
.mention-item.active {
  background: var(--bg-hover);
}
.mention-name {
  font-weight: 600;
  color: var(--accent-blue);
}

/* Mobile responsive styles */
@media (max-width: 767px) {
  .chat-input-area.layout-bubble {
    margin: 0 !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
  }
}
</style>
