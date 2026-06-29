<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      variant?: 'primary' | 'ghost' | 'danger' | string | undefined
      size?: 'sm' | 'md' | 'lg' | string | undefined
      disabled?: boolean | undefined
    }>(),
    {
      variant: undefined,
      size: undefined,
      disabled: false,
    }
  )

  const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
  }>()

  const classes = computed(() => {
    return [
      'btn',
      props.variant ? `btn-${props.variant}` : '',
      props.size ? `btn-${props.size}` : '',
      props.disabled ? 'disabled' : '',
    ].filter(Boolean)
  })

  function handleClick(event: MouseEvent) {
    if (props.disabled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    emit('click', event)
  }
</script>

<template>
  <button :class="classes" :disabled="disabled" type="button" @click="handleClick">
    <span v-if="$slots.icon" class="btn-icon">
      <slot name="icon" />
    </span>
    <slot />
  </button>
</template>

<style scoped>
/* Base Button Styling */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--bg-surface-2);
  color: var(--text-primary);
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
  user-select: none;
  text-decoration: none;
}

.btn:hover {
  background: var(--bg-hover);
}

.btn:active {
  transform: scale(0.98);
}

/* Custom Size Overrides */
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  gap: 6px;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 10px;
  gap: 10px;
}

/* Disabled State */
.btn.disabled,
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
}

/* Icon layout helper */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Variant styles — override base .btn background that conflicts with global classes */
.btn.btn-primary {
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  color: white;
  border: none;
}
.btn.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(124, 90, 240, 0.3);
}
.btn.btn-primary:active {
  transform: translateY(0);
}
.btn.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
}
.btn.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
}
.btn.btn-danger:active {
  transform: scale(0.98);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
}
</style>
