<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { X, AtSign, Link, MapPin, UserPlus, MessageCircle, Check, Ban } from 'lucide-vue-next'
import { userApi } from '@/services/api/user.api'
import { useAuthStore } from '@/stores/auth.store'
import { useFriendsStore } from '@/stores/friends.store'
import UserAvatar from './UserAvatar.vue'
import type { User } from '@/types/user.types'
import type { FriendshipStatus } from '@/types/friend.types'

const props = defineProps<{
  userId: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const auth = useAuthStore()
const friendsStore = useFriendsStore()

const loading = ref(false)
const error = ref('')
const user = ref<User | null>(null)
const modalRef = ref<HTMLElement | null>(null)
const friendStatus = ref<FriendshipStatus>('none')
const actionLoading = ref(false)

const isSelf = computed(() => auth.user?.id === props.userId)

async function load() {
  loading.value = true
  error.value = ''
  try {
    user.value = await userApi.get(props.userId)
    if (!isSelf.value) {
      friendStatus.value = await friendsStore.getStatus(props.userId)
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load user profile.'
    user.value = null
  } finally {
    loading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  modalRef.value?.focus()
  load()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

watch(() => props.userId, load)

const bannerStyle = computed(() => {
  const u = user.value
  if (!u) return {}
  if (u.bannerUrl) return { backgroundImage: `url(${u.bannerUrl})` }
  if (u.profileGradient) return { background: u.profileGradient }
  return { background: u.accentColor || '#5865f2' }
})

function safeWebsite(url: string | null) {
  const v = (url ?? '').trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

function displayWebsite(url: string | null) {
  const v = (url ?? '').trim()
  if (!v) return ''
  return v.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

async function addFriend() {
  actionLoading.value = true
  try {
    await friendsStore.sendRequest(props.userId)
    friendStatus.value = await friendsStore.getStatus(props.userId)
  } finally {
    actionLoading.value = false
  }
}

async function acceptFriend() {
  actionLoading.value = true
  try {
    await friendsStore.accept(props.userId)
    friendStatus.value = 'friends'
  } finally {
    actionLoading.value = false
  }
}

async function openMessage() {
  emit('close')
  router.push({ name: 'dm', params: { userId: String(props.userId) } })
}

async function blockUser() {
  if (!confirm('Block this user?')) return
  await friendsStore.block(props.userId)
  friendStatus.value = 'blocked'
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div
      ref="modalRef"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-name"
      tabindex="-1"
    >
      <button class="close" type="button" aria-label="Close profile" @click="emit('close')">
        <X :size="18" />
      </button>

      <div class="card">
        <div class="banner" :style="bannerStyle" />

        <div class="shell">
          <div class="avatar-row">
            <UserAvatar :user="user" :size="92" />
          </div>

          <div v-if="loading" class="state">
            <span class="spinner" aria-hidden="true" />
            Loading profile...
          </div>
          <div v-else-if="error" class="state error">{{ error }}</div>

          <template v-else-if="user">
            <div class="name-block">
              <h3 id="profile-name">{{ user.displayName }}</h3>
              <p><AtSign :size="13" />{{ user.username }}</p>
            </div>

            <div v-if="user.customStatus" class="custom-status">
              {{ user.customStatus }}
            </div>

            <div v-if="!isSelf" class="profile-actions">
              <button
                v-if="friendStatus === 'none'"
                class="action-btn primary"
                :disabled="actionLoading"
                @click="addFriend"
              >
                <UserPlus :size="14" /> Add Friend
              </button>
              <button
                v-if="friendStatus === 'pending_incoming'"
                class="action-btn primary"
                :disabled="actionLoading"
                @click="acceptFriend"
              >
                <Check :size="14" /> Accept Request
              </button>
              <span v-if="friendStatus === 'pending_outgoing'" class="action-hint">Friend request sent</span>
              <button
                v-if="friendStatus === 'friends'"
                class="action-btn"
                @click="openMessage"
              >
                <MessageCircle :size="14" /> Message
              </button>
              <button
                v-if="friendStatus !== 'blocked'"
                class="action-btn danger"
                @click="blockUser"
              >
                <Ban :size="14" />
              </button>
            </div>

            <div v-if="user.bio || user.pronouns" class="section">
              <h4>About Me</h4>
              <p v-if="user.bio">{{ user.bio }}</p>
              <span v-if="user.pronouns" class="pill">{{ user.pronouns }}</span>
            </div>

            <div v-if="user.website || user.location" class="links">
              <a
                v-if="user.website"
                :href="safeWebsite(user.website)"
                target="_blank"
                rel="noreferrer"
              >
                <Link :size="14" />
                {{ displayWebsite(user.website) }}
              </a>
              <span v-if="user.location">
                <MapPin :size="14" />
                {{ user.location }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 500;
  animation: fade-in 0.15s ease-out;
}
.modal {
  width: 100%;
  max-width: 420px;
  position: relative;
  animation: slide-up 0.2s ease-out;
}
.close {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.85);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: background 0.15s;
}
.close:hover {
  background: rgba(0, 0, 0, 0.4);
}

.card {
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #111318;
  box-shadow: 0 18px 52px rgba(0, 0, 0, 0.45);
}
.banner {
  height: 140px;
  background-size: cover;
  background-position: center;
}
.shell {
  padding: 0 18px 18px;
}
.avatar-row {
  min-height: 56px;
  display: flex;
  align-items: flex-end;
}
.avatar-row :deep(.avatar-wrap) {
  margin-top: -52px;
  border: 6px solid #111318;
  border-radius: 50%;
}
.name-block {
  margin-top: 10px;
}
.name-block h3 {
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 850;
  overflow-wrap: anywhere;
}
.name-block p {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 3px;
}
.custom-status {
  margin-top: 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
  padding: 10px 12px;
  overflow-wrap: anywhere;
}
.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}
.action-btn.primary {
  background: rgba(139, 92, 246, 0.18);
  border-color: rgba(139, 92, 246, 0.35);
  color: #c4b5fd;
}
.action-btn.danger {
  color: var(--danger);
  padding: 8px 10px;
}
.action-btn:hover:not(:disabled) {
  filter: brightness(1.08);
}
.action-hint {
  font-size: 12px;
  color: var(--text-muted);
  align-self: center;
}
.section {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.section h4 {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.section p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  margin-top: 7px;
  overflow-wrap: anywhere;
}
.pill {
  display: inline-block;
  margin-top: 10px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.14);
  color: #c4b5fd;
  font-size: 12px;
  padding: 4px 9px;
}
.links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
.links a,
.links span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: none;
}
.links a:hover {
  color: var(--accent-blue);
}

.state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 0 6px;
  color: var(--text-muted);
  font-size: 13px;
}
.state.error {
  color: var(--danger);
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--accent-violet);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
