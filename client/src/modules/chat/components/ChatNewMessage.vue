<script setup lang="ts">
defineProps<{
  count: number
}>()

const emit = defineEmits<{
  (e: 'scroll-down'): void
}>()
</script>

<template>
  <button
    class="new-message-btn"
    :aria-label="`${count} new messages`"
    @click="emit('scroll-down')"
  >
    <span class="new-message-text">
      {{ count > 1 ? `${count} new messages` : '1 new message' }}
    </span>
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
</template>

<style scoped>
.new-message-btn {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--accent-violet);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  transition: all 0.15s ease;
  animation: slide-up 0.2s ease-out;
}
.new-message-btn:hover {
  background: var(--accent-violet);
  color: white;
  border-color: var(--accent-violet);
}
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
