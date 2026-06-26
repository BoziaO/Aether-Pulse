import { computed } from 'vue'

import { useComposerStore } from '../stores/composer.store'
import type { MentionMatch } from '../types/composer.types'
import { getFilteredCommands } from '../utils/command.utils'

export function useComposer(members: MentionMatch[]) {
  const composerStore = useComposerStore()

  composerStore.updateMentionMatches(members)

  const filteredCommands = computed(() => {
    if (!composerStore.commands.visible) return []
    return getFilteredCommands(composerStore.commands.query)
  })

  function handleKeydown(e: KeyboardEvent): void {
    if (composerStore.mentions.visible) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        composerStore.navigateMentions('down')
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        composerStore.navigateMentions('up')
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const match = composerStore.mentions.matches[composerStore.mentions.selectedIndex]
        if (match) {
          composerStore.selectMention(match)
        }
        return
      }
      if (e.key === 'Escape') {
        composerStore.mentions.visible = false
        return
      }
    }

    if (composerStore.commands.visible) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        composerStore.navigateCommands('down')
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        composerStore.navigateCommands('up')
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        const filtered = filteredCommands.value
        const cmd = filtered[composerStore.commands.selectedIndex]
        if (cmd) {
          composerStore.setContent(cmd.name + ' ')
        }
        return
      }
      if (e.key === 'Escape') {
        composerStore.commands.visible = false
        return
      }
    }

    if (e.key === 'Escape') {
      if (composerStore.isReplying) {
        composerStore.cancelReply()
        return
      }
      if (composerStore.isEditing) {
        composerStore.cancelEdit()
        return
      }
      composerStore.closeEmojiPicker()
    }
  }

  function handleSend(onSend: (content: string) => void): void {
    const transformed = composerStore.executeSlashCommand()
    const content = transformed || composerStore.content
    if (!content.trim()) return
    onSend(content)
  }

  return {
    composerStore,
    filteredCommands,
    handleKeydown,
    handleSend,
  }
}
