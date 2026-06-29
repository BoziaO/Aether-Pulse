<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { X, Trash2, LogOut } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'
  import { useRoomStore } from '@/stores/room.store'
  import type { Room } from '@/types/room.types'

  const props = defineProps<{ room: Room }>()
  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'left'): void
    (e: 'deleted'): void
  }>()

  const auth = useAuthStore()
  const roomStore = useRoomStore()
  const name = ref(props.room.name)
  const quality = ref(props.room.quality)
  const saving = ref(false)
  const error = ref('')

  const isOwner = computed(() => auth.user?.id === props.room.ownerId)
  const QUALITIES = ['360p', '480p', '720p', '1080p', '1440p']

  async function save() {
    saving.value = true
    error.value = ''
    try {
      await roomStore.updateRoom(props.room.id, { name: name.value, quality: quality.value })
      emit('close')
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to save'
    } finally {
      saving.value = false
    }
  }

  async function leave() {
    if (!confirm('Leave this room?')) return
    await roomStore.leaveRoom(props.room.id)
    emit('left')
  }

  async function remove() {
    if (!confirm('Delete this room permanently? This cannot be undone.')) return
    await roomStore.deleteRoom(props.room.id)
    emit('deleted')
  }
</script>

<template>
  <div
    class="overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="room-settings-title"
    @click.self="emit('close')"
    @keydown.escape="emit('close')"
  >
    <div class="modal">
      <button class="close" type="button" @click="emit('close')"><X :size="18" /></button>
      <h2 id="room-settings-title">Room Settings</h2>

      <div v-if="error" class="error">{{ error }}</div>

      <div class="field">
        <label>Room Name</label>
        <input v-model="name" class="input" maxlength="64" :disabled="!isOwner" />
      </div>

      <div class="field">
        <label>Stream Quality</label>
        <select v-model="quality" class="input" :disabled="!isOwner">
          <option v-for="q in QUALITIES" :key="q" :value="q">{{ q }}</option>
        </select>
      </div>

      <div class="actions">
        <button v-if="isOwner" class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
        <button class="btn-ghost danger" @click="leave">
          <LogOut :size="14" />
          Leave Room
        </button>
        <button v-if="isOwner" class="btn-ghost danger" @click="remove">
          <Trash2 :size="14" />
          Delete Room
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 500;
}
.modal {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px;
  position: relative;
}
.close {
  position: absolute;
  right: 12px;
  top: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}
.modal h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 18px;
}
.field {
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-primary);
  padding: 0 12px;
  font-size: 14px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
}
.btn-ghost.danger {
  color: var(--danger);
  justify-content: center;
}
.error {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
}
</style>
