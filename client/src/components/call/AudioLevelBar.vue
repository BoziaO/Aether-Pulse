<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    level: number
    maxBars?: number
    direction?: 'vertical' | 'horizontal'
  }>()

  const barCount = computed(() => props.maxBars ?? 12)

  const bars = computed(() => {
    const total = barCount.value
    return Array.from({ length: total }, (_, i) => {
      const threshold = ((i + 1) / total) * 100
      const active = props.level >= threshold
      return { active, index: i }
    })
  })

  const barColor = computed(() => {
    if (props.level > 80) return '#ef4444' // red
    if (props.level > 50) return '#eab308' // yellow
    return '#22c55e' // green
  })
</script>

<template>
  <div class="audio-level-bar" :class="direction ?? 'vertical'">
    <div
      v-for="bar in bars"
      :key="bar.index"
      class="bar-segment"
      :class="{ active: bar.active }"
      :style="{
        '--bar-color': barColor,
        '--bar-delay': `${bar.index * 15}ms`,
      }"
    />
  </div>
</template>

<style scoped>
.audio-level-bar {
  display: flex;
  gap: 2px;
  align-items: flex-end;
}

.audio-level-bar.vertical {
  flex-direction: column-reverse;
  align-items: stretch;
  height: 100%;
  width: 4px;
}

.audio-level-bar.horizontal {
  flex-direction: row;
  align-items: center;
  height: 4px;
  width: 100%;
}

.bar-segment {
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.15);
  transition: background 0.1s, transform 0.1s;
}

.vertical .bar-segment {
  width: 100%;
  min-height: 3px;
}

.horizontal .bar-segment {
  height: 100%;
  min-width: 3px;
}

.bar-segment.active {
  background: var(--bar-color);
  animation: bar-pulse 0.5s ease-in-out infinite alternate;
  animation-delay: var(--bar-delay);
}

@keyframes bar-pulse {
  from { opacity: 0.85; }
  to { opacity: 1; }
}
</style>
