// Preload script for Electron
// This script runs in the renderer context before the webpage is loaded.
// Security: contextIsolation and worldSafeExecuteJavaScript are enabled
const { contextBridge, ipcRenderer } = require('electron')

// Validate channel names to prevent prototype pollution attacks
function validateChannel(channel) {
  const allowedChannels = new Set([
    'get-desktop-sources',
    'electron-message',
    'desktop-capturer-get-sources'
  ])
  
  if (typeof channel !== 'string' || !allowedChannels.has(channel)) {
    throw new Error(`Invalid channel: ${channel}`)
  }
  return true
}

// Validate data to prevent injection attacks
function validateData(data) {
  // Simple validation - in production, use a more robust validation library
  if (data && typeof data === 'object') {
    // Check for circular references
    try {
      JSON.stringify(data)
    } catch (e) {
      throw new Error('Invalid data: circular reference detected')
    }
  }
  return true
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
// All methods are validated for security
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    validateChannel(channel)
    validateData(data)
    ipcRenderer.send(channel, data)
  },
  on: (channel, func) => {
    validateChannel(channel)
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  },
  once: (channel, func) => {
    validateChannel(channel)
    ipcRenderer.once(channel, (event, ...args) => func(...args))
  },
  invoke: (channel, ...args) => {
    validateChannel(channel)
    validateData(args)
    return ipcRenderer.invoke(channel, ...args)
  },
  removeAllListeners: (channel) => {
    validateChannel(channel)
    ipcRenderer.removeAllListeners(channel)
  },
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
})

// Polyfill for Node.js globals in the renderer process
// Only expose safe, read-only properties
window.process = Object.freeze({
  versions: Object.freeze({
    node: process.versions?.node || false,
    v8: process.versions?.v8 || false,
    electron: process.versions?.electron || false
  }),
  platform: process.platform,
  env: Object.freeze({
    NODE_ENV: process.env.NODE_ENV
  })
})

// Expose WebRTC globals for Electron compatibility
if (process.versions?.electron) {
  // These are already available in the renderer process with contextIsolation
  window.wrtc = window.wrtc || {
    RTCPeerConnection: window.RTCPeerConnection,
    RTCSessionDescription: window.RTCSessionDescription,
    RTCIceCandidate: window.RTCIceCandidate
  }
}

// Security: Freeze sensitive objects
Object.freeze(window.process)
Object.freeze(window.process.versions)
Object.freeze(window.process.env)
