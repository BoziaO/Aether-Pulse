<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDeveloperStore } from '@/stores/developer.store'
import { useSettingsStore } from '@/stores/settings.store'
import { X, Activity, FileText, Terminal, Gauge, ChevronDown, Trash2 } from 'lucide-vue-next'

const devStore = useDeveloperStore()
const settingsStore = useSettingsStore()

const isMinimized = ref(false)

const tabs = [
  { id: 'info' as const, label: 'Info', icon: Activity },
  { id: 'logs' as const, label: 'Logs', icon: FileText },
  { id: 'api' as const, label: 'API', icon: Terminal },
  { id: 'performance' as const, label: 'Perf', icon: Gauge },
]

// Keyboard shortcut
function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault()
    devStore.togglePanel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  devStore.stopTracking()
})

watch(
  () => devStore.isPanelOpen,
  (open) => {
    if (open && settingsStore.developerMode) {
      devStore.startTracking()
    } else if (!open) {
      devStore.stopTracking()
    }
  }
)

watch(
  () => settingsStore.developerMode,
  (enabled) => {
    if (enabled && devStore.isPanelOpen) {
      devStore.startTracking()
    } else {
      devStore.stopTracking()
      devStore.isPanelOpen = false
    }
  }
)

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString()
}

const statusColor = computed(() => {
  const { connected } = devStore.debugInfo.socket
  return connected ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)'
})

const rtcStateColor = computed(() => {
  const state = devStore.debugInfo.webrtc.state
  switch (state) {
    case 'connected': return 'var(--color-success, #22c55e)'
    case 'connecting': return 'var(--color-warning, #f59e0b)'
    case 'disconnected':
    case 'failed': return 'var(--color-error, #ef4444)'
    default: return 'var(--text-muted)'
  }
})
</script>

