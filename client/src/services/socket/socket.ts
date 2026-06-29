import { io, type Socket } from 'socket.io-client'

let _socket: Socket | null = null
let isConnecting = false
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 1000

export function getSocket(): Socket {
  if (!_socket) {
    const token = localStorage.getItem('nicori_access_token')
    const isElectronProd =
      typeof window !== 'undefined' && (window as any).electronAPI && location.protocol === 'file:'
    const serverUrl =
      import.meta.env.VITE_API_URL ||
      (isElectronProd ? 'https://nicori-server.onrender.com' : '')

    _socket = io(serverUrl, {
      path: '/api/socket.io',
      autoConnect: false,
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: BASE_RECONNECT_DELAY,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      extraHeaders: {
        'User-Agent': typeof navigator !== 'undefined' ? navigator.userAgent : 'Nicori',
      },
    })

    setupGlobalSocketHandlers()
  }
  return _socket
}

export function connectSocket(): Socket {
  const s = getSocket()
  if (!s.connected && !isConnecting) {
    isConnecting = true
    s.connect()
    s.once('connect', () => {
      isConnecting = false
    })
    s.once('connect_error', () => {
      isConnecting = false
    })
  }
  return s
}

function setupGlobalSocketHandlers(): void {
  if (!_socket) return

  _socket.on('connect', () => {
    // Socket.IO reconnection preserves listeners — rooms must be re-joined by stores
  })

  _socket.on('reconnect', () => {
    // Stores should listen for this event and re-join rooms
  })

  _socket.on('disconnect', () => {
    // Socket.IO automatically reconnects — no manual retry needed
  })

  _socket.on('connect_error', () => {
    // Socket.IO handles retry internally
  })

  _socket.on('heartbeat', () => {
    // Server heartbeat — keeps connection alive
  })
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect()
    isConnecting = false
  }
}

export function resetSocket(): void {
  if (_socket) {
    _socket.removeAllListeners()
    _socket.disconnect()
    _socket = null
  }
  isConnecting = false
}

export function isSocketConnected(): boolean {
  return _socket?.connected ?? false
}

export function getConnectionState(): string {
  if (!_socket) return 'disconnected'
  if (_socket.connected) return 'connected'
  if (_socket.active) return 'connecting'
  if (_socket.disconnected) return 'disconnected'
  return 'unknown'
}
