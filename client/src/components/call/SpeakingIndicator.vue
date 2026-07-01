<script setup lang="ts">
  import { computed } from 'vue'
  import { Mic } from 'lucide-vue-next'

  const props = defineProps<{
    isSpeaking: boolean
    audioLevel?: number
    size?: 'sm' | 'md' | 'lg'
  }>()

  const barCount = 5
  const bars = computed(() => {
    const level = props.audioLevel ?? 0
    return Array.from({ length: barCount }, (_, i) => {
      const threshold = ((i + 1) / barCount) * 100
      return level >= threshold
    })
  })
</script>

<template>
  <div class="speaking-indicator" :class="[size ?? 'md', { speaking: isSpeaking }]">
    <div class="mic-ring">
      <Mic :size="size === 'sm' ? 14 : size === 'lg' ? 22 : 18" />
      <div v-if="isSpeaking" class="pulse-ring" />
    </div>
    <div v-if="audioLevel != null" class="level-bars">
      <div
        v-for="(active, i) in bars"
        :key="i"
        class="level-bar"
        :class="{ active }"
      />
    </div>
  </div>
</template>

<style scoped>
.speaking-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mic-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--accent-violet);
  animation: pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0;
    transform: scale(1.5);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

.speaking .mic-ring {
  color: var(--accent-violet);
}

/* Level bars */
.level-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
}

.level-bar {
  width: 3px;
  border-radius: 1.5px;
  background: var(--text-muted);
  transition: height 0.1s, background 0.15s;
}

.speaking .level-bar.active {
  background: var(--accent-violet);
  animation: bar-bounce 0.6s ease-in-out infinite alternate;
}

.speaking .level-bar:nth-child(1) { height: 6px; animation-delay: 0s; }
.speaking .level-bar:nth-child(2) { height: 10px; animation-delay: 0.05s; }
.speaking .level-bar:nth-child(3) { height: 14px; animation-delay: 0.1s; }
.speaking .level-bar:nth-child(4) { height: 10px; animation-delay: 0.15s; }
.speaking .level-bar:nth-child(5) { height: 6px; animation-delay: 0.2s; }

.level-bar:not(.active) {
  height: 4px;
}

@keyframes bar-bounce {
  from { transform: scaleY(1); }
  to { transform: scaleY(0.5); }
}

/* Sizes */
.sm .level-bars { height: 12px; }
.sm .level-bar { width: 2px; }
.sm .level-bar:nth-child(1) { height: 4px; }
.sm .level-bar:nth-child(2) { height: 7px; }
.sm .level-bar:nth-child(3) { height: 10px; }
.sm .level-bar:nth-child(4) { height: 7px; }
.sm .level-bar:nth-child(5) { height: 4px; }

.lg .level-bars { height: 22px; }
.lg .level-bar { width: 4px; border-radius: 2px; }
.lg .level-bar:nth-child(1) { height: 8px; }
.lg .level-bar:nth-child(2) { height: 14px; }
.lg .level-bar:nth-child(3) { height: 20px; }
.lg .level-bar:nth-child(4) { height: 14px; }
.lg .level-bar:nth-child(5) { height: 8px; }
</style>
