<script setup lang="ts">
import { X, CheckCircle, AlertCircle, Info } from 'lucide-vue-next'

import { useToastStore } from '@/stores/toast.store'

const toast = useToastStore()
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <transition-group name="toast">
      <div v-for="t in toast.toasts" :key="t.id" class="toast" :class="t.type">
        <CheckCircle v-if="t.type === 'success'" :size="16" />
        <AlertCircle v-else-if="t.type === 'error'" :size="16" />
        <Info v-else :size="16" />
        <span>{{ t.message }}</span>
        <button type="button" class="dismiss" @click="toast.dismiss(t.id)"><X :size="14" /></button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  font-size: 13px;
  color: var(--text-primary);
}
.toast.success {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.1);
}
.toast.error {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.1);
}
.toast span {
  flex: 1;
  line-height: 1.4;
}
.dismiss {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}
.dismiss:hover {
  color: var(--text-primary);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
