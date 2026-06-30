const { contextBridge, ipcRenderer } = require('electron')

// ============================================================================
// Channel Validation
// ============================================================================

const ALLOWED_CHANNELS = new Set([
  'get-desktop-sources',
  'get-current-activity',
  'get-presence-state',
  'get-app-signatures',
  'get-session-info',
  'get-presence-themes',
  'set-room-info',
  'set-presence-theme',
  'presence-changed',
  'presence-tick',
  'activity-changed',
  'electron-message',
  'desktop-capturer-get-sources',
])

function validateChannel(channel) {
  if (typeof channel !== 'string' || !ALLOWED_CHANNELS.has(channel)) {
    throw new Error(`Invalid channel: ${channel}`)
  }
  return true
}

// ============================================================================
// Data Validation
// ============================================================================

function hasCircularReference(obj) {
  try {
    JSON.stringify(obj)
    return false
  } catch {
    return true
  }
}

// ============================================================================
// Context Bridge API
// ============================================================================

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    validateChannel(channel)
    if (data !== undefined && hasCircularReference(data)) {
      throw new Error('Data contains circular reference')
    }
    ipcRenderer.send(channel, data)
  },

  on: (channel, func) => {
    validateChannel(channel)
    const subscription = (_event, ...args) => func(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },

  once: (channel, func) => {
    validateChannel(channel)
    ipcRenderer.once(channel, (_event, ...args) => func(...args))
  },

  invoke: (channel, ...args) => {
    validateChannel(channel)
    return ipcRenderer.invoke(channel, ...args)
  },

  removeAllListeners: (channel) => {
    validateChannel(channel)
    ipcRenderer.removeAllListeners(channel)
  },

  // Convenience: screen sharing
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),

  // Convenience: presence
  getCurrentActivity: () => ipcRenderer.invoke('get-current-activity'),
  getPresenceState: () => ipcRenderer.invoke('get-presence-state'),
  getAppSignatures: () => ipcRenderer.invoke('get-app-signatures'),
  getSessionInfo: () => ipcRenderer.invoke('get-session-info'),
  getPresenceThemes: () => ipcRenderer.invoke('get-presence-themes'),

  // Convenience: room info
  setRoomInfo: (roomInfo) => ipcRenderer.send('set-room-info', roomInfo),

  // Convenience: theme
  setPresenceTheme: (themeId) => ipcRenderer.send('set-presence-theme', themeId),

  // Convenience: event listeners
  onPresenceChanged: (callback) => {
    const handler = (_event, state) => callback(state)
    ipcRenderer.on('presence-changed', handler)
    return () => ipcRenderer.removeListener('presence-changed', handler)
  },

  onPresenceTick: (callback) => {
    const handler = (_event, state) => callback(state)
    ipcRenderer.on('presence-tick', handler)
    return () => ipcRenderer.removeListener('presence-tick', handler)
  },

  onActivityChanged: (callback) => {
    const handler = (_event, activities) => callback(activities)
    ipcRenderer.on('activity-changed', handler)
    return () => ipcRenderer.removeListener('activity-changed', handler)
  },
})

// ============================================================================
// Node.js Polyfill (read-only)
// ============================================================================

window.process = Object.freeze({
  versions: Object.freeze({
    node: process.versions?.node || false,
    v8: process.versions?.v8 || false,
    electron: process.versions?.electron || false,
  }),
  platform: process.platform,
  env: Object.freeze({ NODE_ENV: process.env.NODE_ENV }),
})

// ============================================================================
// WebRTC Polyfill
// ============================================================================

if (process.versions?.electron) {
  window.wrtc = window.wrtc || {
    RTCPeerConnection: window.RTCPeerConnection,
    RTCSessionDescription: window.RTCSessionDescription,
    RTCIceCandidate: window.RTCIceCandidate,
  }
}
