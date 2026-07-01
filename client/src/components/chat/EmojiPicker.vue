<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { EMOJI_CATEGORIES } from '@/utils/text-formatter'

  const props = defineProps<{
    inline?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'select', emoji: string): void
  }>()

  const open = ref(false)
  const activeCategory = ref(0)
  const searchQuery = ref('')
  const searchInput = ref<HTMLInputElement | null>(null)
  const panelRef = ref<HTMLDivElement | null>(null)

  const QUICK = ['👍', '❤️', '😂', '🔥', '🎉', '😮', '😢', '🤔', '👀', '💯']

  const filteredEmojis = computed(() => {
    if (!searchQuery.value) {
      return EMOJI_CATEGORIES[activeCategory.value]?.emojis || []
    }
    const query = searchQuery.value.toLowerCase()
    return EMOJI_CATEGORIES.flatMap((cat) => cat.emojis).filter(
      (_, i) =>
        i.toString().includes(query) ||
        EMOJI_CATEGORIES.some((cat) => cat.emojis[i]?.includes(query))
    )
  })

  function pick(emoji: string) {
    emit('select', emoji)
    if (!props.inline) {
      open.value = false
    }
    searchQuery.value = ''
  }

  function toggleOpen() {
    open.value = !open.value
    if (open.value) {
      nextTick(() => {
        searchInput.value?.focus()
      })
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
      open.value = false
      searchQuery.value = ''
    }
  }

  watch(open, (isOpen) => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    } else {
      document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

<template>
  <div class="emoji-picker" :class="{ inline }">
    <button type="button" class="trigger" title="Add emoji" @click.stop="toggleOpen">
      <slot>
        <span class="trigger-emoji">😊</span>
      </slot>
    </button>
    <div v-if="open" ref="panelRef" class="panel" @click.stop>
      <div class="search-box">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search emoji..."
          class="search-input"
        />
      </div>
      <div class="quick-bar">
        <button
          v-for="e in QUICK"
          :key="e"
          type="button"
          class="emoji-btn quick"
          @click="pick(e)"
        >
          {{ e }}
        </button>
      </div>
      <div class="categories">
        <button
          v-for="(cat, idx) in EMOJI_CATEGORIES"
          :key="cat.name"
          type="button"
          class="cat-btn"
          :class="{ active: activeCategory === idx }"
          :title="cat.name"
          @click="activeCategory = idx; searchQuery = ''"
        >
          {{ cat.icon }}
        </button>
      </div>
      <div class="emoji-grid">
        <button
          v-for="(emoji, idx) in filteredEmojis"
          :key="idx"
          type="button"
          class="emoji-btn"
          @click="pick(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  position: relative;
}

.emoji-picker.inline {
  display: inline-flex;
}

.trigger {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trigger:hover {
  background: var(--bg-hover);
}

.trigger-emoji {
  font-size: 18px;
}

.panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  width: 320px;
  max-height: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.search-box {
  margin-bottom: 8px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.quick-bar {
  display: flex;
  gap: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.quick {
  font-size: 18px !important;
  padding: 6px !important;
}

.categories {
  display: flex;
  gap: 2px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.cat-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  opacity: 0.6;
  transition: all 0.15s ease;
}

.cat-btn:hover {
  opacity: 1;
  background: var(--bg-hover);
}

.cat-btn.active {
  opacity: 1;
  background: var(--color-primary);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  overflow-y: auto;
  max-height: 250px;
  scrollbar-width: thin;
}

.emoji-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: background 0.1s ease;
}

.emoji-btn:hover {
  background: var(--bg-hover);
  transform: scale(1.15);
}
</style>
