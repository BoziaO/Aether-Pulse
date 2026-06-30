<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { Search, UserPlus, X, Check, Clock, Sparkles, MessageCircle } from 'lucide-vue-next'
  import { useRouter } from 'vue-router'

  import { useFriendsStore } from '@/stores/friends.store'
  import { friendsApi } from '@/services/api/friends.api'
  import AnimatedProfile from '@/components/profile/AnimatedProfile.vue'
  import AnimatedCard from '@/components/ui/AnimatedCard.vue'
  import type { UserSearchResult } from '@/types/friend.types'

  const friendsStore = useFriendsStore()
  const router = useRouter()
  const searchQuery = ref('')
  const searchResults = ref<UserSearchResult[]>([])
  const searching = ref(false)
  const suggestions = ref<UserSearchResult[]>([])
  const loadingSuggestions = ref(false)
  const mouse = ref({ x: 0, y: 0 })
  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  let mouseFn: ((e: MouseEvent) => void) | null = null

  onMounted(() => {
    mouseFn = (e: MouseEvent) => {
      mouse.value = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', mouseFn, { passive: true })
    fetchSuggestions()
  })

  onUnmounted(() => {
    if (mouseFn) window.removeEventListener('mousemove', mouseFn)
  })

  async function fetchSuggestions() {
    loadingSuggestions.value = true
    try {
      suggestions.value = await friendsApi.suggestions()
    } catch {
      suggestions.value = []
    } finally {
      loadingSuggestions.value = false
    }
  }

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

  async function sendRequest(userId: string) {
    await friendsStore.sendRequest(userId)
    await handleSearch()
    suggestions.value = suggestions.value.filter((s) => s.user.id !== userId)
  }

  async function accept(userId: string) {
    await friendsStore.accept(userId)
  }

  async function reject(userId: string) {
    await friendsStore.reject(userId)
  }

  function openDm(userId: string) {
    router.push({ name: 'dm', params: { userId } })
  }
</script>

<template>
  <div class="friends-view">
    <div class="friends-bg-orbs" aria-hidden="true">
      <div class="friends-orb friends-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="friends-orb friends-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="friends-orb friends-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="friends-orb friends-orb--teal"></div>
    </div>

    <div class="friends-content">
      <div class="friends-header">
        <div class="badge badge-violet friends-badge">
          <Sparkles :size="12" />
          Znajomi
        </div>
        <h1 class="friends-title">
          Połącz się z<br />
          <span class="gradient-text">innymi ludźmi</span>
        </h1>
        <p class="friends-desc">Szukaj użytkowników i zaczynaj rozmawiać</p>
      </div>

      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          placeholder="Szukaj po nazwie użytkownika..."
          @input="handleSearch"
        />
      </div>

      <div v-if="searchQuery.trim().length >= 2" class="friends-section">
        <h2 class="friends-section-title">Wyniki wyszukiwania</h2>
        <div v-if="searching" class="friends-empty">Szukanie...</div>
        <div v-else-if="searchResults.length === 0" class="friends-empty">Nie znaleziono użytkowników.</div>
        <div v-for="result in searchResults" :key="result.user.id" class="user-row">
          <AnimatedCard variant="glass" :hoverable="true" class="user-row-card">
            <div class="user-row-inner">
              <AnimatedProfile :user="result.user" :size="44" :show-animation="false" />
              <div class="user-info">
                <strong>{{ result.user.displayName }}</strong>
                <span>@{{ result.user.username }}</span>
              </div>
              <button
                v-if="result.status === 'none'"
                class="btn btn-primary btn-sm"
                @click="sendRequest(result.user.id)"
              >
                <UserPlus :size="14" />
                Dodaj
              </button>
              <span v-else-if="result.status === 'friends'" class="badge badge-success">
                <Check :size="12" />
                Znajomi
              </span>
              <span v-else-if="result.status === 'pending_outgoing'" class="badge badge-warning">
                <Clock :size="12" />
                Oczekuje
              </span>
              <button
                v-else-if="result.status === 'pending_incoming'"
                class="btn btn-primary btn-sm"
                @click="accept(result.user.id)"
              >
                <Check :size="14" />
                Akceptuj
              </button>
            </div>
          </AnimatedCard>
        </div>
      </div>

      <div v-if="!searchQuery.trim() && suggestions.length" class="friends-section">
        <div class="friends-section-header">
          <h2 class="friends-section-title">Sugestie ({{ suggestions.length }})</h2>
          <button class="btn btn-ghost btn-sm" @click="fetchSuggestions">Odśwież</button>
        </div>
        <div v-if="loadingSuggestions" class="friends-empty">Ładowanie sugestii...</div>
        <div v-for="result in suggestions" :key="result.user.id" class="user-row">
          <AnimatedCard variant="glass" :hoverable="true" class="user-row-card">
            <div class="user-row-inner">
              <AnimatedProfile :user="result.user" :size="44" :show-animation="false" />
              <div class="user-info">
                <strong>{{ result.user.displayName }}</strong>
                <span>@{{ result.user.username }}</span>
              </div>
              <button class="btn btn-primary btn-sm" @click="sendRequest(result.user.id)">
                <UserPlus :size="14" />
                Dodaj
              </button>
            </div>
          </AnimatedCard>
        </div>
      </div>

      <div v-if="friendsStore.outgoing.length" class="friends-section">
        <h2 class="friends-section-title">Wysłane zaproszenia ({{ friendsStore.outgoing.length }})</h2>
        <div v-for="req in friendsStore.outgoing" :key="req.requestId" class="user-row">
          <AnimatedCard variant="glass" :hoverable="true" class="user-row-card">
            <div class="user-row-inner">
              <AnimatedProfile :user="req.user" :size="44" :show-animation="false" />
              <div class="user-info">
                <strong>{{ req.user.displayName }}</strong>
                <span>@{{ req.user.username }}</span>
              </div>
              <span class="badge badge-warning">
                <Clock :size="12" />
                Oczekuje
              </span>
              <button class="btn btn-ghost btn-sm friends-danger" @click="friendsStore.remove(req.user.id)">
                Anuluj
              </button>
            </div>
          </AnimatedCard>
        </div>
      </div>

      <div v-if="friendsStore.incoming.length" class="friends-section">
        <h2 class="friends-section-title">Otrzymane zaproszenia ({{ friendsStore.incoming.length }})</h2>
        <div v-for="req in friendsStore.incoming" :key="req.requestId" class="user-row">
          <AnimatedCard variant="glass" :hoverable="true" class="user-row-card">
            <div class="user-row-inner">
              <AnimatedProfile :user="req.user" :size="44" :show-animation="false" />
              <div class="user-info">
                <strong>{{ req.user.displayName }}</strong>
                <span>@{{ req.user.username }}</span>
              </div>
              <button class="btn btn-primary btn-sm" @click="accept(req.user.id)">
                <Check :size="14" />
                Akceptuj
              </button>
              <button class="btn btn-ghost btn-sm" @click="reject(req.user.id)">
                <X :size="14" />
              </button>
            </div>
          </AnimatedCard>
        </div>
      </div>

      <div class="friends-section">
        <h2 class="friends-section-title">Wszyscy znajomi ({{ friendsStore.friends.length }})</h2>
        <div v-if="friendsStore.friends.length === 0" class="friends-empty-state card glass">
          <div class="friends-empty-icon">
            <UserPlus :size="32" />
          </div>
          <h3>Brak znajomych</h3>
          <p>Szukaj użytkowników powyżej, aby dodać kogoś do znajomych!</p>
        </div>
        <div v-for="entry in friendsStore.friends" :key="entry.user.id" class="user-row">
          <AnimatedCard variant="glass" :hoverable="true" class="user-row-card">
            <div class="user-row-inner">
              <AnimatedProfile :user="entry.user" :size="44" :show-animation="false" />
              <div class="user-info">
                <strong>{{ entry.user.displayName }}</strong>
                <span>@{{ entry.user.username }}</span>
              </div>
              <button class="btn btn-ghost btn-sm" @click="openDm(entry.user.id)">
                <MessageCircle :size="14" />
                Wiadomość
              </button>
              <button class="btn btn-ghost btn-sm friends-danger" @click="friendsStore.remove(entry.user.id)">
                Usuń
              </button>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friends-view {
  flex: 1;
  overflow-y: auto;
  position: relative;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* BG ORBS */
.friends-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.friends-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.friends-orb--violet {
  width: 500px;
  height: 500px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.06);
}

.friends-orb--pink {
  width: 400px;
  height: 400px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.04);
}

