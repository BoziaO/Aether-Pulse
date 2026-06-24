import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { friendsApi } from '@/services/api/friends.api'
import { connectSocket } from '@/services/socket/socket'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import type { FriendEntry, FriendRequest, FriendshipStatus } from '@/types/friend.types'

export const useFriendsStore = defineStore('friends', () => {
  const auth = useAuthStore()
  const friends = ref<FriendEntry[]>([])
  const incoming = ref<FriendRequest[]>([])
  const outgoing = ref<FriendRequest[]>([])
  const loading = ref(false)
  const socketBound = ref(false)

  const pendingCount = computed(() => incoming.value.length)

  async function fetchFriends() {
    loading.value = true
    try {
      const data = await auth.authRequest(() => friendsApi.list())
      friends.value = data.friends
      incoming.value = data.incoming
      outgoing.value = data.outgoing
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to load friends')
    } finally {
      loading.value = false
    }
  }

  function bindSocketEvents() {
    if (socketBound.value) return
    const socket = connectSocket()
    const toast = useToastStore()

    socket.on('friend-request', (payload: { user?: { displayName?: string } }) => {
      toast.push(`${payload.user?.displayName ?? 'Someone'} sent you a friend request`)
      fetchFriends()
    })
    socket.on('friend-accepted', () => {
      toast.success('Friend request accepted!')
      fetchFriends()
    })
    socket.on('friendship-updated', () => {
      fetchFriends()
    })
    socketBound.value = true
  }

  async function sendRequest(userId: string) {
    try {
      const res = await auth.authRequest(() => friendsApi.sendRequest(userId))
      useToastStore().success(
        res.status === 'accepted' ? 'You are now friends!' : 'Friend request sent'
      )
      await fetchFriends()
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to send request')
      throw e
    }
  }

  async function accept(userId: string) {
    try {
      await auth.authRequest(() => friendsApi.accept(userId))
      useToastStore().success('Friend added')
      await fetchFriends()
    } catch (e) {
      useToastStore().error(e instanceof Error ? e.message : 'Failed to accept request')
      throw e
    }
  }

  async function reject(userId: string) {
    await auth.authRequest(() => friendsApi.reject(userId))
    await fetchFriends()
  }

  async function remove(userId: string) {
    await auth.authRequest(() => friendsApi.remove(userId))
    useToastStore().push('Friend removed')
    await fetchFriends()
  }

  async function block(userId: string) {
    await auth.authRequest(() => friendsApi.block(userId))
    useToastStore().push('User blocked')
    await fetchFriends()
  }

  async function getStatus(userId: string): Promise<FriendshipStatus> {
    const res = await auth.authRequest(() => friendsApi.getStatus(userId))
    return res.status
  }

  function isFriend(userId: string) {
    return friends.value.some((f) => f.user.id === userId)
  }

  return {
    friends,
    incoming,
    outgoing,
    loading,
    pendingCount,
    fetchFriends,
    bindSocketEvents,
    sendRequest,
    accept,
    reject,
    remove,
    block,
    getStatus,
    isFriend,
  }
})