<template>
  <div v-if="settingsStore.developerMode && devStore.isPanelOpen" class="debug-panel" :class="{ minimized: isMinimized }">
    <div class="debug-header">
      <div class="debug-title">
        <Terminal :size="14" />
        <span>DevTools</span>
      </div>
      <div class="debug-actions">
        <button class="debug-btn" @click="isMinimized = !isMinimized">
          <ChevronDown :size="14" :class="{ rotated: isMinimized }" />
        </button>
        <button class="debug-btn close" @click="devStore.togglePanel">
          <X :size="14" />
        </button>
      </div>
    </div>

    <div v-if="!isMinimized" class="debug-content">
      <div class="debug-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: devStore.activeTab === tab.id }"
          @click="devStore.setTab(tab.id)"
        >
          <component :is="tab.icon" :size="12" />
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        <!-- Info Tab -->
        <div v-if="devStore.activeTab === 'info'" class="info-grid">
          <div class="info-section">
            <h4>Socket.IO</h4>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" :style="{ color: statusColor }">
                {{ devStore.debugInfo.socket.connected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Socket ID:</span>
              <span class="value">{{ devStore.debugInfo.socket.socketId || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Transport:</span>
              <span class="value">{{ devStore.debugInfo.socket.transport || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Packets Sent:</span>
              <span class="value">{{ devStore.debugInfo.socket.packetsSent }}</span>
            </div>
            <div class="info-row">
              <span class="label">Packets Recv:</span>
              <span class="value">{{ devStore.debugInfo.socket.packetsReceived }}</span>
            </div>
          </div>

          <div class="info-section">
            <h4>WebRTC</h4>
            <div class="info-row">
              <span class="label">State:</span>
              <span class="value" :style="{ color: rtcStateColor }">
                {{ devStore.debugInfo.webrtc.state }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">ICE:</span>
              <span class="value">{{ devStore.debugInfo.webrtc.iceState || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Local Streams:</span>
              <span class="value">{{ devStore.debugInfo.webrtc.localStreams }}</span>
            </div>
            <div class="info-row">
              <span class="label">Remote Streams:</span>
              <span class="value">{{ devStore.debugInfo.webrtc.remoteStreams }}</span>
            </div>
          </div>

          <div class="info-section">
            <h4>Database</h4>
            <div class="info-row">
              <span class="label">Connected:</span>
              <span class="value" :style="{ color: devStore.debugInfo.db.connected ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)' }">
                {{ devStore.debugInfo.db.connected ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Latency:</span>
              <span class="value">{{ devStore.debugInfo.db.latency ? `${devStore.debugInfo.db.latency}ms` : 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Logs Tab -->
        <div v-if="devStore.activeTab === 'logs'" class="logs-tab">
          <div class="logs-toolbar">
            <button class="toolbar-btn" @click="devStore.clearLogs">
              <Trash2 :size="12" />
              Clear
            </button>
            <span class="log-count">{{ devStore.logs.length }} entries</span>
          </div>
          <div class="logs-list">
            <div
              v-for="log in devStore.logs"
              :key="log.id"
              class="log-entry"
              :class="log.level"
            >
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-level">{{ log.level.toUpperCase() }}</span>
              <span class="log-source">[{{ log.source }}]</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="devStore.logs.length === 0" class="empty-state">
              No logs yet
            </div>
          </div>
        </div>

        <!-- API Tab -->
        <div v-if="devStore.activeTab === 'api'" class="api-tab">
          <ApiTester />
        </div>

        <!-- Performance Tab -->
        <div v-if="devStore.activeTab === 'performance'" class="perf-tab">
          <div class="perf-grid">
            <div class="perf-metric">
              <span class="perf-label">FPS</span>
              <span class="perf-value" :class="{ warning: devStore.performanceMetrics.fps < 30, good: devStore.performanceMetrics.fps >= 55 }">
                {{ devStore.performanceMetrics.fps }}
              </span>
            </div>
            <div class="perf-metric">
              <span class="perf-label">Memory</span>
              <span class="perf-value">
                {{ devStore.performanceMetrics.memoryUsed }}MB / {{ devStore.performanceMetrics.memoryTotal }}MB
              </span>
            </div>
            <div class="perf-metric">
              <span class="perf-label">Latency</span>
              <span class="perf-value">{{ devStore.performanceMetrics.latency }}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating toggle button when panel is closed -->
  <button
    v-if="settingsStore.developerMode && !devStore.isPanelOpen"
    class="debug-toggle"
    @click="devStore.togglePanel"
    title="Open DevTools (Ctrl+Shift+D)"
  >
    <Terminal :size="16" />
  </button>
</template>

<style scoped>
.debug-panel {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 400px;
  max-height: 500px;
  background: var(--bg-primary, #1a1a2e);
  border: 1px solid var(--border, #333);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  overflow: hidden;
}

.debug-panel.minimized {
  max-height: 40px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-secondary, #16213e);
  border-bottom: 1px solid var(--border, #333);
}

.debug-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.debug-actions {
  display: flex;
  gap: 4px;
}

.debug-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #aaa);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.debug-btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.debug-btn.close:hover {
  background: var(--color-error, #ef4444);
  color: white;
}

.debug-btn .rotated {
  transform: rotate(180deg);
}

.debug-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.debug-tabs {
  display: flex;
  gap: 2px;
  padding: 4px;
  background: var(--bg-secondary, #16213e);
  border-bottom: 1px solid var(--border, #333);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #aaa);
  font-size: 11px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.tab-btn.active {
  background: var(--accent, #6366f1);
  color: white;
}

.tab-content {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

/* Info Tab */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-section h4 {
  margin: 0 0 8px 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #aaa);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.info-row .label {
  color: var(--text-secondary, #aaa);
}

.info-row .value {
  color: var(--text-primary, #fff);
  font-weight: 500;
}

/* Logs Tab */
.logs-tab {
  display: flex;
  flex-direction: column;
  height: 360px;
}

.logs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: var(--bg-secondary, #16213e);
  color: var(--text-secondary, #aaa);
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
}

.toolbar-btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.log-count {
  font-size: 11px;
  color: var(--text-secondary, #aaa);
}

.logs-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.log-entry.info {
  background: rgba(59, 130, 246, 0.1);
}

.log-entry.warn {
  background: rgba(245, 158, 11, 0.1);
}

.log-entry.error {
  background: rgba(239, 68, 68, 0.1);
}

.log-entry.debug {
  background: rgba(107, 114, 128, 0.1);
}

.log-time {
  color: var(--text-secondary, #aaa);
  white-space: nowrap;
}

.log-level {
  font-weight: 600;
  min-width: 40px;
}

.log-entry.info .log-level { color: #3b82f6; }
.log-entry.warn .log-level { color: #f59e0b; }
.log-entry.error .log-level { color: #ef4444; }
.log-entry.debug .log-level { color: #6b7280; }

.log-source {
  color: var(--accent, #6366f1);
  white-space: nowrap;
}

.log-message {
  color: var(--text-primary, #fff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary, #aaa);
}

/* API Tab */
.api-tab {
  height: 360px;
}

/* Performance Tab */
.perf-tab {
  padding: 8px 0;
}

.perf-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.perf-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-secondary, #16213e);
  border-radius: 8px;
}

.perf-label {
  color: var(--text-secondary, #aaa);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.perf-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.perf-value.warning {
  color: var(--color-warning, #f59e0b);
}

.perf-value.good {
  color: var(--color-success, #22c55e);
}

/* Floating toggle button */
.debug-toggle {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent, #6366f1);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  z-index: 9998;
  transition: all 0.2s;
}

.debug-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
}
</style>
