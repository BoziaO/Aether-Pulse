import { ref, type Ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

import type { ChatSocketInboundEvent } from '../types/socket.types'
import type { ServerMessagePayload } from '../types/message.types'
import type { TypingUser, ReadReceipt } from '../types/presence.types'

export type MessageHandler = (payload: ServerMessagePayload) => void
export type UpdateHandler = (payload: ServerMessagePayload) => void
export type TypingHandler = (data: TypingUser) => void
export type PresenceHandler = (data: { roomId: string; userIds: string[] }) => void
export type ReadHandler = (data: ReadReceipt) => void
export type ErrorHandler = (data: { message: string; code?: string }) => void

interface ChatSocketHandlers {
  onMessage: Set<MessageHandler>
  onUpdate: Set<UpdateHandler>
  onTyping: Set<TypingHandler>
  onPresence: Set<PresenceHandler>
  onRead: Set<ReadHandler>
  onError: Set<ErrorHandler>
}

interface ServerEventMap {
  'new-message': ServerMessagePayload
  'message-updated': ServerMessagePayload
  'user-typing': { userId: string; roomId: string; isTyping: boolean }
  'user-joined': { userId: string }
  'user-left': { userId: string; socketId: string }
  'room-users': { userIds: string[] }
  'user-status-changed': { userId: string; status: string }
}

export const connectionState: Ref<'disconnected' | 'connecting' | 'connected'> = ref('disconnected')

let instance: ChatSocketService | null = null
let socket: Socket | null = null
let listenersBound = false
let currentRoomId: string | null = null
let currentUserId: string | null = null

const serverEventToClient: Record<string, ChatSocketInboundEvent> = {
  'new-message': 'chat:message',
  'message-updated': 'chat:update',
  'user-typing': 'chat:typing',
  'user-joined': 'chat:presence',
  'user-left': 'chat:presence',
  'room-users': 'chat:presence',
  'user-status-changed': 'chat:presence',
}

export class ChatSocketService {
  private handlers: ChatSocketHandlers = {
    onMessage: new Set(),
    onUpdate: new Set(),
    onTyping: new Set(),
    onPresence: new Set(),
    onRead: new Set(),
    onError: new Set(),
  }

  private constructor() {}

  static getInstance(): ChatSocketService {
    if (!instance) instance = new ChatSocketService()
    return instance
  }

  connect(userId?: string): void {
    if (socket?.connected) return

    if (userId) currentUserId = userId

    if (socket) {
      socket.connect()
      return
    }

    const token = localStorage.getItem('nicori_access_token')
    const serverUrl = import.meta.env.VITE_API_URL || ''

    socket = io(serverUrl, {
      path: '/api/socket.io',
      autoConnect: true,
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      upgrade: true,
    })

    socket.on('connect', () => {
      connectionState.value = 'connected'
    })

    socket.on('reconnect', () => {
      connectionState.value = 'connected'
      this.rejoinCurrentRoom()
    })

    socket.on('disconnect', () => {
      connectionState.value = 'disconnected'
    })

    socket.on('connect_error', () => {
      connectionState.value = 'connecting'
    })

    socket.on('heartbeat', () => {
      // Server heartbeat — keeps connection alive, no action needed
    })

    this.bindServerListeners()
  }

  private rejoinCurrentRoom(): void {
    if (currentRoomId && currentUserId && socket?.connected) {
      socket.emit('join-room', { roomId: currentRoomId, userId: currentUserId })
    }
  }

  private bindServerListeners(): void {
    if (listenersBound || !socket) return
    listenersBound = true

    const serverEvents: (keyof ServerEventMap)[] = [
      'new-message',
      'message-updated',
      'user-typing',
      'user-joined',
      'user-left',
      'room-users',
      'user-status-changed',
    ]

    for (const event of serverEvents) {
      socket!.on(event, (data: ServerEventMap[typeof event]) => {
        this.dispatch(event, data as any)
      })
    }
  }

  private dispatch(serverEvent: string, data: any): void {
    const clientEvent = serverEventToClient[serverEvent]

    switch (clientEvent) {
      case 'chat:message':
        this.handlers.onMessage.forEach((h) => h(data as ServerMessagePayload))
        break
      case 'chat:update':
        this.handlers.onUpdate.forEach((h) => h(data as ServerMessagePayload))
        break
      case 'chat:typing':
        this.handlers.onTyping.forEach((h) => h(data as TypingUser))
        break
      case 'chat:presence':
        this.handlePresenceEvent(serverEvent, data)
        break
    }
  }

  private handlePresenceEvent(serverEvent: string, data: any): void {
    switch (serverEvent) {
      case 'room-users':
        this.handlers.onPresence.forEach((h) =>
          h({ roomId: currentRoomId || '', userIds: data.userIds })
        )
        break
      case 'user-joined':
      case 'user-left':
        this.handlers.onPresence.forEach((h) =>
          h({ roomId: currentRoomId || '', userIds: [data.userId] })
        )
        break
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.onMessage.add(handler)
    return () => this.handlers.onMessage.delete(handler)
  }

  onUpdate(handler: UpdateHandler): () => void {
    this.handlers.onUpdate.add(handler)
    return () => this.handlers.onUpdate.delete(handler)
  }

  onTyping(handler: TypingHandler): () => void {
    this.handlers.onTyping.add(handler)
    return () => this.handlers.onTyping.delete(handler)
  }

  onPresence(handler: PresenceHandler): () => void {
    this.handlers.onPresence.add(handler)
    return () => this.handlers.onPresence.delete(handler)
  }

  onRead(handler: ReadHandler): () => void {
    this.handlers.onRead.add(handler)
    return () => this.handlers.onRead.delete(handler)
  }

  onError(handler: ErrorHandler): () => void {
    this.handlers.onError.add(handler)
    return () => this.handlers.onError.delete(handler)
  }

  clearHandlers(): void {
    this.handlers.onMessage.clear()
    this.handlers.onUpdate.clear()
    this.handlers.onTyping.clear()
    this.handlers.onPresence.clear()
    this.handlers.onRead.clear()
    this.handlers.onError.clear()
  }

  joinRoom(roomId: string, userId: string): void {
    currentUserId = userId
    if (!socket?.connected) {
      this.connect(userId)
    }
    if (!socket?.connected) return
    socket.emit('join-room', { roomId, userId })
    currentRoomId = roomId
  }

  leaveRoom(roomId: string, userId: string): void {
    if (!socket?.connected) return
    socket.emit('leave-room', { roomId, userId })
    currentRoomId = null
  }

  sendMessage(
    roomId: string,
    content: string,
    _clientId: string,
    userId: string,
    replyToId?: string
  ): void {
    if (!socket?.connected) return
    socket.emit('chat-message', { roomId, userId, content, replyToId })
  }

  sendTyping(roomId: string, userId: string, isTyping: boolean): void {
    if (!socket?.connected) return
    socket.emit('user-typing', { roomId, userId, isTyping })
  }

  updateToken(token: string): void {
    if (socket) {
      socket.auth = { token }
      if (socket.connected) {
        socket.emit('authenticate', { token })
      }
    }
  }

  disconnect(): void {
    if (!socket) return
    listenersBound = false
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    currentRoomId = null
    currentUserId = null
    connectionState.value = 'disconnected'
    this.clearHandlers()
  }

  get isConnected(): boolean {
    return socket?.connected ?? false
  }
}
