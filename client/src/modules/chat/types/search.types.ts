import type { Message } from './message.types'

export interface SearchFilters {
  fromUser?: string
  before?: string
  after?: string
  hasAttachments?: boolean
  hasReactions?: boolean
}

export interface SearchState {
  query: string
  results: Message[]
  filters: SearchFilters
  history: string[]
  isSearching: boolean
  hasSearched: boolean
}

export interface SearchHistoryItem {
  query: string
  timestamp: string
  roomId: string
}
