<script setup lang="ts">
  import { computed } from 'vue'
  import MarkdownIt from 'markdown-it'
  import hljs from 'highlight.js'
  import DOMPurify from 'dompurify'

  const props = defineProps<{
    type: string
    content: string
  }>()

  const md: MarkdownIt = new MarkdownIt({
    linkify: true,
    breaks: true,
    highlight(str: string, lang: string): string | undefined {
      if (lang && hljs.getLanguage(lang)) {
        return `<pre class="md-codeblock"><code>${hljs.highlight(str,{language:lang}).value}</code></pre>`
      }

      return `<pre class="md-codeblock"><code>${md.utils.escapeHtml(str)}</code></pre>`
    }
  })

  const html = computed(() =>
    DOMPurify.sanitize(md.render(props.content || ''))
  )
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="message-content"
    :class="{ system: type === 'system' }"
    v-html="html"
  ></div>
  <!-- eslint-enable vue/no-v-html -->

  <div class="code-header">
    <span>typescript</span>
    <button>Copy</button>
  </div>
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
