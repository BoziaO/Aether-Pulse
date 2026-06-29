<script setup lang="ts">
  defineProps<{
    names: string[]
  }>()
</script>

<template>
  <div v-if="names.length > 0" class="typing-indicator">
    <span class="typing-dots"><span /><span /><span /></span>
    <span class="typing-text">
      <template v-if="names.length === 1">{{ names[0] }} is typing...</template>
      <template v-else>{{ names.join(', ') }} are typing...</template>
    </span>
  </div>
</template>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  font-size: 12px;
  color: var(--text-muted);
}
.typing-dots {
  display: flex;
  gap: 3px;
  align-items: center;
}
.typing-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s ease-in-out infinite both;
}
.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
