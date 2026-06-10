import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dmApi } from '@/services/api/dm.api'
import { getSocket, connectSocket } from '@/services/socket/socket'
import { notifyNewMessage } from '@/utils/notifications'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import type { DmConversation, DmMessage } from '@/types/dm.types'

let globalDmListenerBound = false

export const useDmStore = defineStore('dm', () => {
  const auth = useAuthStore()
  const conversations = ref<DmConversation[]>([])
  const messages = ref<DmMessage[]>([])
  const currentConversationId = ref<string | null>(null)
  const loading = ref(false)
  const loadingMessages = ref(false)
  const uploading = ref(false)
  const hasMore = ref(true)
  const replyTo = ref<DmMessage | null>(null)
  const typingUsers = ref<Set<string>>(new Set())

  function bindGlobalDmListener() {
    if (globalDmListenerBound) return
    const socket = connectSocket()
    socket.on('new-dm-message', (msg: DmMessage) => {
      updateConversationPreview(msg)
      if (msg.conversationId === currentConversationId.value) {
        if (!messages.value.find((m) => m.id === msg.id)) {
          messages.value.push(msg)
        }
      }
      if (msg.user && msg.userId !== auth.user?.id) {
        notifyNewMessage(msg.user.displayName, previewText(msg))
      }
    })

    socket.on('dm-message-updated', (msg: DmMessage) => {
      if (msg.conversationId === currentConversationId.value) {
        const idx = messages.value.findIndex((m) => m.id === msg.id)
        if (idx >= 0) {
          messages.value[idx] = msg
        }
      }
      updateConversationPreview(msg)
    })

    socket.on(
      'dm-typing',
      ({
        conversationId,
        userId,
        isTyping,
      }: {
        conversationId: string
        userId: string
        isTyping: boolean
      }) => {
        if (conversationId === currentConversationId.value) {
          if (isTyping) {
            addTypingUser(userId)
          } else {
            removeTypingUser(userId)
          }
        }
      }
    )

    globalDmListenerBound = true
  }

  function previewText(msg: DmMessage) {
    if (msg.type === 'file') return msg.attachmentName || 'Sent a file'
    return msg.content.slice(0, 120)
  }

  async function fetchConversations() {
    loading.value = true
    try {
      conversations.value = await auth.authRequest(() => dmApi.list())
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to load messages')
    } finally {
      loading.value = false
    }
  }

  async function openWith(userId: string) {
    try {
      const conv = await auth.authRequest(() => dmApi.openWith(userId))
      const existing = conversations.value.find((c) => c.id === conv.id)
      if (!existing) {
        conversations.value.unshift({
          id: conv.id,
          otherUser: conv.otherUser,
          lastMessage: null,
          updatedAt: new Date().toISOString(),
        })
      } else if (conv.otherUser) {
        existing.otherUser = conv.otherUser
      }
      return conv
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to start DM conversation')
      throw e
    }
  }

  async function loadMessages(conversationId: string) {
    currentConversationId.value = conversationId
    loadingMessages.value = true
    hasMore.value = true
    try {
      const msgs = await auth.authRequest(() => dmApi.messages(conversationId, { limit: 50 }))
      messages.value = msgs
      hasMore.value = msgs.length >= 50
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to load conversation')
    } finally {
      loadingMessages.value = false
    }
  }

  async function loadMore() {
    if (
      !currentConversationId.value ||
      loadingMessages.value ||
      !hasMore.value ||
      messages.value.length === 0
    ) {
      return
    }
    loadingMessages.value = true
    try {
      const oldest = messages.value[0]?.id
      if (!oldest) return
      const older = await auth.authRequest(() =>
        dmApi.messages(currentConversationId.value!, {
          before: oldest,
          limit: 50,
        })
      )
      if (older.length === 0) {
        hasMore.value = false
      } else {
        messages.value = [...older, ...messages.value]
        hasMore.value = older.length >= 50
      }
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to load older messages')
    } finally {
      loadingMessages.value = false
    }
  }

  function joinConversation(conversationId: string) {
    const socket = connectSocket()
    socket.emit('join-dm', { conversationId })
  }

  function leaveConversation() {
    if (currentConversationId.value) {
      getSocket().emit('leave-dm', { conversationId: currentConversationId.value })
    }
    messages.value = []
    replyTo.value = null
    currentConversationId.value = null
    typingUsers.value = new Set()
  }

  function updateConversationPreview(msg: DmMessage) {
    let conv = conversations.value.find((c) => c.id === msg.conversationId)
    if (!conv) {
      conv = {
        id: msg.conversationId,
        otherUser: msg.user as DmConversation['otherUser'],
        lastMessage: null,
        updatedAt: msg.createdAt,
      }
      conversations.value.unshift(conv)
    }
    conv.lastMessage = {
      content: msg.isDeleted ? 'Message deleted' : msg.content,
      type: msg.type,
      attachmentName: msg.attachmentName ?? null,
      createdAt: msg.createdAt,
      userId: msg.userId,
    }
    conv.updatedAt = msg.createdAt
    conversations.value.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  function sendMessage(conversationId: string, content: string) {
    const socket = getSocket()
    socket.emit('dm-message', {
      conversationId,
      content,
      replyToId: replyTo.value?.id,
    })
    replyTo.value = null
  }

  async function uploadFile(
    conversationId: string,
    dataUrl: string,
    fileName: string,
    caption?: string
  ) {
    uploading.value = true
    try {
      const msg = await auth.authRequest(() =>
        dmApi.upload(conversationId, dataUrl, fileName, caption)
      )
      if (!messages.value.find((m) => m.id === msg.id)) {
        messages.value.push(msg)
      }
      updateConversationPreview(msg)
      replyTo.value = null
      return msg
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'File upload failed')
      throw e
    } finally {
      uploading.value = false
    }
  }

  function addTypingUser(userId: string) {
    typingUsers.value = new Set([...typingUsers.value, userId])
  }

  function removeTypingUser(userId: string) {
    const next = new Set(typingUsers.value)
    next.delete(userId)
    typingUsers.value = next
  }

  function setTyping(conversationId: string, isTyping: boolean) {
    const socket = getSocket()
    socket.emit('dm-typing', { conversationId, isTyping })
  }

  async function editMessage(conversationId: string, messageId: string, content: string) {
    try {
      const updated = await auth.authRequest(() => dmApi.edit(conversationId, messageId, content))
      const idx = messages.value.findIndex((m) => m.id === messageId)
      if (idx >= 0) {
        messages.value[idx] = updated
      }
      updateConversationPreview(updated)
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to edit message')
      throw e
    }
  }

  async function deleteMessage(conversationId: string, messageId: string) {
    try {
      const updated = await auth.authRequest(() => dmApi.delete(conversationId, messageId))
      const idx = messages.value.findIndex((m) => m.id === messageId)
      if (idx >= 0) {
        messages.value[idx] = updated
      }
      updateConversationPreview(updated)
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to delete message')
      throw e
    }
  }

  function setReply(message: DmMessage | null) {
    replyTo.value = message
  }

  function clear() {
    leaveConversation()
    conversations.value = []
  }

  return {
    conversations,
    messages,
    currentConversationId,
    loading,
    loadingMessages,
    uploading,
    hasMore,
    replyTo,
    typingUsers,
    bindGlobalDmListener,
    fetchConversations,
    openWith,
    loadMessages,
    loadMore,
    joinConversation,
    leaveConversation,
    sendMessage,
    uploadFile,
    setReply,
    setTyping,
    editMessage,
    deleteMessage,
    clear,
  }
})
