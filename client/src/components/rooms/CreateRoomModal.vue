<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import { useRoomStore } from '@/stores/room.store'

const emit = defineEmits<{ (e: 'close'): void }>()
const router = useRouter()
const roomStore = useRoomStore()
const name = ref('')
const quality = ref('1080p')
const QUALITIES = ['360p', '480p', '720p', '1080p', '1440p']
const loading = ref(false)
const error = ref('')

async function create() {
  if (!name.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    const room = await roomStore.createRoom(name.value.trim(), quality.value)
    emit('close')
    router.push(`/room/${room.id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create room'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>Create Room</h2>
        <button class="close-btn" @click="$emit('close')"><X :size="18" /></button>
      </div>
      <div class="modal-body">
        <label class="label">Room name</label>
        <input
          v-model="name"
          class="input"
          placeholder="My awesome room"
          @keydown.enter="create"
          autofocus
        />
        <label class="label">Stream quality</label>
        <select v-model="quality" class="input">
          <option v-for="q in QUALITIES" :key="q" :value="q">{{ q }}</option>
        </select>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" :disabled="!name.trim() || loading" @click="create">
          {{ loading ? 'Creating...' : 'Create Room' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 400px;
  max-width: 90vw;
  padding: 24px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.modal-header h2 { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px; }
.close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.modal-body { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
.modal-footer { display: flex; gap: 8px; justify-content: flex-end; }
.error-msg { font-size: 13px; color: var(--danger); margin-top: 4px; }
</style>
