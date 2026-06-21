import { defineStore } from 'pinia'
import { ref, shallowRef, watch } from 'vue'
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
import { router } from '@/app/router'
import type { Message } from '@/types/message.types'
import type { User } from '@/types/user.types'

export const useRtcStore = defineStore('rtc', () => {
  const localStream = shallowRef<MediaStream | null>(null)
  const screenStream = shallowRef<MediaStream | null>(null)
  const remoteStreams = ref<Map<string, MediaStream>>(new Map())
  const isMuted = ref(false)
  const isVideoOn = ref(false)
  const isScreenSharing = ref(false)
  const inCall = ref(false)
  const isPiP = ref(false)
  const roomUsers = ref<string[]>([])
  const callUsers = ref<Map<string, string>>(new Map()) // userId -> socketId

  let peerManager: PeerManager | null = null
  let currentRoomId: string | null = null
  let lastSharedScreenVideoTrack: MediaStreamTrack | null = null
  let lastRemovedCameraTrack: MediaStreamTrack | null = null
  let wakeLock: WakeLockSentinel | null = null
  let pipVideo: HTMLVideoElement | null = null

  function calculateSpatialPosition(index: number) {
    const settings = useSettingsStore()
    const radius = settings.spatialAudioDistance
    const mode = settings.spatialAudioDirectionMode
    const spreadAngle = settings.spatialAudioSpreadAngle

    let angleRad = 0
    if (mode === 'center') {
      if (index > 0) {
        const step = Math.ceil(index / 2)
        const sign = index % 2 === 1 ? -1 : 1
        angleRad = step * ((spreadAngle * Math.PI) / 180) * sign
      }
    } else if (mode === 'alternating') {
      if (index % 2 === 0) {
        const k = index / 2
        angleRad = -Math.PI / 2 + k * ((spreadAngle * Math.PI) / 180)
      } else {
        const k = (index - 1) / 2
        angleRad = Math.PI / 2 - k * ((spreadAngle * Math.PI) / 180)
      }
    } else if (mode === 'left') {
      angleRad = -Math.PI / 2 + index * ((spreadAngle * Math.PI) / 180)
    } else if (mode === 'right') {
      angleRad = Math.PI / 2 - index * ((spreadAngle * Math.PI) / 180)
    }

    const x = Math.sin(angleRad) * radius
    const z = -Math.cos(angleRad) * radius
    return { x, y: 0, z }
  }

  function updateSpatialPositions() {
    if (!spatialAudio.enabled) return
    const keys = Array.from(remoteStreams.value.keys())
    keys.forEach((userId: string, index) => {
      const pos = calculateSpatialPosition(index)
      spatialAudio.updatePosition(userId, pos.x, pos.y, pos.z)
    })
  }

  // Watch spatial settings to apply panner updates dynamically
  const settings = useSettingsStore()
  watch(
    [
      () => settings.spatialAudioDistance,
      () => settings.spatialAudioDirectionMode,
      () => settings.spatialAudioSpreadAngle,
    ],
    () => {
      if (spatialAudio.enabled) {
        updateSpatialPositions()
      }
    }
  )

  watch(
    () => settings.spatialAudioEnabled,
    (enabled) => {
      if (enabled) {
        remoteStreams.value.forEach((stream, userId: string) => {
          const index = Array.from(remoteStreams.value.keys()).indexOf(userId)
          const pos = calculateSpatialPosition(index)
          spatialAudio.attachStream(userId, stream, pos)
        })
      } else {
        spatialAudio.cleanup()
      }
    }
  )

  function onRemoteStream(userId: string, stream: MediaStream) {
    remoteStreams.value = new Map(remoteStreams.value.set(userId, stream))
    if (spatialAudio.enabled) {
      const index = Array.from(remoteStreams.value.keys()).indexOf(userId)
      const pos = calculateSpatialPosition(index)
      spatialAudio.attachStream(userId, stream, pos)
    }
  }

  function onPeerClose(userId: string) {
    const newMap = new Map(remoteStreams.value)
    newMap.delete(userId)
    remoteStreams.value = newMap
    spatialAudio.detachStream(userId)
  }

  async function joinRoom(roomId: string, userId: string) {
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
    socket.off('room-member-joined')
    socket.off('room-member-left')
    socket.off('room-deleted')
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

    socket.on('user-typing', ({ userId: uid, isTyping }: { userId: string; isTyping: boolean }) => {
      if (isTyping) chatStore.addTypingUser(uid)
      else chatStore.removeTypingUser(uid)
    })

    socket.on('room-users', ({ userIds }: { userIds: string[] }) => {
      roomUsers.value = userIds
      presenceStore.setRoomOnline(userIds)
    })

    socket.on('user-joined', ({ userId: uid }: { userId: string; socketId: string }) => {
      roomUsers.value = [...new Set([...roomUsers.value, uid])]
      presenceStore.userJoined(uid)
    })

    socket.on('user-left', ({ userId: uid }: { userId: string }) => {
      roomUsers.value = roomUsers.value.filter((id) => id !== uid)
      presenceStore.userLeft(uid)
      onPeerClose(uid)
    })

    socket.on(
      'user-status-changed',
      ({ userId: uid, status }: { userId: string; status: User['status'] }) => {
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

    socket.on('room-member-joined', ({ roomId: rid, user: u }: { roomId: string; user: any }) => {
      if (roomStore.currentRoom?.id === rid && roomStore.currentRoom?.members) {
        const exists = roomStore.currentRoom.members.some((m) => m.id === u.id)
        if (!exists) {
          roomStore.currentRoom.members.push(u)
          roomStore.currentRoom.memberCount = roomStore.currentRoom.members.length
        }
      }
    })

    socket.on(
      'room-member-left',
      ({ roomId: rid, userId: uid }: { roomId: string; userId: string }) => {
        if (roomStore.currentRoom?.id === rid && roomStore.currentRoom?.members) {
          roomStore.currentRoom.members = roomStore.currentRoom.members.filter((m) => m.id !== uid)
          roomStore.currentRoom.memberCount = roomStore.currentRoom.members.length
        }
      }
    )

    socket.on('room-deleted', ({ roomId: rid }: { roomId: string }) => {
      roomStore.rooms = roomStore.rooms.filter((r) => r.id !== rid)
      if (roomStore.currentRoom?.id === rid) {
        useToastStore().push('Pokój został usunięty przez właściciela.')
        router.push('/')
      }
    })

    // Voice/video call participants (separate from "in room")
    socket.on('call-users', ({ users }: { users: { userId: string; socketId: string }[] }) => {
      const m = new Map<string, string>()
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
      ({ userId: uid, socketId }: { userId: string; socketId: string }) => {
        callUsers.value = new Map(callUsers.value.set(uid, socketId))
        if (inCall.value && peerManager && authStore.user) {
          if (authStore.user.id < uid && !peerManager.hasPeer(socketId)) {
            peerManager.initiateCall(uid, socketId)
          }
        }
      }
    )

    socket.on('call-user-left', ({ userId: uid }: { userId: string }) => {
      const m = new Map(callUsers.value)
      m.delete(uid)
      callUsers.value = m
      onPeerClose(uid)
    })

    socket.emit('join-room', { roomId, userId })
    await chatStore.loadMessages(roomId)
  }

  function leaveRoom(userId: string) {
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
      socket.removeAllListeners('room-member-joined')
      socket.removeAllListeners('room-member-left')
      socket.removeAllListeners('room-deleted')
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

      // Keep screen awake during call
      await acquireWakeLock()

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
    stopWakeLock()
    exitPiP()
  }

  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await (navigator as any).wakeLock.request('screen')
        wakeLock!.addEventListener('release', () => { wakeLock = null })
      }
    } catch {}
  }

  function stopWakeLock() {
    wakeLock?.release().catch(() => {})
    wakeLock = null
  }

  async function enterPiP() {
    try {
      // Use the first available stream (screen > local)
      const stream = screenStream.value || localStream.value
      if (!stream) return
      if (!pipVideo) {
        pipVideo = document.createElement('video')
        pipVideo.muted = true
        pipVideo.autoplay = true
        pipVideo.playsInline = true
        pipVideo.style.position = 'fixed'
        pipVideo.style.opacity = '0'
        pipVideo.style.pointerEvents = 'none'
        pipVideo.style.width = '1px'
        pipVideo.style.height = '1px'
        document.body.appendChild(pipVideo)
      }
      pipVideo.srcObject = stream
      await pipVideo.play().catch(() => {})
      if ((pipVideo as any).requestPictureInPicture) {
        await (pipVideo as any).requestPictureInPicture()
        isPiP.value = true
        pipVideo.addEventListener('leavepictureinpicture', () => { isPiP.value = false }, { once: true })
      }
    } catch (e) {
      console.warn('PiP not supported:', e)
    }
  }

  function exitPiP() {
    try {
      if ((document as any).pictureInPictureElement) {
        ;(document as any).exitPictureInPicture().catch(() => {})
      }
    } catch {}
    if (pipVideo) {
      pipVideo.srcObject = null
      pipVideo.remove()
      pipVideo = null
    }
    isPiP.value = false
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
    isPiP,
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
    enterPiP,
    exitPiP,
    calculateSpatialPosition,
    updateSpatialPositions,
  }
})
