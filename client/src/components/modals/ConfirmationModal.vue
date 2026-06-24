<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { X, AlertTriangle } from 'lucide-vue-next'

  const props = defineProps<{
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'default' | 'warning' | 'danger'
    show?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'confirm'): void
    (e: 'cancel'): void
    (e: 'update:show', value: boolean): void
  }>()

  const internalShow = ref(props.show ?? false)

  watch(
    () => props.show,
    (v) => {
      internalShow.value = v ?? false
    }
  )

  watch(internalShow, (v) => {
    emit('update:show', v)
  })

  function confirm() {
    internalShow.value = false
    emit('confirm')
  }

  function cancel() {
    internalShow.value = false
    emit('cancel')
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      cancel()
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      cancel()
    }
    if (e.key === 'Enter') {
      confirm()
    }
  }
</script>

<template>
  <Teleport to="body">
    <div
      v-if="internalShow"
      class="confirmation-overlay"
      tabindex="-1"
      @click="handleBackdropClick"
      @keydown="handleKeydown"
    >
      <div
        class="confirmation-modal"
        :class="type"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        tabindex="0"
      >
        <button class="close-btn" aria-label="Close" @click="cancel">
          <X :size="18" />
        </button>

        <div v-if="type === 'warning' || type === 'danger'" class="modal-icon">
          <AlertTriangle :size="24" />
        </div>

        <h3 id="confirmation-title">{{ title || 'Confirm' }}</h3>
        <p id="confirmation-message">{{ message }}</p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="cancel">
            {{ cancelText || 'Cancel' }}
          </button>
          <button class="btn-confirm" :class="type" @click="confirm">
            {{ confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirmation-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.confirmation-modal {
  width: 100%;
  max-width: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px;
  position: relative;
  animation: fadeIn 0.2s ease-out;
}

.confirmation-modal.warning {
  border-color: rgba(245, 158, 11, 0.3);
}

.confirmation-modal.danger {
  border-color: rgba(239, 68, 68, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
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

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
  margin-bottom: 16px;
}

.confirmation-modal.danger .modal-icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.confirmation-modal h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirmation-modal p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.btn-confirm {
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-confirm.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.btn-confirm.warning:hover {
  background: rgba(245, 158, 11, 0.3);
}

.btn-confirm.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.btn-confirm.danger:hover {
  background: rgba(239, 68, 68, 0.3);
}

@media (max-width: 480px) {
  .confirmation-modal {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
    padding: 12px;
  }
}
</style>
