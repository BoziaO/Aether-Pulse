<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { X, Copy, Check, Link } from 'lucide-vue-next'

  import { useRoomStore } from '@/stores/room.store'
  import type { Room } from '@/types/room.types'

  const props = defineProps<{ room: Room }>()
  const emit = defineEmits<{ (e: 'close'): void }>()
  const roomStore = useRoomStore()
  const copied = ref(false)

  const inviteLink = computed(() => roomStore.getInviteLink(props.room))

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(props.room.inviteCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>Invite to {{ room.name }}</h2>
        <button class="close-btn" @click="$emit('close')"><X :size="18" /></button>
      </div>
      <div class="modal-body">
        <label class="label">Invite Link</label>
        <div class="link-row">
          <div class="link-display">
            <Link :size="14" class="link-icon" />
            <span class="link-text">{{ inviteLink }}</span>
          </div>
          <button class="copy-btn" @click="copyLink">
            <Check v-if="copied" :size="14" />
            <Copy v-else :size="14" />
          </button>
        </div>

        <label class="label" style="margin-top: 16px">Invite Code</label>
        <div class="code-row">
          <span class="code-display">{{ room.inviteCode }}</span>
          <button class="btn-ghost" style="font-size: 12px; padding: 6px 12px" @click="copyCode">
            Copy code
          </button>
        </div>

        <p class="invite-hint">Share this link or code with the person you want to invite.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
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
  width: 440px;
  max-width: 90vw;
  padding: 24px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.modal-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}
.close-btn {
  background: transparent;
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
.modal-body {
  display: flex;
  flex-direction: column;
}
.link-row {
  display: flex;
  align-items: center;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.link-display {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  min-width: 0;
}
.link-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}
.link-text {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}
.copy-btn {
  padding: 10px 14px;
  background: rgba(139, 92, 246, 0.15);
  border: none;
  border-left: 1px solid var(--border);
  color: var(--accent-violet);
  cursor: pointer;
  display: flex;
  align-items: center;
}
.copy-btn:hover {
  background: rgba(139, 92, 246, 0.25);
}
.code-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
}
.code-display {
  font-family: monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 2px;
}
.invite-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
}
</style>
