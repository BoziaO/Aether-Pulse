// Preload script for Electron
// This script runs in the renderer context before the webpage is loaded.
const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
})

// Polyfill for Node.js globals in the renderer process
window.process = {}
window.process.versions = { node: false, v8: false, electron: false }
window.process.platform = process.platform