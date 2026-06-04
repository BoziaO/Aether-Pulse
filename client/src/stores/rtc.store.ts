import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { getSocket, connectSocket } from '@/services/socket/socket'
import { PeerManager } from '@/services/rtc/peer'
import { spatialAudio } from '@/services/rtc/spatial-audio'
import { startScreenShare, type ScreenShareQuality } from '@/services/rtc/screen-share'
import { useChatStore } from './chat.store'
import { useAuthStore } from './auth.store'
import { usePresenceStore } from './presence.store'
import { useRoomStore } from './room.store'
import { useSettingsStore } from './settings.store'
import { useToastStore } from './toast.store'
import type { Message } from '@/types/message.types'
import type { User } from '@/types/user.types'

export const useRtcStore = defineStore('rtc', () => {
  const localStream = shallowRef<MediaStream | null>(null)
  const screenStream = shallowRef<MediaStream | null>(null)
  const remoteStreams = ref<Map<number, MediaStream>>(new Map())
  const isMuted = ref(false)
  const isVideoOn = ref(false)
  const isScreenSharing = ref(false)
  const inCall = ref(false)
  const roomUsers = ref<number[]>([])
  const callUsers = ref<Map<number, string>>(new Map()) // userId -> socketId

  let peerManager: PeerManager | null = null
  let currentRoomId: string | null = null
  let lastSharedScreenVideoTrack: MediaStreamTrack | null = null
  let lastRemovedCameraTrack: MediaStreamTrack | null = null

  function onRemoteStream(userId: number, stream: MediaStream) {
    remoteStreams.value = new Map(remoteStreams.value.set(userId, stream))
    if (spatialAudio.enabled) {
      // Calculate a position based on number of remote streams to spread them out.
      const index = Array.from(remoteStreams.value.keys()).indexOf(userId)
      const angle = (index * 45 * Math.PI) / 180 // Spread every 45 degrees
      const radius = 2
      const x = Math.sin(angle) * radius
      const z = -Math.cos(angle) * radius
      spatialAudio.attachStream(userId, stream, { x, y: 0, z })
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

    // Remove existing listeners to prevent leaks
    socket.off('new-message')
    socket.off('message-updated')
    socket.off('user-typing')
    socket.off('room-users')
    socket.off('user-joined')
    socket.off('user-left')
    socket.off('user-status-changed')
    socket.off('room-activity-changed')
    socket.off('room-updated')
    socket.off('call-users')
    socket.off('call-user-joined')
    socket.off('call-user-left')

    const chatStore = useChatStore()
    const authStore = useAuthStore()
    const presenceStore = usePresenceStore()
    const roomStore = useRoomStore()

    socket.on('new-message', (msg: Message) => {
      chatStore.addMessage(msg)
    })

    socket.on('message-updated', (msg: Message) => {
      chatStore.updateMessage(msg)
    })

    socket.on('user-typing', ({ userId: uid, isTyping }: { userId: number; isTyping: boolean }) => {
      if (isTyping) chatStore.addTypingUser(uid)
      else chatStore.removeTypingUser(uid)
    })

    socket.on('room-users', ({ userIds }: { userIds: number[] }) => {
      roomUsers.value = userIds
      presenceStore.setRoomOnline(userIds)
    })

    socket.on('user-joined', ({ userId: uid }: { userId: number; socketId: string }) => {
      roomUsers.value = [...new Set([...roomUsers.value, uid])]
      presenceStore.userJoined(uid)
    })

    socket.on('user-left', ({ userId: uid }: { userId: number }) => {
      roomUsers.value = roomUsers.value.filter((id) => id !== uid)
      presenceStore.userLeft(uid)
      onPeerClose(uid)
    })

    socket.on(
      'user-status-changed',
      ({ userId: uid, status }: { userId: number; status: User['status'] }) => {
        presenceStore.setStatus(uid, status)
        if (roomStore.currentRoom?.members) {
          const member = roomStore.currentRoom.members.find((m) => m.id === uid)
          if (member) member.status = status
        }
      }
    )

    socket.on(
      'room-activity-changed',
      ({ roomId: rid, isActive }: { roomId: string; isActive: boolean }) => {
        const room = roomStore.rooms.find((r) => r.id === rid)
        if (room) room.isActive = isActive
        if (roomStore.currentRoom?.id === rid) {
          roomStore.currentRoom.isActive = isActive
        }
      }
    )

    socket.on('room-updated', (room: typeof roomStore.currentRoom) => {
      if (!room) return
      if (roomStore.currentRoom?.id === room.id) roomStore.currentRoom = room
      const idx = roomStore.rooms.findIndex((r) => r.id === room.id)
      if (idx >= 0) roomStore.rooms[idx] = room
    })

    // Voice/video call participants (separate from "in room")
    socket.on('call-users', ({ users }: { users: { userId: number; socketId: string }[] }) => {
      const m = new Map<number, string>()
      users.forEach((u) => m.set(u.userId, u.socketId))
      callUsers.value = m

      // If we're already in-call, connect to existing call participants.
      if (inCall.value && peerManager && authStore.user) {
        users.forEach((u) => {
          if (u.userId === authStore.user!.id) return
          // Deterministic initiator to avoid duplicate peer connections.
          if (authStore.user!.id < u.userId) peerManager!.initiateCall(u.userId, u.socketId)
        })
      }
    })

    socket.on(
      'call-user-joined',
      ({ userId: uid, socketId }: { userId: number; socketId: string }) => {
        callUsers.value = new Map(callUsers.value.set(uid, socketId))
        if (inCall.value && peerManager && authStore.user) {
          if (authStore.user.id < uid && !peerManager.hasPeer(socketId)) {
            peerManager.initiateCall(uid, socketId)
          }
        }
      }
    )

    socket.on('call-user-left', ({ userId: uid }: { userId: number }) => {
      const m = new Map(callUsers.value)
      m.delete(uid)
      callUsers.value = m
      onPeerClose(uid)
    })

    socket.emit('join-room', { roomId, userId })
    await chatStore.loadMessages(roomId)
  }

  function leaveRoom(userId: number) {
    if (currentRoomId) {
      const socket = getSocket()
      if (inCall.value) {
        socket.emit('leave-call', { roomId: currentRoomId, userId })
      }
      socket.emit('leave-room', { roomId: currentRoomId, userId })
      socket.removeAllListeners('new-message')
      socket.removeAllListeners('message-updated')
      socket.removeAllListeners('user-typing')
      socket.removeAllListeners('user-joined')
      socket.removeAllListeners('user-left')
      socket.removeAllListeners('room-users')
      socket.removeAllListeners('user-status-changed')
      socket.removeAllListeners('room-activity-changed')
      socket.removeAllListeners('room-updated')
      socket.removeAllListeners('call-users')
      socket.removeAllListeners('call-user-joined')
      socket.removeAllListeners('call-user-left')
    }
    endCall()
    useChatStore().clearMessages()
    currentRoomId = null
    roomUsers.value = []
    callUsers.value = new Map()
  }

  async function startCall() {
    try {
      const authStore = useAuthStore()
      if (!authStore.user) throw new Error('Not authenticated')
      if (!currentRoomId) throw new Error('Not in a room')

      const settings = useSettingsStore()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: settings.noiseSuppressionEnabled,
          autoGainControl: true,
        },
        video: isVideoOn.value,
      })
      localStream.value = stream
      inCall.value = true

      const socket = getSocket()
      peerManager = new PeerManager(socket, authStore.user.id, onRemoteStream, onPeerClose)
      peerManager.setLocalStream(stream)

      // Announce that we joined the call; server replies with current call participants.
      socket.emit('join-call', { roomId: currentRoomId, userId: authStore.user.id })
    } catch (e: any) {
      console.error('Failed to start call:', e)
      const toastStore = useToastStore()
      let msg = 'Failed to start call'
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = 'Microphone/Camera permission denied. Please allow access.'
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        msg = 'No input media devices found.'
      }
      toastStore.error(msg)
      throw e
    }
  }

  function endCall() {
    const authStore = useAuthStore()
    if (currentRoomId && inCall.value && authStore.user) {
      try {
        getSocket().emit('leave-call', { roomId: currentRoomId, userId: authStore.user.id })
      } catch {}
    }

    localStream.value?.getTracks().forEach((t) => t.stop())
    screenStream.value?.getTracks().forEach((t) => t.stop())
    localStream.value = null
    screenStream.value = null
    isScreenSharing.value = false
    inCall.value = false
    isMuted.value = false
    isVideoOn.value = false
    lastSharedScreenVideoTrack = null
    lastRemovedCameraTrack = null
    peerManager?.destroyAll()
    peerManager = null
    remoteStreams.value = new Map()
    spatialAudio.cleanup()
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    localStream.value?.getAudioTracks().forEach((t) => {
      t.enabled = !isMuted.value
    })
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
      } catch (e: any) {
        isVideoOn.value = false
        const toastStore = useToastStore()
        let msg = 'Failed to access camera'
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          msg = 'Camera permission denied.'
        }
        toastStore.error(msg)
        throw e
      }
    } else {
      localStream.value?.getVideoTracks().forEach((t) => {
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
        if (existingVideo) {
          lastRemovedCameraTrack = existingVideo
          peerManager.removeTrack(existingVideo, localStream.value)
        }
        lastSharedScreenVideoTrack = videoTrack
        peerManager.addTrack(videoTrack, stream)
      }
      videoTrack.onended = () => stopScreenShare()
    } catch (e: any) {
      console.error('Screen share failed:', e)
      const toastStore = useToastStore()
      let msg = 'Failed to share screen'
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = 'Screen sharing permission denied.'
      }
      toastStore.error(msg)
      throw e
    }
  }

  function stopScreenShare() {
    // Remove screen track from peers before stopping it.
    if (screenStream.value && peerManager && lastSharedScreenVideoTrack) {
      peerManager.removeTrack(lastSharedScreenVideoTrack, screenStream.value)
    }

    screenStream.value?.getTracks().forEach((t) => t.stop())
    screenStream.value = null
    isScreenSharing.value = false

    // Restore camera video track if camera is enabled.
    if (localStream.value && peerManager && isVideoOn.value && lastRemovedCameraTrack) {
      peerManager.addTrack(lastRemovedCameraTrack, localStream.value)
    }

    lastSharedScreenVideoTrack = null
    lastRemovedCameraTrack = null
  }

  return {
    localStream,
    screenStream,
    remoteStreams,
    isMuted,
    isVideoOn,
    isScreenSharing,
    inCall,
    roomUsers,
    callUsers,
    joinRoom,
    leaveRoom,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    shareScreen,
    stopScreenShare,
  }
})
