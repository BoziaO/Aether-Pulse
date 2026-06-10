import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { io as ioClient, Socket } from 'socket.io-client'

describe('Socket.io Server', () => {
  let io: Server
  let server: ReturnType<typeof createServer>
  let client: Socket

  beforeAll(async () => {
    server = createServer()
    io = new Server(server, { cors: { origin: '*', credentials: true } })
    
    await new Promise<void>((resolve) => {
      server.listen(3001, resolve)
    })
    
    client = ioClient('http://localhost:3001', { autoConnect: false })
    client.connect()
    
    await new Promise<void>((resolve) => {
      client.on('connect', resolve)
    })
  })

  afterAll(() => {
    client.disconnect()
    io.close()
    server.close()
  })

  it('should connect to socket server', () => {
    expect(client.connected).toBe(true)
  })
})