.friends-orb--blue {
  width: 350px;
  height: 350px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.04);
}

.friends-orb--teal {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.03);
  animation: friendsOrbDrift 20s ease-in-out infinite;
}

@keyframes friendsOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

/* CONTENT */
.friends-content {
  position: relative;
  z-index: 1;
  padding: 32px;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* HEADER */
.friends-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friends-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
}

.friends-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0;
}

.gradient-text {
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.friends-desc {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

/* SEARCH */
.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
}

.search-box input::placeholder {
  color: var(--text-muted);
}

/* SECTIONS */
.friends-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.friends-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.friends-section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin: 0;
}

/* USER ROW */
.user-row {
  position: relative;
}

.user-row-card {
  width: 100%;
}

.user-row-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
}

.user-row:hover {
  transform: translateY(-1px);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info strong {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info span {
  color: var(--text-muted);
  font-size: 12px;
}

.badge-success {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(34, 197, 94, 0.12);
  color: var(--success);
}

.badge-warning {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(245, 158, 11, 0.12);
  color: var(--warning);
}

.friends-danger {
  color: var(--danger) !important;
}

.friends-empty {
  color: var(--text-muted);
  font-size: 14px;
  padding: 16px 0;
}

.friends-empty-state {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.friends-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(139, 92, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-violet);
}

.friends-empty-state h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.friends-empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .friends-content {
    padding: 24px 16px;
  }

  .friends-title {
    font-size: 24px;
  }

  .user-row {
    padding: 12px;
    gap: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .friends-orb {
    animation: none !important;
  }
}
</style>
