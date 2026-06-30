<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'glass' | 'neon' | 'minimal'
    hoverable?: boolean
    animated?: boolean
    glowColor?: string
  }>(),
  {
    variant: 'default',
    hoverable: true,
    animated: false,
    glowColor: '#B7A7FF',
  }
)

const isHovered = ref(false)
const mousePos = ref({ x: 0, y: 0 })
const cardRef = ref<HTMLElement | null>(null)

function onMouseMove(e: MouseEvent) {
  if (!cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  mousePos.value = {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  }
}

const spotlightStyle = computed(() => ({
  background: `radial-gradient(circle at ${mousePos.value.x}% ${mousePos.value.y}%, ${props.glowColor}15 0%, transparent 50%)`,
}))
</script>

<template>
  <div
    ref="cardRef"
    class="animated-card"
    :class="[`variant-${variant}`, { hoverable, animated }]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @mousemove="onMouseMove"
  >
    <div v-if="variant === 'glass'" class="glass-bg" />
    <div v-if="isHovered && hoverable" class="spotlight" :style="spotlightStyle" />
    <div class="card-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.animated-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.animated-card.hoverable:hover {
  transform: translateY(-2px);
}

/* Default */
.variant-default {
  background: var(--bg-secondary, #1a1a2e);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.variant-default.hoverable:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Glass */
.variant-glass {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}

.glass-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

/* Neon */
.variant-neon {
  background: var(--bg-primary, #0F1018);
  border: 1px solid rgba(183, 167, 255, 0.3);
}

.variant-neon.hoverable:hover {
  box-shadow: 0 0 20px rgba(183, 167, 255, 0.2), inset 0 0 20px rgba(183, 167, 255, 0.05);
}

/* Minimal */
.variant-minimal {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.variant-minimal.hoverable:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* Spotlight effect */
.spotlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.3s ease;
}

.card-content {
  position: relative;
  z-index: 2;
}

/* Animated border */
.animated.variant-neon::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 16px;
  padding: 1px;
  background: conic-gradient(
    from var(--border-angle, 0deg),
    transparent 30%,
    rgba(183, 167, 255, 0.5) 50%,
    transparent 70%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: border-spin 4s linear infinite;
  pointer-events: none;
}

@keyframes border-spin {
  to {
    --border-angle: 360deg;
  }
}

@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
</style>
