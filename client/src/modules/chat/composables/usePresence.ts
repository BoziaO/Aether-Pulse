import { onUnmounted } from 'vue'

import { usePresenceStore } from '../stores/presence.store'
import { useAuthStore } from '@/stores/auth.store'
import { ChatSocketService } from '../services/chatSocket.service'

export function usePresence(roomId: string) {
  const presenceStore = usePresenceStore()
  const authStore = useAuthStore()
  const socket = ChatSocketService.getInstance()

  let typingTimeout: ReturnType<typeof setTimeout> | null = null
  const TYPING_DEBOUNCE = 2000

  onUnmounted(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
  })

  function startTyping(): void {
    if (!authStore.user) return
    socket.sendTyping(roomId, authStore.user.id, true)

    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      if (authStore.user) {
        socket.sendTyping(roomId, authStore.user.id, false)
      }
    }, TYPING_DEBOUNCE)
  }

  function stopTyping(): void {
    if (!authStore.user) return
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      typingTimeout = null
    }
    socket.sendTyping(roomId, authStore.user.id, false)
  }

  function getTypingNames(memberMap: Map<string, string>): string[] {
    const userIds = presenceStore.getTypingUsers(roomId)
    return userIds
      .filter((id) => id !== authStore.user?.id)
      .map((id) => memberMap.get(id) || 'Someone')
  }

  return {
    presenceStore,
    startTyping,
    stopTyping,
    getTypingNames,
  }
}
