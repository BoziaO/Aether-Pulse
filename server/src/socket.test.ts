import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { Client } from 'socket.io-client'

describe('Socket.io Server', () => {
  let io: Server
  let server: ReturnType<typeof createServer>
  let client: Client

  beforeAll((done) => {
    server = createServer()
    io = new Server(server, { cors: { origin: '*', credentials: true } })
    server.listen(3001, () => {
      client = new Client('http://localhost:3001', { autoConnect: false })
      client.connect()
      client.on('connect', done)
    })
  })

  afterAll(() => {
    io.close()
    server.close()
    client.disconnect()
  })

  it('should connect to socket server', () => {
    expect(client.connected).toBe(true)
  })
})
