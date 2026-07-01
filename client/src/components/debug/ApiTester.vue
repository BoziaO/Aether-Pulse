<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDeveloperStore } from '@/stores/developer.store'
import { TokenManager } from '@/services/auth.token-manager'
import { Send, Copy, Check } from 'lucide-vue-next'

const devStore = useDeveloperStore()

const method = ref('GET')
const url = ref('/api/health')
const body = ref('')
const headers = ref('')
const response = ref<any>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const copied = ref(false)

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const parsedHeaders = computed(() => {
  if (!headers.value.trim()) return {}
  try {
    return JSON.parse(headers.value)
  } catch {
    return {}
  }
})

async function sendRequest() {
  isLoading.value = true
  error.value = null
  response.value = null

  const startTime = performance.now()

  try {
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...parsedHeaders.value,
    }

    const token = TokenManager.getAccessToken()
    if (token) {
      fetchHeaders['Authorization'] = `Bearer ${token}`
    }

    const options: RequestInit = {
      method: method.value,
      headers: fetchHeaders,
    }

    if (body.value && ['POST', 'PUT', 'PATCH'].includes(method.value)) {
      options.body = body.value
    }

    const res = await fetch(url.value, options)
    const duration = Math.round(performance.now() - startTime)
    const contentType = res.headers.get('content-type') || ''
    let data: any

    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = await res.text()
    }

    response.value = {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      data,
      duration,
    }

    devStore.addLog('info', 'API Tester', `${method.value} ${url.value} - ${res.status} (${duration}ms)`)
  } catch (e: any) {
    error.value = e.message || 'Request failed'
    devStore.addLog('error', 'API Tester', `${method.value} ${url.value} - ${e.message}`)
  } finally {
    isLoading.value = false
  }
}

function copyResponse() {
  if (!response.value) return
  navigator.clipboard.writeText(JSON.stringify(response.value.data, null, 2))
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function formatJson(obj: unknown) {
  return JSON.stringify(obj, null, 2)
}

const statusClass = computed(() => {
  if (!response.value) return ''
  const status = response.value.status
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'client-error'
  if (status >= 500) return 'server-error'
  return ''
})
</script>

<template>
  <div class="api-tester">
    <div class="request-bar">
      <select v-model="method" class="method-select">
        <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
      </select>
      <input
        v-model="url"
        type="text"
        class="url-input"
        placeholder="/api/endpoint"
        @keyup.enter="sendRequest"
      />
      <button class="send-btn" :disabled="isLoading" @click="sendRequest">
        <Send :size="12" />
        {{ isLoading ? '...' : 'Send' }}
      </button>
    </div>

    <div class="request-options">
      <div class="option-group">
        <label>Headers (JSON)</label>
        <textarea
          v-model="headers"
          class="headers-input"
          placeholder='{"X-Custom": "value"}'
          rows="2"
        />
      </div>
      <div v-if="['POST', 'PUT', 'PATCH'].includes(method)" class="option-group">
        <label>Body</label>
        <textarea
          v-model="body"
          class="body-input"
          placeholder='{"key": "value"}'
          rows="3"
        />
      </div>
    </div>

    <div class="response-section">
      <div class="response-header">
        <span class="response-label">Response</span>
        <button v-if="response" class="copy-btn" @click="copyResponse">
          <Check v-if="copied" :size="12" />
          <Copy v-else :size="12" />
        </button>
      </div>

      <div v-if="error" class="response-error">
        {{ error }}
      </div>

      <div v-else-if="response" class="response-content">
        <div class="response-meta" :class="statusClass">
          <span class="status">{{ response.status }} {{ response.statusText }}</span>
          <span class="duration">{{ response.duration }}ms</span>
        </div>
        <pre class="response-body">{{ formatJson(response.data) }}</pre>
      </div>

      <div v-else class="response-empty">
        Send a request to see the response
      </div>
    </div>
  </div>
</template>

<style scoped>
.api-tester {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.request-bar {
  display: flex;
  gap: 8px;
}

.method-select {
  width: 90px;
  padding: 8px;
  background: var(--bg-secondary, #16213e);
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  font-weight: 600;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-secondary, #16213e);
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  color: var(--text-primary, #fff);
  font-family: monospace;
  font-size: 12px;
}

.url-input:focus {
  outline: none;
  border-color: var(--accent, #6366f1);
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: var(--accent, #6366f1);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.request-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-group label {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #aaa);
  margin-bottom: 4px;
}

.headers-input,
.body-input {
  width: 100%;
  padding: 8px;
  background: var(--bg-secondary, #16213e);
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  color: var(--text-primary, #fff);
  font-family: monospace;
  font-size: 11px;
  resize: vertical;
}

.headers-input:focus,
.body-input:focus {
  outline: none;
  border-color: var(--accent, #6366f1);
}

.response-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.response-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #aaa);
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #aaa);
  cursor: pointer;
  border-radius: 4px;
}

.copy-btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.response-error {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  color: var(--color-error, #ef4444);
  font-size: 12px;
}

.response-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.response-meta {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px 6px 0 0;
  font-size: 12px;
  font-weight: 500;
}

.response-meta.success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success, #22c55e);
}

.response-meta.client-error {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning, #f59e0b);
}

.response-meta.server-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error, #ef4444);
}

.response-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
  margin: 0;
  background: var(--bg-secondary, #16213e);
  border-radius: 0 0 6px 6px;
  color: var(--text-primary, #fff);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.response-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #aaa);
  font-size: 12px;
}
</style>
