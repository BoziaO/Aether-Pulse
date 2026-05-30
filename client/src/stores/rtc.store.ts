import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { getSocket, connectSocket } from '@/services/socket/socket'
import { PeerManager } from '@/services/rtc/peer'
import { spatialAudio } from '@/services/rtc/spatial-audio'
import { startScreenShare, type ScreenShareQuality } from '@/services/rtc/screen-share'
import { useChatStore } from './chat.store'
import { useAuthStore } from './auth.store'
import type { Message } from '@/types/message.types'

export const useRtcStore = defineStore('rtc', () => {
  const localStream = shallowRef<MediaStream | null>(null)
  const screenStream = shallowRef<MediaStream | null>(null)
  const remoteStreams = ref<Map<number, MediaStream>>(new Map())
  const isMuted = ref(false)
  const isVideoOn = ref(false)
  const isScreenSharing = ref(false)
  const inCall = ref(false)
  const roomUsers = ref<number[]>([])

  let peerManager: PeerManager | null = null
  let currentRoomId: string | null = null

  function onRemoteStream(userId: number, stream: MediaStream) {
    remoteStreams.value = new Map(remoteStreams.value.set(userId, stream))
    if (spatialAudio.enabled) {
      spatialAudio.attachStream(userId, stream)
    }
  }

  function onPeerClose(userId: number) {
    const newMap = new Map(remoteStreams.value)
    newMap.delete(userId)
    remoteStreams.value = newMap
    spatialAudio.detachStream(userId)
  }

  async function joinRoom(roomId: string, userId: number) {
    currentRoomId = roomId
    const socket = connectSocket()

    const chatStore = useChatStore()
    const authStore = useAuthStore()

    socket.on('new-message', (msg: Message) => {
      chatStore.addMessage(msg)
    })

    socket.on('user-typing', ({ userId: uid, isTyping }: { userId: number; isTyping: boolean }) => {
      if (isTyping) chatStore.addTypingUser(uid)
      else chatStore.removeTypingUser(uid)
    })

    socket.on('room-users', ({ userIds }: { userIds: number[] }) => {
      roomUsers.value = userIds
    })

    socket.on('user-joined', ({ userId: uid, socketId }: { userId: number; socketId: string }) => {
      roomUsers.value = [...new Set([...roomUsers.value, uid])]
      if (inCall.value && peerManager && !peerManager.hasPeer(socketId)) {
        peerManager.initiateCall(uid, socketId)
      }
    })

    socket.on('user-left', ({ userId: uid }: { userId: number }) => {
      roomUsers.value = roomUsers.value.filter(id => id !== uid)
      onPeerClose(uid)
    })

    socket.emit('join-room', { roomId, userId })
    await chatStore.loadMessages(roomId)
  }

  function leaveRoom(userId: number) {
    if (currentRoomId) {
      const socket = getSocket()
      socket.emit('leave-room', { roomId: currentRoomId, userId })
      socket.removeAllListeners('new-message')
      socket.removeAllListeners('user-typing')
      socket.removeAllListeners('user-joined')
      socket.removeAllListeners('user-left')
      socket.removeAllListeners('room-users')
    }
    endCall()
    useChatStore().clearMessages()
    currentRoomId = null
    roomUsers.value = []
  }

  async function startCall() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoOn.value })
      localStream.value = stream
      inCall.value = true

      const socket = getSocket()
      peerManager = new PeerManager(socket, onRemoteStream, onPeerClose)
      peerManager.setLocalStream(stream)
    } catch (e) {
      console.error('Failed to start call:', e)
      throw e
    }
  }

  function endCall() {
    localStream.value?.getTracks().forEach(t => t.stop())
    screenStream.value?.getTracks().forEach(t => t.stop())
    localStream.value = null
    screenStream.value = null
    isScreenSharing.value = false
    inCall.value = false
    isMuted.value = false
    isVideoOn.value = false
    peerManager?.destroyAll()
    peerManager = null
    remoteStreams.value = new Map()
    spatialAudio.cleanup()
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    localStream.value?.getAudioTracks().forEach(t => { t.enabled = !isMuted.value })
  }

  async function toggleVideo() {
    isVideoOn.value = !isVideoOn.value
    if (isVideoOn.value) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const videoTrack = videoStream.getVideoTracks()[0]
        if (localStream.value) {
          localStream.value.addTrack(videoTrack)
          peerManager?.addTrack(videoTrack, localStream.value)
        }
      } catch (e) {
        isVideoOn.value = false
        throw e
      }
    } else {
      localStream.value?.getVideoTracks().forEach(t => {
        t.stop()
        peerManager?.removeTrack(t, localStream.value!)
        localStream.value?.removeTrack(t)
      })
    }
  }

  async function shareScreen(quality: ScreenShareQuality) {
    try {
      const stream = await startScreenShare(quality)
      screenStream.value = stream
      isScreenSharing.value = true
      const videoTrack = stream.getVideoTracks()[0]
      if (localStream.value && peerManager) {
        const existingVideo = localStream.value.getVideoTracks()[0]
        if (existingVideo) peerManager.removeTrack(existingVideo, localStream.value)
        peerManager.addTrack(videoTrack, stream)
      }
      videoTrack.onended = () => stopScreenShare()
    } catch (e) {
      console.error('Screen share failed:', e)
      throw e
    }
  }

  function stopScreenShare() {
    screenStream.value?.getTracks().forEach(t => t.stop())
    screenStream.value = null
    isScreenSharing.value = false
  }

  return {
    localStream, screenStream, remoteStreams, isMuted, isVideoOn,
    isScreenSharing, inCall, roomUsers,
    joinRoom, leaveRoom, startCall, endCall,
    toggleMute, toggleVideo, shareScreen, stopScreenShare,
  }
})
