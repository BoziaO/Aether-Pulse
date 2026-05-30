import { defineStore } from 'pinia'
import { ref } from 'vue'
import { roomApi } from '@/services/api/room.api'
import { getSocket } from '@/services/socket/socket'
import type { Message } from '@/types/message.types'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const typingUsers = ref<Set<number>>(new Set())
  let currentRoomId: string | null = null

  async function loadMessages(roomId: string) {
    currentRoomId = roomId
    loading.value = true
    try {
      const msgs = await roomApi.messages(roomId)
      messages.value = msgs
    } catch (e) {
      console.error('Failed to load messages', e)
    } finally {
      loading.value = false
    }
  }

  function addMessage(message: Message) {
    if (!messages.value.find(m => m.id === message.id)) {
      messages.value.push(message)
    }
  }

  function sendMessage(roomId: string, userId: number, content: string) {
    const socket = getSocket()
    socket.emit('chat-message', { roomId, userId, content })
  }

  function setTyping(roomId: string, userId: number, isTyping: boolean) {
    const socket = getSocket()
    socket.emit('user-typing', { roomId, userId, isTyping })
  }

  function addTypingUser(userId: number) {
    typingUsers.value.add(userId)
  }

  function removeTypingUser(userId: number) {
    typingUsers.value.delete(userId)
  }

  function clearMessages() {
    messages.value = []
    typingUsers.value = new Set()
    currentRoomId = null
  }

  return { messages, loading, typingUsers, loadMessages, addMessage, sendMessage, setTyping, addTypingUser, removeTypingUser, clearMessages }
})
