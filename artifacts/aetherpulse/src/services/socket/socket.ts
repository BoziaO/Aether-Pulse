import { io, type Socket } from 'socket.io-client'

let _socket: Socket | null = null

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io({
      path: '/api/socket.io',
      autoConnect: false,
      withCredentials: true,
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
