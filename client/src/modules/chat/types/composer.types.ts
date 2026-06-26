import type { Message } from './message.types'

export interface MentionState {
  query: string
  selectedIndex: number
  matches: MentionMatch[]
  visible: boolean
}

export interface MentionMatch {
  id: string
  displayName: string
  username?: string
  avatarUrl?: string | null
}

export interface SlashCommand {
  name: string
  description: string
  transform: (input: string) => string
}

export interface UploadState {
  id: string
  file: File
  progress: number
  status: UploadStatus
  preview?: string
  error?: string
}

export type UploadStatus = 'compressing' | 'uploading' | 'uploaded' | 'failed'

export interface ComposerState {
  content: string
  replyTo: Message | null
  editingMessage: Message | null
  editContent: string
  uploads: UploadState[]
  showEmojiPicker: boolean
  mentions: MentionState
  commands: {
    visible: boolean
    query: string
    selectedIndex: number
  }
}

export type ComposerMode = 'new' | 'reply' | 'edit'
