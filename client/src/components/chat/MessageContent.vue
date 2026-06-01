<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  content?: string
  type?: string
}>()

const html = computed(() => {
  if (!props.content) return ''
  if (props.type === 'system') return props.content
  return renderMarkdown(props.content)
})
</script>

<template>
  <div
    class="message-content"
    :class="{ system: type === 'system' }"
    v-html="type === 'system' ? content : html"
  />
</template>

<style scoped>
.message-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}
.message-content.system {
  color: var(--text-muted);
  font-size: 13px;
  font-style: italic;
}
.message-content :deep(.md-inline-code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
}
.message-content :deep(.md-codeblock) {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  padding: 8px 10px;
  margin: 4px 0;
  overflow-x: auto;
}
.message-content :deep(.md-link) {
  color: var(--accent-blue);
  text-decoration: none;
}
.message-content :deep(.md-link:hover) {
  text-decoration: underline;
}
.message-content :deep(strong) {
  color: var(--text-primary);
  font-weight: 700;
}
</style>
