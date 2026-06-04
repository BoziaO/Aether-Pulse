<script setup lang="ts">
import { ref } from 'vue'
import { Search, UserPlus, X, Check, Clock } from 'lucide-vue-next'
import { useFriendsStore } from '@/stores/friends.store'
import { friendsApi } from '@/services/api/friends.api'
import { useRouter } from 'vue-router'
import UserAvatar from '@/components/profile/UserAvatar.vue'
import type { UserSearchResult } from '@/types/friend.types'

const friendsStore = useFriendsStore()
const router = useRouter()
const searchQuery = ref('')
const searchResults = ref<UserSearchResult[]>([])
const searching = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    const q = searchQuery.value.trim()
    if (q.length < 2) {
      searchResults.value = []
      return
    }
    searching.value = true
    try {
      searchResults.value = await friendsApi.search(q)
    } catch {
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

async function sendRequest(userId: number) {
  await friendsStore.sendRequest(userId)
  await handleSearch()
}

async function accept(userId: number) {
  await friendsStore.accept(userId)
}

async function reject(userId: number) {
  await friendsStore.reject(userId)
}

function openDm(userId: number) {
  router.push({ name: 'dm', params: { userId: String(userId) } })
}
</script>

<template>
  <div class="friends-view">
    <header class="page-header">
      <div>
        <h1>Friends</h1>
        <p>Connect with people and start direct messages.</p>
      </div>
    </header>

    <div class="search-box">
      <Search :size="16" />
      <input
        v-model="searchQuery"
        placeholder="Search by username or display name..."
        @input="handleSearch"
      />
    </div>

    <div v-if="searchQuery.trim().length >= 2" class="section">
      <h2>Search results</h2>
      <div v-if="searching" class="empty">Searching...</div>
      <div v-else-if="searchResults.length === 0" class="empty">No users found.</div>
      <div v-for="result in searchResults" :key="result.user.id" class="user-row">
        <UserAvatar :user="result.user" :size="40" />
        <div class="user-info">
          <strong>{{ result.user.displayName }}</strong>
          <span>@{{ result.user.username }}</span>
        </div>
        <button
          v-if="result.status === 'none'"
          class="btn-primary small"
          @click="sendRequest(result.user.id)"
        >
          <UserPlus :size="14" /> Add Friend
        </button>
        <span v-else-if="result.status === 'friends'" class="badge friends">Friends</span>
        <span v-else-if="result.status === 'pending_outgoing'" class="badge pending"
          ><Clock :size="12" /> Pending</span
        >
        <button
          v-else-if="result.status === 'pending_incoming'"
          class="btn-primary small"
          @click="accept(result.user.id)"
        >
          <Check :size="14" /> Accept
        </button>
      </div>
    </div>

    <div v-if="friendsStore.outgoing.length" class="section">
      <h2>Sent requests ({{ friendsStore.outgoing.length }})</h2>
      <div v-for="req in friendsStore.outgoing" :key="req.requestId" class="user-row">
        <UserAvatar :user="req.user" :size="40" />
        <div class="user-info">
          <strong>{{ req.user.displayName }}</strong>
          <span>@{{ req.user.username }}</span>
        </div>
        <span class="badge pending"><Clock :size="12" /> Pending</span>
        <button class="btn-ghost small danger" @click="friendsStore.remove(req.user.id)">
          Cancel
        </button>
      </div>
    </div>

    <div v-if="friendsStore.incoming.length" class="section">
      <h2>Incoming requests ({{ friendsStore.incoming.length }})</h2>
      <div v-for="req in friendsStore.incoming" :key="req.requestId" class="user-row">
        <UserAvatar :user="req.user" :size="40" />
        <div class="user-info">
          <strong>{{ req.user.displayName }}</strong>
          <span>@{{ req.user.username }}</span>
        </div>
        <button class="btn-primary small" @click="accept(req.user.id)">
          <Check :size="14" /> Accept
        </button>
        <button class="btn-ghost small" @click="reject(req.user.id)"><X :size="14" /></button>
      </div>
    </div>

    <div class="section">
      <h2>All friends ({{ friendsStore.friends.length }})</h2>
      <div v-if="friendsStore.friends.length === 0" class="empty">
        No friends yet. Search above to add someone!
      </div>
      <div v-for="entry in friendsStore.friends" :key="entry.user.id" class="user-row">
        <UserAvatar :user="entry.user" :size="40" />
        <div class="user-info">
          <strong>{{ entry.user.displayName }}</strong>
          <span>@{{ entry.user.username }}</span>
        </div>
        <button class="btn-ghost small" @click="openDm(entry.user.id)">Message</button>
        <button class="btn-ghost small danger" @click="friendsStore.remove(entry.user.id)">
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friends-view {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  max-width: 720px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 750;
  color: var(--text-primary);
}
.page-header p {
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 4px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 24px 0;
  padding: 0 14px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-surface);
  color: var(--text-muted);
}
.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
}
.section {
  margin-bottom: 28px;
}
.section h2 {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  margin-bottom: 8px;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.user-info strong {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
}
.user-info span {
  color: var(--text-muted);
  font-size: 12px;
}
.small {
  font-size: 12px;
  padding: 6px 10px;
  gap: 6px;
}
.badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
}
.badge.friends {
  background: rgba(34, 197, 94, 0.12);
  color: var(--success);
}
.badge.pending {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(245, 158, 11, 0.12);
  color: var(--warning);
}
.danger {
  color: var(--danger) !important;
}
.empty {
  color: var(--text-muted);
  font-size: 14px;
  padding: 16px 0;
}
</style>
