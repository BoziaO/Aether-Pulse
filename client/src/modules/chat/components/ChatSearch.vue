<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { Search, X, Clock } from 'lucide-vue-next'

  import { useSearchStore } from '../stores/search.store'

  const props = defineProps<{
    roomId: string
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
  }>()

  const searchStore = useSearchStore()
  const searchInput = ref('')
  const showHistory = ref(false)

  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  function onInput(): void {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      searchStore.search(props.roomId, searchInput.value)
    }, 300)
  }

  function selectHistory(q: string): void {
    searchInput.value = q
    showHistory.value = false
    searchStore.search(props.roomId, q)
  }

  function clearSearch(): void {
    searchInput.value = ''
    searchStore.clear()
    showHistory.value = false
  }

  function delayHideHistory(): void {
    setTimeout(() => {
      showHistory.value = false
    }, 200)
  }

  function close(): void {
    clearSearch()
    emit('close')
  }

  watch(showHistory, (val) => {
    if (val && searchStore.history.length === 0) {
      showHistory.value = false
    }
  })
</script>

<template>
  <div class="search-bar">
    <Search :size="14" class="search-icon" />
    <input
      v-model="searchInput"
      placeholder="Search messages..."
      aria-label="Search messages"
      @input="onInput"
      @focus="showHistory = true"
      @blur="delayHideHistory"
    />

    <div
      v-if="showHistory && searchStore.history.length > 0 && !searchInput"
      class="search-history"
    >
      <div class="history-header">Recent searches</div>
      <button
        v-for="item in searchStore.history"
        :key="item"
        class="history-item"
        @mousedown.prevent="selectHistory(item)"
      >
        <Clock :size="12" />
        {{ item }}
      </button>
    </div>

    <button
      v-if="searchInput || searchStore.hasSearched"
      aria-label="Clear search"
      @click="clearSearch"
    >
      <X :size="14" />
    </button>
    <button aria-label="Close search" @click="close">
      <X :size="14" />
    </button>
  </div>

  <div v-if="searchStore.isSearching" class="search-loading">Searching...</div>
  <div
    v-else-if="searchStore.hasSearched && searchStore.results.length === 0 && searchInput"
    class="search-no-results"
  >
    No messages found for "{{ searchInput }}"
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  position: relative;
}
.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}
.search-bar input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13px;
}
.search-bar input::placeholder {
  color: var(--text-muted);
}
.search-bar button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}
.search-bar button:hover {
  color: var(--text-primary);
}
.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0 0 8px 8px;
  z-index: 20;
  padding: 4px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.history-header {
  padding: 6px 12px;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}
.history-item:hover {
  background: var(--bg-hover);
}
.search-loading,
.search-no-results {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  border-bottom: 1px solid var(--border);
}
</style>
