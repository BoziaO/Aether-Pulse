import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import type { Message } from '../types/message.types'
import type { UploadState, MentionState, MentionMatch, UploadStatus } from '../types/composer.types'
import { getFilteredCommands, executeCommand, isSlashCommand } from '../utils/command.utils'
import { parseMention, filterMentions } from '../utils/mention.utils'
import { generateClientId } from '../utils/message.utils'

export const useComposerStore = defineStore('chatComposer', () => {
  const content = ref('')
  const replyTo = ref<Message | null>(null)
  const editingMessage = ref<Message | null>(null)
  const editContent = ref('')
  const uploads = ref<UploadState[]>([])
  const showEmojiPicker = ref(false)
  const cursorPos = ref(0)
  const isFocused = ref(false)

  const mentions = ref<MentionState>({
    query: '',
    selectedIndex: 0,
    matches: [],
    visible: false,
  })

  const commands = ref({
    visible: false,
    query: '',
    selectedIndex: 0,
  })

  const isEditing = computed(() => editingMessage.value !== null)
  const isReplying = computed(() => replyTo.value !== null)
  const hasContent = computed(() => content.value.trim().length > 0)
  const isUploading = computed(() =>
    uploads.value.some((u) => u.status === 'compressing' || u.status === 'uploading')
  )
  const activeUploads = computed(() => uploads.value.filter((u) => u.status !== 'uploaded'))

  function setContent(text: string): void {
    content.value = text
    detectCommands()
    detectMentions()
  }

  function setCursorPos(pos: number): void {
    cursorPos.value = pos
  }

  function setReply(message: Message | null): void {
    replyTo.value = message
  }

  function setEditing(message: Message | null): void {
    editingMessage.value = message
    editContent.value = message?.content || ''
  }

  function cancelReply(): void {
    replyTo.value = null
  }

  function cancelEdit(): void {
    editingMessage.value = null
    editContent.value = ''
  }

  function clear(): void {
    content.value = ''
    cursorPos.value = 0
    showEmojiPicker.value = false
    mentions.value.visible = false
    commands.value.visible = false
  }

  function resetAll(): void {
    clear()
    replyTo.value = null
    editingMessage.value = null
    editContent.value = ''
    uploads.value = []
  }

  function insertText(text: string): void {
    const before = content.value.slice(0, cursorPos.value)
    const after = content.value.slice(cursorPos.value)
    content.value = `${before}${text}${after}`
    cursorPos.value += text.length
  }

  function insertAtCursor(text: string): void {
    insertText(text)
  }

  function detectMentions(): void {
    const parsed = parseMention(content.value, cursorPos.value)
    if (!parsed) {
      mentions.value.visible = false
      return
    }

    mentions.value = {
      query: parsed.query,
      selectedIndex: 0,
      matches: [],
      visible: true,
    }
  }

  function updateMentionMatches(members: MentionMatch[]): void {
    if (!mentions.value.visible) return
    mentions.value.matches = filterMentions(mentions.value.query, members)
    if (mentions.value.matches.length === 0) {
      mentions.value.visible = false
    }
  }

  function selectMention(match: MentionMatch): void {
    const parsed = parseMention(content.value, cursorPos.value)
    if (!parsed) return

    const before = content.value.slice(0, parsed.startIndex)
    const after = content.value.slice(parsed.endIndex)
    const insert = `@${match.username || match.displayName.replace(/\s+/g, '')} `
    content.value = before + insert + after
    cursorPos.value = before.length + insert.length
    mentions.value.visible = false
  }

  function detectCommands(): void {
    const text = content.value
    if (!text.startsWith('/')) {
      commands.value.visible = false
      return
    }

    const firstSpace = text.indexOf(' ')
    const cmdText = firstSpace === -1 ? text : text.slice(0, firstSpace)
    const filtered = getFilteredCommands(cmdText)

    commands.value = {
      visible: filtered.length > 0,
      query: cmdText,
      selectedIndex: 0,
    }
  }

  function executeSlashCommand(): string | null {
    if (!isSlashCommand(content.value)) return null
    const result = executeCommand(content.value)
    if (result !== content.value) {
      content.value = result
      return result
    }
    return null
  }

  function navigateMentions(direction: 'up' | 'down'): void {
    const max = mentions.value.matches.length
    if (max === 0) return
    mentions.value.selectedIndex =
      direction === 'down'
        ? (mentions.value.selectedIndex + 1) % max
        : (mentions.value.selectedIndex - 1 + max) % max
  }

  function navigateCommands(direction: 'up' | 'down'): void {
    const filtered = getFilteredCommands(commands.value.query)
    const max = filtered.length
    if (max === 0) return
    commands.value.selectedIndex =
      direction === 'down'
        ? (commands.value.selectedIndex + 1) % max
        : (commands.value.selectedIndex - 1 + max) % max
  }

  function addUpload(file: File): void {
    const upload: UploadState = {
      id: generateClientId(),
      file,
      progress: 0,
      status: 'compressing',
    }
    uploads.value = [...uploads.value, upload]
  }

  function updateUpload(id: string, updates: Partial<UploadState>): void {
    uploads.value = uploads.value.map((u) => (u.id === id ? { ...u, ...updates } : u))
  }

  function removeUpload(id: string): void {
    uploads.value = uploads.value.filter((u) => u.id !== id)
  }

  function updateUploadProgress(id: string, progress: number): void {
    updateUpload(id, { progress })
  }

  function setUploadStatus(id: string, status: UploadStatus): void {
    updateUpload(id, { status })
  }

  function clearUploads(): void {
    uploads.value = []
  }

  function toggleEmojiPicker(): void {
    showEmojiPicker.value = !showEmojiPicker.value
  }

  function closeEmojiPicker(): void {
    showEmojiPicker.value = false
  }

  function setFocused(focused: boolean): void {
    isFocused.value = focused
  }

  return {
    content,
    replyTo,
    editingMessage,
    editContent,
    uploads,
    showEmojiPicker,
    cursorPos,
    isFocused,
    mentions,
    commands,
    isEditing,
    isReplying,
    hasContent,
    isUploading,
    activeUploads,
    setContent,
    setCursorPos,
    setReply,
    setEditing,
    cancelReply,
    cancelEdit,
    clear,
    resetAll,
    insertText,
    insertAtCursor,
    updateMentionMatches,
    selectMention,
    executeSlashCommand,
    navigateMentions,
    navigateCommands,
    addUpload,
    updateUpload,
    removeUpload,
    updateUploadProgress,
    setUploadStatus,
    clearUploads,
    toggleEmojiPicker,
    closeEmojiPicker,
    setFocused,
  }
})
