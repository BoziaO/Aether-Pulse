import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Message } from '../types/message.types'
import type { SearchFilters } from '../types/search.types'
import { serverPayloadToMessage } from '../utils/message.utils'
import { chatApi } from '../services/chatApi.service'

const MAX_HISTORY = 20

export const useSearchStore = defineStore('chatSearch', () => {
  const query = ref('')
  const results = ref<Message[]>([])
  const filters = ref<SearchFilters>({})
  const history = ref<string[]>([])
  const isSearching = ref(false)
  const hasSearched = ref(false)

  function addToHistory(q: string): void {
    const trimmed = q.trim().toLowerCase()
    if (!trimmed || history.value.includes(trimmed)) return
    history.value = [trimmed, ...history.value].slice(0, MAX_HISTORY)
  }

  function removeFromHistory(q: string): void {
    history.value = history.value.filter((h) => h !== q)
  }

  function clearHistory(): void {
    history.value = []
  }

  async function search(roomId: string, q: string): Promise<void> {
    query.value = q
    if (!q.trim()) {
      results.value = []
      hasSearched.value = false
      return
    }

    isSearching.value = true
    hasSearched.value = true

    try {
      const payloads = await chatApi.searchMessages(roomId, q.trim())
      results.value = payloads.map(serverPayloadToMessage)
      addToHistory(q)
    } catch {
      results.value = []
    } finally {
      isSearching.value = false
    }
  }

  function setFilters(newFilters: SearchFilters): void {
    filters.value = newFilters
  }

  function clearFilters(): void {
    filters.value = {}
  }

  function clear(): void {
    query.value = ''
    results.value = []
    filters.value = {}
    isSearching.value = false
    hasSearched.value = false
  }

  return {
    query,
    results,
    filters,
    history,
    isSearching,
    hasSearched,
    addToHistory,
    removeFromHistory,
    clearHistory,
    search,
    setFilters,
    clearFilters,
    clear,
  }
})
