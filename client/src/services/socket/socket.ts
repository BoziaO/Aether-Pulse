import { io, type Socket } from 'socket.io-client'

let _socket: Socket | null = null
let reconnectTimeout: NodeJS.Timeout | null = null
let isConnecting = false
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 1000 // 1 second
let reconnectAttempts = 0

export function getSocket(): Socket {
  if (!_socket) {
    const token = localStorage.getItem('aetherpulse_access_token')
    // In production (Vercel/Electron) VITE_API_URL points to the Render server.
    // In dev the Vite proxy forwards /api/* so we use relative '/'.
    const serverUrl = import.meta.env.VITE_API_URL ?? ''
    
    // Enhanced Socket.io configuration for better reconnection and scalability
    _socket = io(serverUrl, {
      path: '/api/socket.io',
      autoConnect: false,
      withCredentials: true,
      auth: { token },
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: BASE_RECONNECT_DELAY,
      reconnectionDelayMax: 10000, // 10 seconds max
      randomizationFactor: 0.5,
      // Timeout settings
      timeout: 20000, // 20 seconds
      // Transport settings for scalability
      transports: ['websocket', 'polling'],
      upgrade: true,
      // Custom headers for Electron compatibility
      extraHeaders: {
        'User-Agent': typeof navigator !== 'undefined' ? navigator.userAgent : 'AetherPulse'
      }
    })
    
    // Set up global event handlers
    setupGlobalSocketHandlers()
  }
  return _socket
}

export function connectSocket(): Socket {
  const s = getSocket()
  if (!s.connected && !isConnecting) {
    isConnecting = true
    s.connect()
    
    // Reset connection state when connected
    s.once('connect', () => {
      isConnecting = false
      reconnectAttempts = 0
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
    })
    
    // Handle connection errors
    s.once('connect_error', (error) => {
      isConnecting = false
      handleConnectionError(error)
    })
  }
  return s
}

/**
 * Handle connection errors with exponential backoff
 */
function handleConnectionError(error: Error): void {
  reconnectAttempts++
  
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached. Giving up.', error)
    return
  }
  
  // Exponential backoff with jitter
  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
    30000 // Max 30 seconds
  ) + Math.random() * 1000
  
  console.log(`Connection failed, retrying in ${delay}ms... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
  
  reconnectTimeout = setTimeout(() => {
    if (_socket && !_socket.connected) {
      connectSocket()
    }
  }, delay)
}

/**
 * Set up global socket event handlers
 */
function setupGlobalSocketHandlers(): void {
  if (!_socket) return
  
  // Reconnection events
  _socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`)
    reconnectAttempts = 0
  })
  
  _socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Reconnection attempt ${attemptNumber}`)
  })
  
  _socket.on('reconnecting', (attemptNumber) => {
    console.log(`Reconnecting... (attempt ${attemptNumber})`)
  })
  
  _socket.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error)
  })
  
  _socket.on('reconnect_failed', () => {
    console.error('Reconnection failed. Please check your network connection.')
  })
  
  // Connection state changes
  _socket.on('connect', () => {
    console.log('Socket connected:', _socket?.id)
  })
  
  _socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
    
    // Auto-reconnect if not manually disconnected
    if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
      setTimeout(() => {
        if (_socket && !_socket.connected) {
          connectSocket()
        }
      }, 1000)
    }
  })
  
  _socket.on('connect_error', (error) => {
    console.error('Connection error:', error)
    handleConnectionError(error)
  })
  
  // Network issues
  _socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
  
  _socket.on('ping', () => {
    // Keep-alive
  })
  
  _socket.on('pong', (latency) => {
    // Latency monitoring
    if (typeof latency === 'number') {
      console.debug(`Pong received. Latency: ${latency}ms`)
    }
  })
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect()
    isConnecting = false
  }
  
  // Clear reconnection timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  reconnectAttempts = 0
}

export function resetSocket(): void {
  // Clear all timeouts
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  
  if (_socket) {
    _socket.disconnect()
    _socket.removeAllListeners()
    _socket = null
  }
  
  isConnecting = false
  reconnectAttempts = 0
}

/**
 * Check if socket is currently connected
 */
export function isSocketConnected(): boolean {
  return _socket?.connected ?? false
}

/**
 * Get current connection state
 */
export function getConnectionState(): string {
  if (!_socket) return 'disconnected'
  if (_socket.connected) return 'connected'
  if (_socket.active) return 'connecting'
  if (_socket.disconnected) return 'disconnected'
  return 'unknown'
}
