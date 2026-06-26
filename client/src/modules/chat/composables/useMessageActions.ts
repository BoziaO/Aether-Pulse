import { useChatStore } from '../stores/chat.store'
import { useComposerStore } from '../stores/composer.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import type { Message } from '../types/message.types'

export function useMessageActions(roomId: string) {
  const chatStore = useChatStore()
  const composerStore = useComposerStore()
  const authStore = useAuthStore()
  const toastStore = useToastStore()

  function handleReply(message: Message): void {
    composerStore.setReply(message)
  }

  function handleEdit(message: Message): void {
    composerStore.setEditing(message)
  }

  function handleDelete(messageId: string): void {
    chatStore.deleteMessage(roomId, messageId).catch((e) => {
      toastStore.error(e instanceof Error ? e.message : 'Failed to delete message')
    })
  }

  function handleReact(messageId: string, emoji: string): void {
    chatStore.toggleReaction(roomId, messageId, emoji).catch((e) => {
      toastStore.error(e instanceof Error ? e.message : 'Failed to add reaction')
    })
  }

  function handleRetry(clientId: string): void {
    chatStore.retryMessage(clientId)
  }

  function isOwnMessage(message: Message): boolean {
    return message.userId === authStore.user?.id
  }

  return {
    handleReply,
    handleEdit,
    handleDelete,
    handleReact,
    handleRetry,
    isOwnMessage,
  }
}
