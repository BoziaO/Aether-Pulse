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
  private localUserId: number
  private onStream: (userId: number, stream: MediaStream) => void
  private onClose: (userId: number) => void

  private onOffer = ({ from, fromUserId, offer }: { from: string; fromUserId?: number; offer: SimplePeer.SignalData }) => {
    this.handleOffer(from, fromUserId ?? 0, offer)
  }
  private onAnswer = ({ from, fromUserId, answer }: { from: string; fromUserId?: number; answer: SimplePeer.SignalData }) => {
    const conn = this.peers.get(from)
    if (conn) {
      if (!conn.userId && fromUserId) conn.userId = fromUserId
      conn.peer.signal(answer)
    }
  }
  private onIceCandidate = ({ from, candidate }: { from: string; candidate: SimplePeer.SignalData }) => {
    const conn = this.peers.get(from)
    if (conn) conn.peer.signal(candidate)
  }

  constructor(
    socket: Socket,
    localUserId: number,
    onStream: (userId: number, stream: MediaStream) => void,
    onClose: (userId: number) => void,
  ) {
    this.socket = socket
    this.localUserId = localUserId
    this.onStream = onStream
    this.onClose = onClose
    this.setupSignaling()
  }

  private setupSignaling() {
    this.socket.on('offer', this.onOffer)
    this.socket.on('answer', this.onAnswer)
    this.socket.on('ice-candidate', this.onIceCandidate)
  }

  setLocalStream(stream: MediaStream | null) {
    this.localStream = stream
  }

  initiateCall(userId: number, socketId: string) {
    if (this.peers.has(socketId)) return
    const peer = this.createPeer(true, userId, socketId)
    this.peers.set(socketId, { peer, userId, socketId, stream: null })
  }

  private handleOffer(fromSocketId: string, fromUserId: number, signal: SimplePeer.SignalData) {
    if (this.peers.has(fromSocketId)) {
      this.peers.get(fromSocketId)!.peer.signal(signal)
      return
    }
    const peer = this.createPeer(false, fromUserId, fromSocketId)
    this.peers.set(fromSocketId, { peer, userId: fromUserId, socketId: fromSocketId, stream: null })
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
        this.socket.emit('offer', { to: socketId, fromUserId: this.localUserId, offer: signal })
      } else {
        this.socket.emit('answer', { to: socketId, fromUserId: this.localUserId, answer: signal })
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

    // When new tracks are added (e.g., camera toggled on, screen share), ensure UI/audio updates.
    peer.on('track', (_track: MediaStreamTrack, stream: MediaStream) => {
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

    // Avoid duplicated listeners when leaving/re-joining calls.
    this.socket.off('offer', this.onOffer)
    this.socket.off('answer', this.onAnswer)
    this.socket.off('ice-candidate', this.onIceCandidate)
  }

  hasPeer(socketId: string): boolean {
    return this.peers.has(socketId)
  }
}
