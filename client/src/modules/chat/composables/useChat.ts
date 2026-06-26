import { useChatStore } from '../stores/chat.store'
import { useComposerStore } from '../stores/composer.store'
import { usePresenceStore } from '../stores/presence.store'
import { useSearchStore } from '../stores/search.store'
import { useAuthStore } from '@/stores/auth.store'
import { ChatSocketService } from '../services/chatSocket.service'
import { sendMessage } from '../services/chatMessage.service'

export function useChat(roomId: string) {
  const chatStore = useChatStore()
  const composerStore = useComposerStore()
  const presenceStore = usePresenceStore()
  const searchStore = useSearchStore()
  const authStore = useAuthStore()

  const socket = ChatSocketService.getInstance()

  function send(content: string): void {
    if (!authStore.user || !content.trim() || composerStore.isUploading) return

    const replyToId = composerStore.replyTo?.serverId
    const user = authStore.user
      ? {
          id: authStore.user.id,
          displayName: authStore.user.displayName,
          avatarUrl: authStore.user.avatarUrl,
          accentColor: authStore.user.accentColor,
          profileGradient: authStore.user.profileGradient,
          status: authStore.user.status,
        }
      : undefined

    sendMessage({
      roomId,
      userId: authStore.user.id,
      content: content.trim(),
      user,
      replyToId,
      onEmit: (rid, text, clientId, rId) => {
        socket.sendMessage(rid, text, clientId, authStore.user!.id, rId)
      },
      onOptimistic: (msg) => {
        chatStore.addOptimisticMessage(msg)
      },
      onConfirm: (_clientId) => {},
      onFail: (clientId) => {
        chatStore.markFailed(clientId)
      },
    })

    composerStore.clear()
  }

  function loadHistory(): void {
    chatStore.loadMessages(roomId)
  }

  function loadMoreHistory(): void {
    chatStore.loadMore()
  }

  function retryMessage(clientId: string): void {
    chatStore.retryMessage(clientId)
  }

  function searchMessages(query: string): void {
    searchStore.search(roomId, query)
  }

  return {
    chatStore,
    composerStore,
    presenceStore,
    searchStore,
    authStore,
    socket,
    send,
    loadHistory,
    loadMoreHistory,
    retryMessage,
    searchMessages,
  }
}
