<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    X,
    AtSign,
    Link,
    MapPin,
    UserPlus,
    MessageCircle,
    Check,
    Ban,
    Globe,
    Clock,
    BarChart2,
    Users,
    MessageSquare,
    Eye,
  } from 'lucide-vue-next'

  import { userApi, type UserStats } from '@/services/api/user.api'
  import { useAuthStore } from '@/stores/auth.store'
  import { useFriendsStore } from '@/stores/friends.store'
  import AnimatedProfile from './AnimatedProfile.vue'
  import ProfileBadge from './ProfileBadge.vue'
  import type { User } from '@/types/user.types'
  import type { FriendshipStatus } from '@/types/friend.types'

  const props = defineProps<{
    userId: string
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
  const stats = ref<UserStats | null>(null)
  const modalRef = ref<HTMLElement | null>(null)
  const friendStatus = ref<FriendshipStatus>('none')
  const actionLoading = ref(false)

  const isSelf = computed(() => auth.user?.id === String(props.userId))

  async function load() {
    loading.value = true
    error.value = ''
    stats.value = null
    try {
      user.value = await userApi.get(props.userId)
      if (!isSelf.value) {
        friendStatus.value = await friendsStore.getStatus(props.userId)
      }
      // Load stats in background (non-blocking)
      userApi
        .getStats(props.userId)
        .then((s) => {
          stats.value = s
        })
        .catch(() => {})
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

  // Animated banner support
  const ANIM_CLASSES: Record<string, string> = {
    'animated:aurora': 'banner-aurora',
    'animated:neon': 'banner-neon',
    'animated:sunset': 'banner-sunset',
    'animated:ocean': 'banner-ocean',
    'animated:forest': 'banner-forest',
    'animated:cosmic': 'banner-cosmic',
  }

  const bannerAnimClass = computed(() => {
    const u = user.value
    if (!u || u.bannerUrl) return ''
    const g = u.profileGradient ?? ''
    return ANIM_CLASSES[g] ?? ''
  })

  const bannerStyle = computed(() => {
    const u = user.value
    if (!u) return {}
    if (u.bannerUrl) return { backgroundImage: `url(${u.bannerUrl})` }
    if (u.profileGradient && !u.profileGradient.startsWith('animated:'))
      return { background: u.profileGradient }
    if (!u.profileGradient) return { background: u.accentColor || '#5865f2' }
    return {}
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

  function formatLastSeen(isoStr: string | null | undefined): string {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ''
    const now = Date.now()
    const diff = now - d.getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString()
  }

  const maxActivity = computed(() => {
    if (!stats.value?.activityByDay?.length) return 1
    return Math.max(...stats.value.activityByDay.map((d) => d.count), 1)
  })

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
    router.push({ name: 'dm', params: { userId: props.userId } })
  }

  async function blockUser() {
    if (!confirm('Block this user?')) return
    await friendsStore.block(props.userId)
    friendStatus.value = 'blocked'
  }
</script>

<template>
  <div
    class="overlay"
    role="dialog"
    aria-modal="true"
    aria-label="User profile"
    @click.self="emit('close')"
    @keydown.escape="emit('close')"
  >
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

      <div
        class="card"
        :class="user?.profileTheme ? `profile-theme-${user.profileTheme}` : 'profile-theme-default'"
        :style="user?.primaryColor ? { '--profile-bg': user.primaryColor } : {}"
      >
        <div class="banner" :class="bannerAnimClass" :style="bannerStyle" />

        <div class="shell">
          <div class="avatar-row">
            <AnimatedProfile
              :user="user"
              :size="92"
              :show-animation="true"
              class="profile-avatar"
            >
              <span class="sr-only">{{ user?.displayName }}</span>
            </AnimatedProfile>
            <div v-if="user?.badges?.length" class="badge-row">
              <ProfileBadge v-for="badge in user.badges" :key="badge" :badge="badge" />
            </div>
          </div>

          <div v-if="loading" class="state">
            <span class="spinner" aria-hidden="true" />
            Loading profile...
          </div>
          <div v-else-if="error" class="state error">{{ error }}</div>

          <template v-else-if="user">
            <div class="name-block">
              <h3
                id="profile-name"
                :class="user.displayNameStyle ? `name-style-${user.displayNameStyle}` : ''"
              >
                {{ user.displayName }}
              </h3>
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
              <span v-if="friendStatus === 'pending_outgoing'" class="action-hint"
              >Friend request sent</span
              >
              <button v-if="friendStatus === 'friends'" class="action-btn" @click="openMessage">
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

            <div v-if="user.website || user.location || user.timezone" class="links">
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
              <span v-if="user.timezone">
                <Globe :size="14" />
                {{ user.timezone }}
              </span>
            </div>

            <div v-if="user.socialLinks?.length" class="social-links">
              <a
                v-for="sl in user.socialLinks"
                :key="sl.platform + sl.url"
                :href="sl.url"
                target="_blank"
                rel="noreferrer"
                class="social-chip"
              >
                <Globe :size="12" />
                {{ sl.label || sl.platform }}
              </a>
            </div>

            <div v-if="user.lastSeenAt && user.status === 'offline'" class="last-seen">
              <Clock :size="12" />
              Last seen {{ formatLastSeen(user.lastSeenAt) }}
            </div>

            <!-- Profile Stats -->
            <div v-if="stats" class="stats-section">
              <div class="stats-row">
                <div class="stat-item">
                  <MessageSquare :size="14" class="stat-icon" />
                  <div>
                    <div class="stat-value">{{ stats.messageCount.toLocaleString() }}</div>
                    <div class="stat-label">Messages</div>
                  </div>
                </div>
                <div class="stat-item">
                  <Users :size="14" class="stat-icon" />
                  <div>
                    <div class="stat-value">{{ stats.friendCount }}</div>
                    <div class="stat-label">Friends</div>
                  </div>
                </div>
                <div v-if="user.profileViews !== null" class="stat-item">
                  <Eye :size="14" class="stat-icon" />
                  <div>
                    <div class="stat-value">{{ user.profileViews }}</div>
                    <div class="stat-label">Profile views</div>
                  </div>
                </div>
              </div>

              <div v-if="stats.topReactions.length" class="reactions-row">
                <span
                  v-for="r in stats.topReactions"
                  :key="r.emoji"
                  class="reaction-chip"
                  :title="`Used ${r.count} times`"
                >
                  {{ r.emoji }} <span class="reaction-count">{{ r.count }}</span>
                </span>
              </div>

              <div v-if="stats.activityByDay.some((d) => d.count > 0)" class="activity-chart">
                <div class="chart-label">
                  <BarChart2 :size="11" />
                  Activity (7 days)
                </div>
                <div class="chart-bars">
                  <div
                    v-for="day in stats.activityByDay"
                    :key="day.date"
                    class="chart-bar-wrap"
                    :title="`${day.date}: ${day.count} messages`"
                  >
                    <div
                      class="chart-bar"
                      :style="{
                        height: `${Math.max(2, Math.round((day.count / maxActivity) * 32))}px`,
                      }"
                    />
                    <div class="chart-day">{{ day.date.slice(5) }}</div>
                  </div>
                </div>
              </div>
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
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 14px;
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
  background: var(--profile-bg, #111318);
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
  justify-content: space-between;
}
.avatar-row :deep(.profile-avatar) {
  margin-top: -52px;
}

.avatar-row :deep(.profile-avatar .avatar-wrapper) {
  border: 6px solid var(--profile-bg, #111318);
  border-radius: 50%;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
.badge-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
  padding-bottom: 8px;
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

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.social-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 12px;
  text-decoration: none;
  transition:
    border-color 0.15s,
    color 0.15s;
}
.social-chip:hover {
  color: #93c5fd;
  border-color: #93c5fd;
}

.last-seen {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 12px;
}

/* ── Stats ── */
.stats-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-row {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.stat-value {
  font-size: 15px;
  font-weight: 750;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.reactions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  cursor: default;
}

.reaction-count {
  font-size: 11px;
  color: var(--text-muted);
}

.activity-chart {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chart-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 40px;
}

.chart-bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
}

.chart-bar {
  width: 100%;
  min-height: 2px;
  background: rgba(139, 92, 246, 0.5);
  border-radius: 2px 2px 0 0;
  transition: background 0.2s;
}

.chart-bar-wrap:hover .chart-bar {
  background: rgba(139, 92, 246, 0.85);
}

.chart-day {
  font-size: 9px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ── Animated banners ── */
@keyframes banner-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
.banner-aurora {
  background: linear-gradient(270deg, #0f2027, #203a43, #667db6, #7f00ff, #2c5364);
  background-size: 300% 300%;
  animation: banner-shift 8s ease infinite;
}
.banner-neon {
  background: linear-gradient(270deg, #ff0099, #493240, #7928ca, #ff0080, #200122);
  background-size: 300% 300%;
  animation: banner-shift 6s ease infinite;
}
.banner-sunset {
  background: linear-gradient(270deg, #f093fb, #f5576c, #fda085, #ff6a00, #f093fb);
  background-size: 300% 300%;
  animation: banner-shift 7s ease infinite;
}
.banner-ocean {
  background: linear-gradient(270deg, #0099f7, #00d2ff, #1a1a2e, #16213e, #0f3460);
  background-size: 300% 300%;
  animation: banner-shift 9s ease infinite;
}
.banner-forest {
  background: linear-gradient(270deg, #11998e, #38ef7d, #1a4731, #134e5e, #11998e);
  background-size: 300% 300%;
  animation: banner-shift 8s ease infinite;
}
.banner-cosmic {
  background: linear-gradient(270deg, #09203f, #537895, #7b2ff7, #f107a3, #09203f);
  background-size: 300% 300%;
  animation: banner-shift 10s ease infinite;
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
