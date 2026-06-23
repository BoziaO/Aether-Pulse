import SimplePeer from 'simple-peer'
import type { Socket } from 'socket.io-client'

export type PeerEventType = 'stream' | 'close' | 'error'

export interface PeerConnection {
  peer: InstanceType<typeof SimplePeer>
  userId: string
  socketId: string
  stream: MediaStream | null
  createdAt: number
  lastActivity: number
}

export class PeerManager {
  private peers = new Map<string, PeerConnection>()
  private socket: Socket
  private localStream: MediaStream | null = null
  private localUserId: string
  private onStream: (userId: string, stream: MediaStream) => void
  private onClose: (userId: string) => void
  private cleanupInterval: NodeJS.Timeout | null = null
  private maxPeerAge = 300000 // 5 minutes
  private inactiveThreshold = 60000 // 1 minute

  private onOffer = ({
    from,
    fromUserId,
    offer,
  }: {
    from: string
    fromUserId?: string
    offer: SimplePeer.SignalData
  }) => {
    this.handleOffer(from, fromUserId ?? '', offer)
  }
  private onAnswer = ({
    from,
    fromUserId,
    answer,
  }: {
    from: string
    fromUserId?: string
    answer: SimplePeer.SignalData
  }) => {
    const conn = this.peers.get(from)
    if (conn) {
      if (!conn.userId && fromUserId) conn.userId = fromUserId
      conn.peer.signal(answer)
    }
  }
  private onIceCandidate = ({
    from,
    candidate,
  }: {
    from: string
    candidate: SimplePeer.SignalData
  }) => {
    const conn = this.peers.get(from)
    if (conn) conn.peer.signal(candidate)
  }

  constructor(
    socket: Socket,
    localUserId: string,
    onStream: (userId: string, stream: MediaStream) => void,
    onClose: (userId: string) => void
  ) {
    this.socket = socket
    this.localUserId = localUserId
    this.onStream = onStream
    this.onClose = onClose
    this.setupSignaling()
    this.startCleanupInterval()
  }

  private setupSignaling() {
    this.socket.on('offer', this.onOffer)
    this.socket.on('answer', this.onAnswer)
    this.socket.on('ice-candidate', this.onIceCandidate)
  }

  setLocalStream(stream: MediaStream | null) {
    // Clean up previous stream tracks to prevent memory leaks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
      })
    }
    this.localStream = stream
  }

  initiateCall(userId: string, socketId: string) {
    if (this.peers.has(socketId)) return
    
    // Clean up old peers to prevent memory leaks
    this.cleanupOldPeers()
    
    const peer = this.createPeer(true, userId, socketId)
    const now = Date.now()
    this.peers.set(socketId, { 
      peer, 
      userId, 
      socketId, 
      stream: null,
      createdAt: now,
      lastActivity: now
    })
  }

  private handleOffer(fromSocketId: string, fromUserId: string, signal: SimplePeer.SignalData) {
    if (this.peers.has(fromSocketId)) {
      const conn = this.peers.get(fromSocketId)!
      conn.lastActivity = Date.now()
      conn.peer.signal(signal)
      return
    }
    const peer = this.createPeer(false, fromUserId, fromSocketId)
    const now = Date.now()
    this.peers.set(fromSocketId, { 
      peer, 
      userId: fromUserId, 
      socketId: fromSocketId, 
      stream: null,
      createdAt: now,
      lastActivity: now
    })
    peer.signal(signal)
  }

  private createPeer(
    initiator: boolean,
    userId: string,
    socketId: string
  ): InstanceType<typeof SimplePeer> {
    // Electron-specific WebRTC configuration for better compatibility
    const isElectron = typeof (window as any).process?.versions?.electron !== undefined

    const peer = new SimplePeer({
      initiator,
      stream: this.localStream || undefined,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
        ],
        iceTransportPolicy: isElectron ? 'all' : 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      },
      wrtc: isElectron ? (window as any).wrtc : undefined,
      sdpTransform: isElectron ? this.fixSdpForElectron.bind(this) : undefined,
    })

    peer.on('signal', (signal: SimplePeer.SignalData) => {
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

    peer.on('error', (err: Error) => {
      console.warn('Peer error:', err)
    })

    return peer
  }

  /**
   * Fix SDP for Electron WebRTC compatibility
   */
  private fixSdpForElectron(sdp: string): string {
    if (typeof sdp !== 'string') return sdp
    
    // Remove bandwidth constraints that might cause issues in Electron
    // Fix for common Electron WebRTC issues
    let fixedSdp = sdp
    
    // Remove bandwidth constraints that Electron doesn't handle well
    fixedSdp = fixedSdp.replace(/b=AS:\d+\r\n/g, '')
    fixedSdp = fixedSdp.replace(/b=TIAS:\d+\r\n/g, '')
    
    // Ensure proper codec ordering for Electron
    if (fixedSdp.includes('VP8')) {
      // Move VP8 to the top for better compatibility
      const vp8Match = fixedSdp.match(/a=rtpmap:\s*\d+\s*VP8\/96000\r\n/g)
      if (vp8Match) {
        fixedSdp = fixedSdp.replace(/a=rtpmap:\s*\d+\s*VP8\/96000\r\n/g, '')
        fixedSdp = `a=rtpmap:96 VP8/96000\r\n` + fixedSdp
      }
    }
    
    return fixedSdp
  }

  /**
   * Clean up old peers to prevent memory leaks
   */
  private cleanupOldPeers(): void {
    const now = Date.now()
    const oldPeers = []
    
    for (const [socketId, conn] of this.peers.entries()) {
      const age = now - conn.createdAt
      const inactiveTime = now - conn.lastActivity
      
      // Remove peers that are too old or inactive
      if (age > this.maxPeerAge || inactiveTime > this.inactiveThreshold) {
        oldPeers.push(socketId)
      }
    }
    
    oldPeers.forEach(socketId => {
      const conn = this.peers.get(socketId)
      if (conn) {
        try {
          conn.peer.destroy()
        } catch (e) {
          console.warn('Error destroying old peer:', e)
        }
        this.peers.delete(socketId)
      }
    })
  }

  /**
   * Start cleanup interval for memory management
   */
  private startCleanupInterval(): void {
    // Clean up every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldPeers()
    }, 60000)
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    this.peers.forEach(({ peer }) => {
      try {
        peer.addTrack(track, stream)
      } catch {}
    })
  }

  removeTrack(track: MediaStreamTrack, stream: MediaStream) {
    this.peers.forEach(({ peer }) => {
      try {
        peer.removeTrack(track, stream)
      } catch {}
    })
  }

  destroyAll() {
    this.peers.forEach(({ peer }) => {
      try {
        peer.destroy()
      } catch (e) {
        console.warn('Error destroying peer:', e)
      }
    })
    this.peers.clear()
    this.stopCleanupInterval()

    // Avoid duplicated listeners when leaving/re-joining calls.
    this.socket.off('offer', this.onOffer)
    this.socket.off('answer', this.onAnswer)
    this.socket.off('ice-candidate', this.onIceCandidate)
    
    // Additional cleanup for local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try {
          track.stop()
        } catch (e) {
          console.warn('Error stopping track:', e)
        }
      })
      this.localStream = null
    }
  }

  hasPeer(socketId: string): boolean {
    return this.peers.has(socketId)
  }
}
