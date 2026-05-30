import SimplePeer from 'simple-peer'
import type { Socket } from 'socket.io-client'

export type PeerEventType = 'stream' | 'close' | 'error'

export interface PeerConnection {
  peer: InstanceType<typeof SimplePeer>
  userId: number
  socketId: string
  stream: MediaStream | null
}

export class PeerManager {
  private peers = new Map<string, PeerConnection>()
  private socket: Socket
  private localStream: MediaStream | null = null
  private onStream: (userId: number, stream: MediaStream) => void
  private onClose: (userId: number) => void

  constructor(
    socket: Socket,
    onStream: (userId: number, stream: MediaStream) => void,
    onClose: (userId: number) => void,
  ) {
    this.socket = socket
    this.onStream = onStream
    this.onClose = onClose
    this.setupSignaling()
  }

  private setupSignaling() {
    this.socket.on('offer', ({ from, offer }: { from: string; offer: SimplePeer.SignalData }) => {
      this.handleOffer(from, offer)
    })
    this.socket.on('answer', ({ from, answer }: { from: string; answer: SimplePeer.SignalData }) => {
      const conn = this.peers.get(from)
      if (conn) conn.peer.signal(answer)
    })
    this.socket.on('ice-candidate', ({ from, candidate }: { from: string; candidate: SimplePeer.SignalData }) => {
      const conn = this.peers.get(from)
      if (conn) conn.peer.signal(candidate)
    })
  }

  setLocalStream(stream: MediaStream | null) {
    this.localStream = stream
  }

  initiateCall(userId: number, socketId: string) {
    if (this.peers.has(socketId)) return
    const peer = this.createPeer(true, userId, socketId)
    this.peers.set(socketId, { peer, userId, socketId, stream: null })
  }

  private handleOffer(fromSocketId: string, signal: SimplePeer.SignalData) {
    if (this.peers.has(fromSocketId)) {
      this.peers.get(fromSocketId)!.peer.signal(signal)
      return
    }
    const peer = this.createPeer(false, 0, fromSocketId)
    this.peers.set(fromSocketId, { peer, userId: 0, socketId: fromSocketId, stream: null })
    peer.signal(signal)
  }

  private createPeer(initiator: boolean, userId: number, socketId: string): InstanceType<typeof SimplePeer> {
    const peer = new SimplePeer({
      initiator,
      stream: this.localStream || undefined,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    })

    peer.on('signal', (signal) => {
      if (initiator) {
        this.socket.emit('offer', { to: socketId, offer: signal })
      } else {
        this.socket.emit('answer', { to: socketId, answer: signal })
      }
    })

    peer.on('stream', (stream: MediaStream) => {
      const conn = this.peers.get(socketId)
      if (conn) {
        conn.stream = stream
        conn.userId = userId || conn.userId
        this.onStream(conn.userId, stream)
      }
    })

    peer.on('close', () => {
      const conn = this.peers.get(socketId)
      if (conn) {
        this.onClose(conn.userId)
        this.peers.delete(socketId)
      }
    })

    peer.on('error', (err) => {
      console.warn('Peer error:', err)
    })

    return peer
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    this.peers.forEach(({ peer }) => {
      try { peer.addTrack(track, stream) } catch {}
    })
  }

  removeTrack(track: MediaStreamTrack, stream: MediaStream) {
    this.peers.forEach(({ peer }) => {
      try { peer.removeTrack(track, stream) } catch {}
    })
  }

  destroyAll() {
    this.peers.forEach(({ peer }) => peer.destroy())
    this.peers.clear()
  }

  hasPeer(socketId: string): boolean {
    return this.peers.has(socketId)
  }
}
