<script setup lang="ts">
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'

defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{ (e: 'update:modelValue', val: string | null): void }>()

const PRESETS = [
  { label: 'Violet Dream', value: 'linear-gradient(135deg, #7c3aed, #3b82f6)' },
  { label: 'Aurora', value: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' },
  { label: 'Sunset', value: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { label: 'Rose Gold', value: 'linear-gradient(135deg, #ec4899, #f59e0b)' },
  { label: 'Forest', value: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  { label: 'Midnight', value: 'linear-gradient(135deg, #1e1b4b, #312e81)' },
  { label: 'Neon Pulse', value: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' },
  { label: 'Blurple', value: 'linear-gradient(135deg, #5865f2, #7289da)' },
]

const color1 = ref('#8b5cf6')
const color2 = ref('#3b82f6')
const angle = ref(135)
const customMode = ref(false)

const customGradient = computed(
  () => `linear-gradient(${angle.value}deg, ${color1.value}, ${color2.value})`
)

function selectPreset(value: string) {
  emit('update:modelValue', value)
  customMode.value = false
}

function applyCustom() {
  emit('update:modelValue', customGradient.value)
}

function clearGradient() {
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="gradient-picker">
    <div class="gradient-presets">
      <button
        v-for="preset in PRESETS"
        :key="preset.value"
        class="preset-btn"
        :class="{ active: modelValue === preset.value }"
        :style="{ background: preset.value }"
        :title="preset.label"
        type="button"
        @click="selectPreset(preset.value)"
      />
      <button
        class="preset-btn clear-btn"
        title="No gradient"
        :class="{ active: !modelValue }"
        type="button"
        @click="clearGradient"
      >
        <X :size="14" />
      </button>
    </div>

    <button class="custom-toggle" type="button" @click="customMode = !customMode">
      {{ customMode ? 'Hide custom gradient' : 'Custom gradient' }}
    </button>

    <div v-if="customMode" class="custom-builder">
      <div class="custom-row">
        <label class="label">Color 1</label>
        <div class="color-row">
          <input v-model="color1" type="color" class="color-input" />
          <span class="color-hex">{{ color1 }}</span>
        </div>
      </div>
      <div class="custom-row">
        <label class="label">Color 2</label>
        <div class="color-row">
          <input v-model="color2" type="color" class="color-input" />
          <span class="color-hex">{{ color2 }}</span>
        </div>
      </div>
      <div class="custom-row">
        <label class="label">Angle: {{ angle }} deg</label>
        <input v-model.number="angle" type="range" min="0" max="360" class="range-input" />
      </div>
      <div class="preview" :style="{ background: customGradient }" />
      <button class="btn-primary apply-btn" type="button" @click="applyCustom">Apply Custom</button>
    </div>
  </div>
</template>

<style scoped>
.gradient-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gradient-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-btn {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.preset-btn:hover {
  transform: scale(1.08);
}

.preset-btn.active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--accent-violet);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-2) !important;
  color: var(--text-muted);
}

.custom-toggle {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 7px 12px;
  text-align: left;
}

.custom-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.custom-builder {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 40px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px;
  background: var(--bg-surface);
  cursor: pointer;
}

.color-hex {
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.range-input {
  width: 100%;
  accent-color: var(--accent-violet);
}

.preview {
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.apply-btn {
  width: 100%;
  margin-top: 2px;
}
</style>
