import { type Socket } from 'socket.io'

import { verifyToken } from '../middleware/auth'

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token =
    socket.handshake.auth.token ||
    (socket.handshake.headers['authorization'] as string | undefined)?.split(' ')[1]

  if (!token) {
    next(new Error('Authentication required'))
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    next(new Error('Invalid or expired token'))
    return
  }

  socket.data.userId = payload.userId
  next()
}
