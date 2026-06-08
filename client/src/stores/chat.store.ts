import { defineStore } from 'pinia'
import { ref } from 'vue'
import { roomApi } from '@/services/api/room.api'
import { getSocket } from '@/services/socket/socket'
import { notifyNewMessage } from '@/utils/notifications'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import type { Message } from '@/types/message.types'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const uploading = ref(false)
  const hasMore = ref(true)
  const typingUsers = ref<Set<string>>(new Set())
  const replyTo = ref<Message | null>(null)
  const searchResults = ref<Message[]>([])
  const searchQuery = ref('')
  let currentRoomId: string | null = null

  async function loadMessages(roomId: string) {
    currentRoomId = roomId
    loading.value = true
    hasMore.value = true
    try {
      const msgs = await roomApi.messages(roomId, { limit: 50 })
      messages.value = msgs
      hasMore.value = msgs.length >= 50
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to load messages')
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!currentRoomId || loadingMore.value || !hasMore.value || messages.value.length === 0) return
    loadingMore.value = true
    try {
      const oldest = messages.value[0]?.id
      if (!oldest) return
      const older = await roomApi.messages(currentRoomId, { before: oldest, limit: 50 })
      if (older.length === 0) {
        hasMore.value = false
      } else {
        messages.value = [...older, ...messages.value]
        hasMore.value = older.length >= 50
      }
    } catch (e) {
      console.error('Failed to load more messages', e)
      useToastStore().error(e instanceof Error ? e.message : 'Failed to load older messages')
    } finally {
      loadingMore.value = false
    }
  }

  async function searchMessages(roomId: string, q: string) {
    searchQuery.value = q
    if (!q.trim()) {
      searchResults.value = []
      return
    }
    try {
      searchResults.value = await roomApi.searchMessages(roomId, q.trim())
    } catch (e) {
      console.error('Search failed', e)
      searchResults.value = []
      useToastStore().error(e instanceof Error ? e.message : 'Search failed')
    }
  }

  function upsertMessage(message: Message) {
    const idx = messages.value.findIndex((m) => m.id === message.id)
    if (idx >= 0) {
      messages.value[idx] = message
    } else {
      messages.value.push(message)
    }
  }

  function addMessage(message: Message) {
    if (messages.value.find((m) => m.id === message.id)) return
    messages.value.push(message)

    const auth = useAuthStore()
    if (message.type === 'text' && message.user && message.userId !== auth.user?.id) {
      notifyNewMessage(message.user.displayName, message.content.slice(0, 120))
    }
  }

  function updateMessage(message: Message) {
    upsertMessage(message)
  }

  function sendMessage(roomId: string, userId: string, content: string) {
    const socket = getSocket()
    socket.emit('chat-message', {
      roomId,
      userId,
      content,
      replyToId: replyTo.value?.id,
    })
    replyTo.value = null
  }

  async function editMessage(roomId: string, messageId: string, content: string) {
    try {
      const updated = await roomApi.editMessage(roomId, messageId, content)
      upsertMessage(updated)
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to edit message')
      throw e
    }
  }

  async function deleteMessage(roomId: string, messageId: string) {
    try {
      const updated = await roomApi.deleteMessage(roomId, messageId)
      upsertMessage(updated)
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to delete message')
      throw e
    }
  }

  async function toggleReaction(roomId: string, messageId: string, emoji: string) {
    try {
      const updated = await roomApi.toggleReaction(roomId, messageId, emoji)
      upsertMessage(updated)
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to update reaction')
      throw e
    }
  }

  async function uploadFile(roomId: string, dataUrl: string, fileName: string, caption?: string) {
    uploading.value = true
    try {
      const msg = await roomApi.uploadFile(roomId, dataUrl, fileName, caption, replyTo.value?.id)
      upsertMessage(msg)
      replyTo.value = null
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'File upload failed')
      throw e
    } finally {
      uploading.value = false
    }
  }

  function setReply(message: Message | null) {
    replyTo.value = message
  }

  function setTyping(roomId: string, userId: string, isTyping: boolean) {
    const socket = getSocket()
    socket.emit('user-typing', { roomId, userId, isTyping })
  }

  function addTypingUser(userId: string) {
    typingUsers.value = new Set([...typingUsers.value, userId])
  }

  function removeTypingUser(userId: string) {
    const next = new Set(typingUsers.value)
    next.delete(userId)
    typingUsers.value = next
  }

  function clearMessages() {
    messages.value = []
    typingUsers.value = new Set()
    searchResults.value = []
    searchQuery.value = ''
    replyTo.value = null
    currentRoomId = null
    hasMore.value = true
  }

  return {
    messages,
    loading,
    loadingMore,
    uploading,
    hasMore,
    typingUsers,
    replyTo,
    searchResults,
    searchQuery,
    loadMessages,
    loadMore,
    searchMessages,
    addMessage,
    updateMessage,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    uploadFile,
    setReply,
    setTyping,
    addTypingUser,
    removeTypingUser,
    clearMessages,
  }
})
