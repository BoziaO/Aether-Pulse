<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import MarkdownIt from 'markdown-it'
  import hljs from 'highlight.js'
  import DOMPurify from 'dompurify'

  import { fetchLinkPreview, fetchGitHubRepo, extractYouTubeId, extractGitHubRepo } from '@/services/api/linkPreview.api'
  import type { LinkPreview, GitHubRepo, EmbedEntry } from '@/services/api/linkPreview.api'

  const props = defineProps<{
    type: string
    content: string
  }>()

  const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/g

  const md: MarkdownIt = new MarkdownIt({
    linkify: true,
    breaks: true,
    highlight(str: string, lang: string): string | undefined {
      if (lang && hljs.getLanguage(lang)) {
        return `<pre class="md-codeblock"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
      }
      return `<pre class="md-codeblock"><code>${md.utils.escapeHtml(str)}</code></pre>`
    }
  })

  const embeds = computed<EmbedEntry[]>(() => {
    const raw = props.content || ''
    const urls = [...new Set(raw.match(URL_REGEX) || [])]
    const result: EmbedEntry[] = []

    for (const url of urls) {
      const lower = url.toLowerCase()

      if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        const videoId = extractYouTubeId(url)
        if (videoId) {
          result.push({ type: 'youtube', url, videoId })
          continue
        }
      }

      if (lower.includes('github.com')) {
        const repo = extractGitHubRepo(url)
        if (repo) {
          result.push({ type: 'github', url, owner: repo.owner, repo: repo.repo })
          continue
        }
      }

      if (lower.includes('twitter.com') || lower.includes('x.com')) {
        result.push({ type: 'twitter', url })
        continue
      }

      result.push({ type: 'preview', url })
    }

    return result
  })

  // Remove YouTube URLs from content so they don't render as redundant links
  const cleanContent = computed(() => {
    let c = props.content || ''
    for (const e of embeds.value) {
      if (e.type === 'youtube') {
        c = c.replace(e.url, '')
      }
    }
    return c
  })

  const html = computed(() =>
    DOMPurify.sanitize(md.render(cleanContent.value))
  )

  // Preview cache with TTL
  const CACHE_TTL = 5 * 60 * 1000

  interface TimedValue<T> {
    data: T
    ts: number
  }

  const previewMeta = ref<Map<string, TimedValue<LinkPreview>>>(new Map())
  const repoMeta = ref<Map<string, TimedValue<GitHubRepo>>>(new Map())

  // In-flight promises to deduplicate concurrent fetches
  const pendingPreviews = new Map<string, Promise<LinkPreview | null>>()
  const pendingRepos = new Map<string, Promise<GitHubRepo | null>>()

  async function loadPreview(url: string): Promise<void> {
    const existing = previewMeta.value.get(url)
    if (existing && Date.now() - existing.ts < CACHE_TTL) return

    if (pendingPreviews.has(url)) {
      await pendingPreviews.get(url)!
      return
    }

    const promise = fetchLinkPreview(url)
      .then((data) => {
        previewMeta.value = new Map(previewMeta.value.set(url, { data, ts: Date.now() }))
        return data
      })
      .catch(() => null)

    pendingPreviews.set(url, promise)
    await promise
    pendingPreviews.delete(url)
  }

  async function loadRepo(owner: string, repo: string): Promise<void> {
    const key = `${owner}/${repo}`
    const existing = repoMeta.value.get(key)
    if (existing && Date.now() - existing.ts < CACHE_TTL) return

    if (pendingRepos.has(key)) {
      await pendingRepos.get(key)!
      return
    }

    const promise = fetchGitHubRepo(owner, repo)
      .then((data) => {
        repoMeta.value = new Map(repoMeta.value.set(key, { data, ts: Date.now() }))
        return data
      })
      .catch(() => null)

    pendingRepos.set(key, promise)
    await promise
    pendingRepos.delete(key)
  }

  function triggerLoad(embed: EmbedEntry) {
    if (embed.type === 'youtube') return
    if (embed.type === 'github' && embed.owner && embed.repo) {
      loadRepo(embed.owner, embed.repo)
      return
    }
    loadPreview(embed.url)
  }

  watch(embeds, () => {
    for (const e of embeds.value) triggerLoad(e)
  }, { immediate: true })

  function formatCount(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return String(n)
  }

  function repoLink(embed: EmbedEntry): string {
    return `https://github.com/${embed.owner}/${embed.repo}`
  }

  function hostname(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }
</script>

<template>
  <div class="message-content-wrap">
    <div
      class="message-content"
      :class="{ system: type === 'system' }"
      v-html="html"
    />

    <div v-for="embed in embeds" :key="embed.url" class="embed-container">
      <!-- YouTube -->
      <div v-if="embed.type === 'youtube' && embed.videoId" class="embed-youtube">
        <iframe
          :src="`https://www.youtube.com/embed/${embed.videoId}`"
          loading="lazy"
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      <!-- GitHub Repo Card -->
      <div v-else-if="embed.type === 'github' && embed.owner && embed.repo" class="embed-github">
        <a :href="repoLink(embed)" target="_blank" rel="noreferrer" class="github-card">
          <div class="github-card-header">
            <svg class="github-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span class="github-repo-name">{{ embed.owner }}/{{ embed.repo }}</span>
          </div>
          <div v-if="repoMeta.get(`${embed.owner}/${embed.repo}`)" class="github-card-body">
            <p v-if="repoMeta.get(`${embed.owner}/${embed.repo}`)!.data.description" class="github-desc">
              {{ repoMeta.get(`${embed.owner}/${embed.repo}`)!.data.description }}
            </p>
            <div class="github-stats">
              <span class="github-stat">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                  <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                </svg>
                {{ formatCount(repoMeta.get(`${embed.owner}/${embed.repo}`)!.data.stargazers_count) }}
              </span>
              <span class="github-stat">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                  <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0z" />
                </svg>
                {{ formatCount(repoMeta.get(`${embed.owner}/${embed.repo}`)!.data.forks_count) }}
              </span>
            </div>
          </div>
          <div v-else class="github-loading">Loading repo info...</div>
        </a>
      </div>

      <!-- Twitter / X Preview -->
      <div v-else-if="embed.type === 'twitter'" class="embed-preview">
        <a :href="embed.url" target="_blank" rel="noreferrer" class="preview-card">
          <div class="preview-card-content">
            <div v-if="previewMeta.get(embed.url)?.data.image" class="preview-card-img-wrap">
              <img :src="previewMeta.get(embed.url)!.data.image!" :alt="previewMeta.get(embed.url)?.data.title || ''" loading="lazy" decoding="async" />
            </div>
            <div class="preview-card-text">
              <span v-if="previewMeta.get(embed.url)?.data.title" class="preview-card-title">{{ previewMeta.get(embed.url)?.data.title }}</span>
              <span v-if="previewMeta.get(embed.url)?.data.description" class="preview-card-desc">{{ previewMeta.get(embed.url)?.data.description }}</span>
              <span class="preview-card-url">twitter.com</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Generic Link Preview -->
      <div v-else-if="embed.type === 'preview'" class="embed-preview">
        <a :href="embed.url" target="_blank" rel="noreferrer" class="preview-card">
          <div class="preview-card-content">
            <div v-if="previewMeta.get(embed.url)?.data.image" class="preview-card-img-wrap">
              <img :src="previewMeta.get(embed.url)!.data.image!" :alt="previewMeta.get(embed.url)?.data.title || ''" loading="lazy" decoding="async" />
            </div>
            <div class="preview-card-text">
              <span v-if="previewMeta.get(embed.url)?.data.title" class="preview-card-title">{{ previewMeta.get(embed.url)?.data.title }}</span>
              <span v-if="previewMeta.get(embed.url)?.data.description" class="preview-card-desc">{{ previewMeta.get(embed.url)?.data.description }}</span>
              <span class="preview-card-url">{{ hostname(embed.url) }}</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-content-wrap {
  width: 100%;
}

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

/* Embed containers */
.embed-container {
  margin-top: 8px;
}

/* YouTube */
.embed-youtube {
  position: relative;
  width: 100%;
  max-width: 480px;
  border-radius: 10px;
  overflow: hidden;
}
.embed-youtube iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
  display: block;
}

/* GitHub Card */
.embed-github {
  max-width: 420px;
}
.github-card {
  display: block;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-surface-2);
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: border-color 0.15s;
}
.github-card:hover {
  border-color: var(--border-accent);
}
.github-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.github-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}
.github-repo-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.github-card-body {
  padding: 0 14px 12px;
}
.github-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.github-stats {
  display: flex;
  gap: 16px;
}
.github-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}
.github-loading {
  padding: 8px 14px 12px;
  font-size: 12px;
  color: var(--text-muted);
}

/* Link Preview Card */
.embed-preview {
  max-width: 420px;
}
.preview-card {
  display: block;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-surface-2);
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: border-color 0.15s;
}
.preview-card:hover {
  border-color: var(--border-accent);
}
.preview-card-content {
  display: flex;
  flex-direction: column;
}
.preview-card-img-wrap {
  width: 100%;
  max-height: 200px;
  overflow: hidden;
}
.preview-card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.preview-card-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
}
.preview-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview-card-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview-card-url {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: lowercase;
}
</style>
