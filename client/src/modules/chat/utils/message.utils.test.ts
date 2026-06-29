import { describe, it, expect } from 'vitest'

import { MessageStatus } from '../types/message.types'
import type { Message } from '../types/message.types'
import {
  createOptimisticMessage,
  serverPayloadToMessage,
  matchOptimisticMessage,
  upsertMessage,
  messageGroupMeta,
  getSortedMessages,
} from './message.utils'

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    clientId: 'client-1',
    serverId: undefined,
    roomId: 'room-1',
    userId: 'user-1',
    content: 'Hello',
    type: 'text',
    status: MessageStatus.Sent,
    replyToId: null,
    replyTo: null,
    attachments: [],
    reactions: [],
    createdAt: new Date().toISOString(),
    editedAt: null,
    isDeleted: false,
    user: null,
    ...overrides,
  }
}

describe('message.utils', () => {
  describe('createOptimisticMessage', () => {
    it('should create a message with Sending status', () => {
      const msg = createOptimisticMessage('room-1', 'user-1', 'Hello')
      expect(msg.status).toBe(MessageStatus.Sending)
      expect(msg.roomId).toBe('room-1')
      expect(msg.userId).toBe('user-1')
      expect(msg.content).toBe('Hello')
      expect(msg.clientId).toBeDefined()
      expect(msg.isDeleted).toBe(false)
    })

    it('should include replyToId when provided', () => {
      const msg = createOptimisticMessage('room-1', 'user-1', 'Reply', undefined, 'reply-1')
      expect(msg.replyToId).toBe('reply-1')
    })

    it('should include user when provided', () => {
      const user = { displayName: 'Test', avatarUrl: null }
      const msg = createOptimisticMessage('room-1', 'user-1', 'Hi', user)
      expect(msg.user).toEqual(user)
    })
  })

  describe('serverPayloadToMessage', () => {
    it('should convert server payload to Message', () => {
      const payload = {
        id: 'server-1',
        clientId: 'client-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello',
        type: 'text',
        createdAt: new Date().toISOString(),
        isDeleted: false,
      }
      const msg = serverPayloadToMessage(payload)
      expect(msg.serverId).toBe('server-1')
      expect(msg.clientId).toBe('client-1')
      expect(msg.status).toBe(MessageStatus.Sent)
    })

    it('should create attachment when attachmentUrl is present', () => {
      const payload = {
        id: 'server-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'File',
        type: 'text',
        createdAt: new Date().toISOString(),
        isDeleted: false,
        attachmentUrl: 'https://example.com/file.png',
        attachmentName: 'file.png',
        attachmentMime: 'image/png',
      }
      const msg = serverPayloadToMessage(payload)
      expect(msg.attachments).toHaveLength(1)
      expect(msg.attachments[0].url).toBe('https://example.com/file.png')
    })

    it('should mark deleted messages with Read status', () => {
      const payload = {
        id: 'server-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Deleted',
        type: 'text',
        createdAt: new Date().toISOString(),
        isDeleted: true,
      }
      const msg = serverPayloadToMessage(payload)
      expect(msg.status).toBe(MessageStatus.Read)
      expect(msg.isDeleted).toBe(true)
    })
  })

  describe('matchOptimisticMessage', () => {
    it('should match pending message with same content and recent timestamp', () => {
      const now = new Date().toISOString()
      const pending = makeMessage({
        clientId: 'pending-1',
        content: 'Hello',
        status: MessageStatus.Sending,
        createdAt: now,
      })
      const pendingMap = new Map([['pending-1', pending]])

      const serverMsg = makeMessage({
        serverId: 'server-1',
        content: 'Hello',
        createdAt: now,
      })

      const match = matchOptimisticMessage(serverMsg, pendingMap)
      expect(match).toBe('pending-1')
    })

    it('should return null when content differs', () => {
      const now = new Date().toISOString()
      const pending = makeMessage({
        clientId: 'pending-1',
        content: 'Hello',
        status: MessageStatus.Sending,
        createdAt: now,
      })
      const pendingMap = new Map([['pending-1', pending]])

      const serverMsg = makeMessage({
        serverId: 'server-1',
        content: 'Different',
        createdAt: now,
      })

      const match = matchOptimisticMessage(serverMsg, pendingMap)
      expect(match).toBeNull()
    })

    it('should return null when timestamp differs by more than 5 seconds', () => {
      const past = new Date(Date.now() - 10000).toISOString()
      const pending = makeMessage({
        clientId: 'pending-1',
        content: 'Hello',
        status: MessageStatus.Sending,
        createdAt: past,
      })
      const pendingMap = new Map([['pending-1', pending]])

      const serverMsg = makeMessage({
        serverId: 'server-1',
        content: 'Hello',
        createdAt: new Date().toISOString(),
      })

      const match = matchOptimisticMessage(serverMsg, pendingMap)
      expect(match).toBeNull()
    })
  })

  describe('upsertMessage', () => {
    it('should add new message to empty map', () => {
      const msg = makeMessage({ serverId: 'server-1' })
      const result = upsertMessage(new Map(), msg)
      expect(result.size).toBe(1)
      expect(result.get('server-1')).toEqual(msg)
    })

    it('should merge existing message with incoming data', () => {
      const existing = makeMessage({
        serverId: 'server-1',
        status: MessageStatus.Sending,
      })
      const map = new Map([['server-1', existing]])

      const incoming = makeMessage({
        serverId: 'server-1',
        status: MessageStatus.Sent,
      })

      const result = upsertMessage(map, incoming)
      expect(result.size).toBe(1)
      // Status should be upgraded from Sending to Sent
      expect(result.get('server-1')!.status).toBe(MessageStatus.Sent)
    })

    it('should keep higher status when incoming is lower', () => {
      const existing = makeMessage({
        serverId: 'server-1',
        status: MessageStatus.Read,
      })
      const map = new Map([['server-1', existing]])

      const incoming = makeMessage({
        serverId: 'server-1',
        status: MessageStatus.Sent,
      })

      const result = upsertMessage(map, incoming)
      expect(result.get('server-1')!.status).toBe(MessageStatus.Read)
    })
  })

  describe('messageGroupMeta', () => {
    it('should show avatar and author for single message', () => {
      const messages = [makeMessage({ clientId: '1', userId: 'user-1' })]
      const meta = messageGroupMeta(messages)
      const m = meta.get('1')!
      expect(m.showAvatar).toBe(true)
      expect(m.showAuthor).toBe(true)
      expect(m.isGrouped).toBe(false)
    })

    it('should group consecutive messages from same user within time window', () => {
      const now = new Date()
      const messages = [
        makeMessage({ clientId: '1', userId: 'user-1', createdAt: now.toISOString() }),
        makeMessage({
          clientId: '2',
          userId: 'user-1',
          createdAt: new Date(now.getTime() + 1000).toISOString(),
        }),
      ]
      const meta = messageGroupMeta(messages)
      expect(meta.get('1')!.showAvatar).toBe(true)
      expect(meta.get('1')!.isGrouped).toBe(false)
      expect(meta.get('2')!.showAvatar).toBe(false)
      expect(meta.get('2')!.isGrouped).toBe(true)
    })

    it('should not group messages from different users', () => {
      const now = new Date()
      const messages = [
        makeMessage({ clientId: '1', userId: 'user-1', createdAt: now.toISOString() }),
        makeMessage({
          clientId: '2',
          userId: 'user-2',
          createdAt: new Date(now.getTime() + 1000).toISOString(),
        }),
      ]
      const meta = messageGroupMeta(messages)
      expect(meta.get('1')!.showAvatar).toBe(true)
      expect(meta.get('2')!.showAvatar).toBe(true)
      expect(meta.get('2')!.isGrouped).toBe(false)
    })

    it('should handle system messages', () => {
      const messages = [
        makeMessage({ clientId: '1', type: 'system' }),
        makeMessage({ clientId: '2', userId: 'user-1' }),
      ]
      const meta = messageGroupMeta(messages)
      expect(meta.get('1')!.showAvatar).toBe(false)
      expect(meta.get('1')!.showAuthor).toBe(false)
    })
  })

  describe('getSortedMessages', () => {
    it('should sort messages by createdAt ascending', () => {
      const msg1 = makeMessage({
        serverId: '1',
        createdAt: '2024-01-01T12:00:00Z',
      })
      const msg2 = makeMessage({
        serverId: '2',
        createdAt: '2024-01-01T11:00:00Z',
      })
      const map = new Map([
        ['1', msg1],
        ['2', msg2],
      ])

      const sorted = getSortedMessages(map)
      expect(sorted[0].serverId).toBe('2')
      expect(sorted[1].serverId).toBe('1')
    })

    it('should filter out deleted messages', () => {
      const msg1 = makeMessage({ serverId: '1', isDeleted: false })
      const msg2 = makeMessage({ serverId: '2', isDeleted: true })
      const map = new Map([
        ['1', msg1],
        ['2', msg2],
      ])

      const sorted = getSortedMessages(map)
      expect(sorted).toHaveLength(1)
      expect(sorted[0].serverId).toBe('1')
    })
  })
})
