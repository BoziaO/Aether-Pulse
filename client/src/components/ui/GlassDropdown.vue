<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { ChevronDown } from 'lucide-vue-next'

  const props = withDefaults(defineProps<{
    modelValue: string
    options: Array<{ value: string; label: string; icon?: string }>
    placeholder?: string
    disabled?: boolean
    class?: string
  }>(), {
    placeholder: 'Wybierz...',
    disabled: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string]
  }>()

  const isOpen = ref(false)
  const dropdownRef = ref<HTMLElement | null>(null)

  const selectedLabel = computed(() => {
    const opt = props.options.find(o => o.value === props.modelValue)
    return opt?.label ?? props.placeholder
  })

  const selectedIcon = computed(() => {
    const opt = props.options.find(o => o.value === props.modelValue)
    return opt?.icon ?? null
  })

  function select(value: string) {
    emit('update:modelValue', value)
    isOpen.value = false
  }

  function toggle() {
    if (!props.disabled) isOpen.value = !isOpen.value
  }

  function handleClickOutside(e: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
      isOpen.value = false
    }
  }

  onMounted(() => document.addEventListener('mousedown', handleClickOutside))
  onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="dropdownRef" class="glass-dropdown" :class="{ open: isOpen, disabled }">
    <button type="button" class="glass-dropdown-trigger" @click="toggle">
      <span class="glass-dropdown-value">
        <span v-if="selectedIcon" class="glass-dropdown-icon">{{ selectedIcon }}</span>
        {{ selectedLabel }}
      </span>
      <ChevronDown :size="14" class="glass-dropdown-chevron" />
    </button>
    <Transition name="dropdown">
      <div v-if="isOpen" class="glass-dropdown-menu">
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="glass-dropdown-item"
          :class="{ active: opt.value === modelValue }"
          @click="select(opt.value)"
        >
          <span v-if="opt.icon" class="glass-dropdown-icon">{{ opt.icon }}</span>
          {{ opt.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .glass-dropdown {
    position: relative;
    width: 100%;
  }

  .glass-dropdown-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    text-align: left;
  }

  .glass-dropdown-trigger:hover {
    border-color: var(--accent-violet);
  }

  .glass-dropdown.open .glass-dropdown-trigger {
    border-color: var(--accent-violet);
    box-shadow: 0 0 0 2px rgba(124, 90, 240, 0.15);
  }

  .glass-dropdown-value {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .glass-dropdown-icon {
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
  }

  .glass-dropdown-chevron {
    color: var(--text-muted);
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  .glass-dropdown.open .glass-dropdown-chevron {
    transform: rotate(180deg);
  }

  .glass-dropdown.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .glass-dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 260px;
    overflow-y: auto;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 4px;
    z-index: 50;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(20px);
  }

  .glass-dropdown-menu::-webkit-scrollbar {
    width: 4px;
  }

  .glass-dropdown-menu::-webkit-scrollbar-track {
    background: transparent;
  }

  .glass-dropdown-menu::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 4px;
  }

  .glass-dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
    text-align: left;
  }

  .glass-dropdown-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-primary);
  }

  .glass-dropdown-item.active {
    background: rgba(124, 90, 240, 0.15);
    color: var(--accent-violet);
  }

  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: opacity 0.15s, transform 0.15s;
  }

  .dropdown-enter-from,
  .dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
