<template>
  <div class="skeleton" :class="[type, { dark }]" :style="style" />
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    type?: 'text' | 'circular' | 'rectangular' | 'line'
    width?: string
    height?: string
    size?: string
    dark?: boolean
    lines?: number
  }>()

  const style = computed(() => {
    const s: Record<string, string> = {}
    if (props.width) s.width = props.width
    if (props.height) s.height = props.height
    if (props.size) {
      s.width = props.size
      s.height = props.size
    }
    return s
  })
</script>

<style scoped>
.skeleton {
  background: var(--bg-hover);
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton.dark {
  background: rgba(0, 0, 0, 0.15);
}

.skeleton.circular {
  border-radius: 50%;
}

.skeleton.line {
  height: 1px;
  border-radius: 0;
}

.skeleton.text {
  height: 1em;
  margin-bottom: 4px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
