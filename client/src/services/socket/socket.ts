import { io, type Socket } from 'socket.io-client'

let _socket: Socket | null = null

export function getSocket(): Socket {
  if (!_socket) {
    const token = localStorage.getItem('aetherpulse_access_token')
    // In production (Vercel/Electron) VITE_API_URL points to the Render server.
    // In dev the Vite proxy forwards /api/* so we use relative '/'.
    const serverUrl = import.meta.env.VITE_API_URL ?? ''
    _socket = io(serverUrl, {
      path: '/api/socket.io',
      autoConnect: false,
      withCredentials: true,
      auth: { token },
    })
  }
  return _socket
}

export function connectSocket(): Socket {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket(): void {
  _socket?.disconnect()
}

export function resetSocket(): void {
  if (_socket) {
    _socket.disconnect()
    _socket = null
  }
}
