<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
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
  const isCompactInput = computed(
    () => settings.compactChatMode || settings.chatLayout === 'compact'
  )
  const layoutClass = computed(() => `layout-${settings.chatLayout}`)
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
  }

  function sendMessage() {
    const content = input.value.trim()
    if (!content) return
    emit('send', content)
    emit('typing', false)
    input.value = ''
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
    if (typingTimeout) clearTimeout(typingTimeout)
  }

  function handleKeydown(e: KeyboardEvent) {
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
</script>

<template>
  <div class="chat-input-area" :class="[layoutClass, { compact: isCompactInput }]">
    <div v-if="replyTo" class="reply-bar">
      <span
      >Replying to <strong>{{ replyTo.user?.displayName || 'Unknown' }}</strong></span
      >
      <button type="button" class="cancel-reply" @click="emit('cancel-reply')">
        <X :size="14" />
      </button>
    </div>
    <p v-if="fileError" class="file-error">{{ fileError }}</p>
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
