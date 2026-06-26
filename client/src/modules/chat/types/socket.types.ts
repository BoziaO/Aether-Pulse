import type { ServerMessagePayload } from './message.types'
import type { TypingUser, ReadReceipt } from './presence.types'

export type ChatSocketInboundEvent =
  | 'chat:message'
  | 'chat:update'
  | 'chat:typing'
  | 'chat:presence'
  | 'chat:read'
  | 'chat:error'

export type ChatSocketOutboundEvent =
  | 'chat:join'
  | 'chat:leave'
  | 'chat:message'
  | 'chat:typing'
  | 'chat:read'

export interface ChatSocketPayloads {
  inbound: {
    'chat:message': ServerMessagePayload
    'chat:update': ServerMessagePayload
    'chat:typing': TypingUser
    'chat:presence': { roomId: string; userIds: string[] }
    'chat:read': ReadReceipt
    'chat:error': { message: string; code?: string }
  }
  outbound: {
    'chat:join': { roomId: string }
    'chat:leave': { roomId: string }
    'chat:message': {
      roomId: string
      content: string
      replyToId?: string
      clientId: string
    }
    'chat:typing': { roomId: string; isTyping: boolean }
    'chat:read': { roomId: string; lastReadAt: string }
  }
}

export type ChatSocketHandler<T extends ChatSocketInboundEvent> = (
  payload: ChatSocketPayloads['inbound'][T]
) => void

export type ChatSocketEmitter = <T extends ChatSocketOutboundEvent>(
  event: T,
  payload: ChatSocketPayloads['outbound'][T]
) => void
