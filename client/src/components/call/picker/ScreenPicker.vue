<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Monitor, MonitorDown, X } from 'lucide-vue-next'

  export interface DesktopSource {
    id: string
    name: string
    thumbnail: string
  }

  const props = defineProps<{
    sources: DesktopSource[]
  }>()

  const emit = defineEmits<{
    select: [source: DesktopSource]
    cancel: []
  }>()

  const selectedId = ref<string | null>(null)

  const screens = computed(() => props.sources.filter((s) => s.id.startsWith('screen:')))
  const windows = computed(() => props.sources.filter((s) => s.id.startsWith('window:')))
  const tab = ref<'screens' | 'windows'>('screens')

  function select(id: string) {
    selectedId.value = id
  }

  function confirm() {
    const source = props.sources.find((s) => s.id === selectedId.value)
    if (source) emit('select', source)
  }
</script>

<template>
  <div class="picker-overlay" @click.self="$emit('cancel')">
    <div class="picker-modal">
      <div class="picker-header">
        <h2>Udostępnij ekran</h2>
        <button class="close-btn" title="Zamknij" @click="$emit('cancel')"><X :size="20" /></button>
      </div>

      <div class="picker-tabs">
        <button
          :class="{ active: tab === 'screens' }"
          :disabled="screens.length === 0"
          @click="tab = 'screens'"
        >
          <Monitor :size="16" /> Ekrany ({{ screens.length }})
        </button>
        <button
          :class="{ active: tab === 'windows' }"
          :disabled="windows.length === 0"
          @click="tab = 'windows'"
        >
          <MonitorDown :size="16" /> Okna ({{ windows.length }})
        </button>
      </div>

      <div class="picker-grid">
        <button
          v-for="source in tab === 'screens' ? screens : windows"
          :key="source.id"
          class="source-card"
          :class="{ selected: source.id === selectedId }"
          @click="select(source.id)"
        >
          <img :src="source.thumbnail" alt="" class="source-thumb" />
          <span class="source-name">{{ source.name }}</span>
        </button>
        <div v-if="(tab === 'screens' ? screens : windows).length === 0" class="empty-state">
          Brak dostępnych źródeł
        </div>
      </div>

      <div class="picker-footer">
        <button class="btn-cancel" @click="$emit('cancel')">Anuluj</button>
        <button class="btn-share" :disabled="!selectedId" @click="confirm">Udostępnij</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.picker-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 640px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
}
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.picker-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}
.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.picker-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
}
.picker-tabs button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.picker-tabs button:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.picker-tabs button.active {
  background: var(--accent);
  color: white;
}
.picker-tabs button:disabled {
  opacity: 0.4;
  cursor: default;
}
.picker-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 16px 20px;
}
.source-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-hover);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.source-card:hover {
  border-color: var(--border-accent);
}
.source-card.selected {
  border-color: var(--accent);
  background: rgba(139, 92, 246, 0.1);
}
.source-thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 8px;
  background: #000;
}
.source-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 14px;
}
.picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
}
.btn-cancel,
.btn-share {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel {
  background: var(--bg-hover);
  color: var(--text-secondary);
}
.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.12);
}
.btn-share {
  background: var(--accent);
  color: white;
}
.btn-share:hover:not(:disabled) {
  filter: brightness(1.15);
}
.btn-share:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
