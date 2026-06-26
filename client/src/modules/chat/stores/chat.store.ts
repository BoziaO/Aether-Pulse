import { defineStore } from 'pinia'
import { ref, computed, shallowRef, triggerRef } from 'vue'

import type { Message, ServerMessagePayload } from '../types/message.types'
import { MessageStatus } from '../types/message.types'
import {
  serverPayloadToMessage,
  upsertMessage,
  getSortedMessages,
  matchOptimisticMessage,
} from '../utils/message.utils'
import { chatApi } from '../services/chatApi.service'
import { ChatSocketService } from '../services/chatSocket.service'

export const useChatStore = defineStore('chatModule', () => {
  const messages = shallowRef<Map<string, Message>>(new Map())
  const currentRoomId = ref<string | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const error = ref<string | null>(null)
  const newMessageCount = ref(0)

  const sortedMessages = computed(() => getSortedMessages(messages.value))

  const lastMessageId = computed(() => {
    const sorted = sortedMessages.value
    return sorted.length > 0 ? sorted[sorted.length - 1].clientId : null
  })

  function setMessages(msgs: ServerMessagePayload[]): void {
    const next = new Map<string, Message>()
    for (const payload of msgs) {
      const msg = serverPayloadToMessage(payload)
      next.set(msg.serverId || msg.clientId, msg)
    }
    messages.value = next
    triggerRef(messages)
  }

  function prependMessages(msgs: ServerMessagePayload[]): void {
    const next = new Map(messages.value)
    for (const payload of msgs) {
      const msg = serverPayloadToMessage(payload)
      const key = msg.serverId || msg.clientId
      if (!next.has(key)) {
        next.set(key, msg)
      }
    }
    messages.value = next
    triggerRef(messages)
  }

  function handleIncomingMessage(payload: ServerMessagePayload): void {
    const serverMsg = serverPayloadToMessage(payload)

    const optimisticClientId = matchOptimisticMessage(serverMsg, messages.value)
    if (optimisticClientId) {
      const next = new Map(messages.value)
      next.delete(optimisticClientId)
      next.set(serverMsg.serverId || serverMsg.clientId, serverMsg)
      messages.value = next
      triggerRef(messages)
      return
    }

    const key = serverMsg.serverId || serverMsg.clientId
    if (!messages.value.has(key)) {
      const next = new Map(messages.value)
      next.set(key, serverMsg)
      messages.value = next
      triggerRef(messages)
    }
  }

  function handleMessageUpdate(payload: ServerMessagePayload): void {
    const updated = serverPayloadToMessage(payload)
    const key = updated.serverId || updated.clientId

    if (messages.value.has(key)) {
      const next = upsertMessage(messages.value, updated)
      messages.value = next
      triggerRef(messages)
    }
  }

  function addOptimisticMessage(msg: Message): void {
    const next = new Map(messages.value)
    next.set(msg.clientId, msg)
    messages.value = next
    triggerRef(messages)
  }

  function markFailed(clientId: string): void {
    const existing = messages.value.get(clientId)
    if (!existing) return
    const next = new Map(messages.value)
    next.set(clientId, { ...existing, status: MessageStatus.Failed })
    messages.value = next
    triggerRef(messages)
  }

  function markSending(clientId: string): void {
    const existing = messages.value.get(clientId)
    if (!existing) return
    const next = new Map(messages.value)
    next.set(clientId, { ...existing, status: MessageStatus.Sending })
    messages.value = next
    triggerRef(messages)
  }

  function updateMessageInCache(messageId: string, updates: Partial<Message>): void {
    const key = messages.value.has(messageId)
      ? messageId
      : Array.from(messages.value.values()).find((m) => m.serverId === messageId)?.clientId

    if (!key) return
    const existing = messages.value.get(key)
    if (!existing) return

    const next = new Map(messages.value)
    next.set(key, { ...existing, ...updates })
    messages.value = next
    triggerRef(messages)
  }

  async function loadMessages(roomId: string): Promise<void> {
    currentRoomId.value = roomId
    loading.value = true
    error.value = null
    newMessageCount.value = 0

    try {
      const msgs = await chatApi.messages(roomId, { limit: 50 })
      setMessages(msgs)
      hasMore.value = msgs.length >= 50
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load messages'
    } finally {
      loading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!currentRoomId.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true

    try {
      const sorted = sortedMessages.value
      const oldest = sorted.length > 0 ? sorted[0].serverId : undefined
      if (!oldest) {
        hasMore.value = false
        return
      }

      const older = await chatApi.messages(currentRoomId.value, { before: oldest, limit: 50 })

      if (older.length === 0) {
        hasMore.value = false
      } else {
        prependMessages(older)
        hasMore.value = older.length >= 50
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load older messages'
    } finally {
      loadingMore.value = false
    }
  }

  async function editMessage(roomId: string, messageId: string, content: string): Promise<void> {
    try {
      const updated = await chatApi.editMessage(roomId, messageId, content)
      const payload: ServerMessagePayload = {
        id: updated.serverId || updated.clientId,
        roomId: updated.roomId,
        userId: updated.userId,
        content: updated.content,
        type: updated.type,
        createdAt: updated.createdAt,
        editedAt: updated.editedAt ?? null,
        isDeleted: updated.isDeleted,
        user: updated.user ?? null,
        reactions: updated.reactions ?? null,
        replyTo: updated.replyTo ?? null,
        attachmentUrl: updated.attachments[0]?.url ?? null,
        attachmentName: updated.attachments[0]?.name ?? null,
        attachmentMime: updated.attachments[0]?.mime ?? null,
      }
      handleMessageUpdate(payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to edit message'
      throw e
    }
  }

  async function deleteMessage(roomId: string, messageId: string): Promise<void> {
    try {
      const updated = await chatApi.deleteMessage(roomId, messageId)
      const payload: ServerMessagePayload = {
        id: updated.serverId || updated.clientId,
        roomId: updated.roomId,
        userId: updated.userId,
        content: updated.content,
        type: updated.type,
        createdAt: updated.createdAt,
        editedAt: updated.editedAt ?? null,
        isDeleted: updated.isDeleted,
        user: updated.user ?? null,
        reactions: updated.reactions ?? null,
        replyTo: updated.replyTo ?? null,
      }
      handleMessageUpdate(payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete message'
      throw e
    }
  }

  async function toggleReaction(roomId: string, messageId: string, emoji: string): Promise<void> {
    try {
      const updated = await chatApi.toggleReaction(roomId, messageId, emoji)
      const payload: ServerMessagePayload = {
        id: updated.serverId || updated.clientId,
        roomId: updated.roomId,
        userId: updated.userId,
        content: updated.content,
        type: updated.type,
        createdAt: updated.createdAt,
        editedAt: updated.editedAt ?? null,
        isDeleted: updated.isDeleted,
        user: updated.user ?? null,
        reactions: updated.reactions ?? null,
        replyTo: updated.replyTo ?? null,
      }
      handleMessageUpdate(payload)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update reaction'
      throw e
    }
  }

  async function retryMessage(clientId: string): Promise<void> {
    const msg = messages.value.get(clientId)
    if (!msg || msg.status !== MessageStatus.Failed) return

    markSending(clientId)
    const socket = ChatSocketService.getInstance()
    socket.sendMessage(
      msg.roomId,
      msg.content,
      msg.clientId,
      msg.userId,
      msg.replyToId ?? undefined
    )
  }

  function incrementNewCount(): void {
    newMessageCount.value++
  }

  function resetNewCount(): void {
    newMessageCount.value = 0
  }

  function clearMessages(): void {
    messages.value = new Map()
    triggerRef(messages)
    currentRoomId.value = null
    loading.value = false
    loadingMore.value = false
    hasMore.value = true
    error.value = null
    newMessageCount.value = 0
  }

  return {
    messages,
    currentRoomId,
    loading,
    loadingMore,
    hasMore,
    error,
    newMessageCount,
    sortedMessages,
    lastMessageId,
    loadMessages,
    loadMore,
    editMessage,
    deleteMessage,
    toggleReaction,
    retryMessage,
    handleIncomingMessage,
    handleMessageUpdate,
    addOptimisticMessage,
    markFailed,
    updateMessageInCache,
    incrementNewCount,
    resetNewCount,
    clearMessages,
  }
})
