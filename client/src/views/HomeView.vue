<script setup lang="ts">
  import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
  import { useRouter } from 'vue-router'
  import { Hash, Plus, UserPlus, Sparkles, Mic, MonitorUp, Headphones, MessageCircle, ArrowRight } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'
  import { useRoomStore } from '@/stores/room.store'
  import RoomCardSkeleton from '@/components/rooms/RoomCardSkeleton.vue'

  const router = useRouter()

  const RoomCard = defineAsyncComponent(() => import('@/components/rooms/RoomCard.vue'))
  const CreateRoomModal = defineAsyncComponent(() => import('@/components/rooms/CreateRoomModal.vue'))

  const auth = useAuthStore()
  const roomStore = useRoomStore()
  const showCreate = ref(false)
  const mouse = ref({ x: 0, y: 0 })

  let mouseFn: ((e: MouseEvent) => void) | null = null

  onMounted(() => {
    mouseFn = (e: MouseEvent) => {
      mouse.value = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', mouseFn, { passive: true })
  })

  onUnmounted(() => {
    if (mouseFn) window.removeEventListener('mousemove', mouseFn)
  })

  const features = [
    { icon: Mic, label: 'Głos & Wideo', color: '#d946ef' },
    { icon: MonitorUp, label: 'Udostępnianie ekranu', color: '#8b5cf6' },
    { icon: Headphones, label: 'Dźwięk przestrzenny', color: '#3b82f6' },
    { icon: MessageCircle, label: 'Czat na żywo', color: '#06b6d4' },
  ]
</script>

<template>
  <div class="home-view">
    <div class="home-bg-orbs" aria-hidden="true">
      <div class="home-orb home-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="home-orb home-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="home-orb home-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="home-orb home-orb--teal"></div>
    </div>

    <div class="home-content">
      <div class="home-header">
        <div class="home-greeting">
          <div class="badge badge-violet home-badge">
            <Sparkles :size="12" />
            Panel główny
          </div>
          <h1 class="home-title">
            Witaj ponownie,<br />
            <span class="gradient-text">{{ auth.user?.displayName }}</span>
          </h1>
          <p class="home-desc">Twoja prywatna przestrzeń do rozmów jest gotowa.</p>
        </div>
        <div class="home-actions">
          <button class="btn btn-ghost" @click="router.push('/join')">
            <UserPlus :size="16" />
            Dołącz do pokoju
          </button>
          <button class="btn btn-primary" @click="showCreate = true">
            <Plus :size="16" />
            Nowy pokój
          </button>
        </div>
      </div>

      <div class="home-section">
        <div class="home-section-header">
          <div class="home-section-title-group">
            <h2 class="home-section-title">Twoje pokoje</h2>
            <span class="home-section-count">{{ roomStore.rooms.length }}</span>
          </div>
        </div>

        <div v-if="roomStore.loading" class="home-rooms-grid">
          <RoomCardSkeleton v-for="i in 3" :key="i" />
        </div>

        <div v-else-if="roomStore.rooms.length === 0" class="home-empty card glass">
          <div class="home-empty-icon">
            <Hash :size="40" />
          </div>
          <h3>Brak pokojów</h3>
          <p>Utwórz swój pierwszy pokój, aby zacząć rozmawiać i dzwonić</p>
          <button class="btn btn-primary" @click="showCreate = true">
            <Plus :size="16" />
            Utwórz pokój
          </button>
        </div>

        <div v-else class="home-rooms-grid">
          <RoomCard v-for="room in roomStore.rooms" :key="room.id" :room="room" />
        </div>
      </div>

      <div class="home-features">
        <div
          v-for="f in features"
          :key="f.label"
          class="home-feature"
        >
          <div class="home-feature-icon" :style="{ background: f.color }">
            <component :is="f.icon" :size="16" color="white" />
          </div>
          <span class="home-feature-label">{{ f.label }}</span>
        </div>
      </div>

      <div class="home-cta card glass">
        <div class="home-cta-content">
          <h3>Potrzebujesz pomocy?</h3>
          <p>Sprawdź dokumentację lub dołącz do naszej społeczności na GitHubie.</p>
        </div>
        <a href="https://github.com/BoziaO/Nicori" target="_blank" class="btn btn-ghost btn-sm">
          GitHub
          <ArrowRight :size="14" />
        </a>
      </div>
    </div>

    <CreateRoomModal v-if="showCreate" @close="showCreate = false" />
  </div>
</template>

<style scoped>
.home-view {
  flex: 1;
  overflow-y: auto;
  position: relative;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* BG ORBS (same as landing/login) */
.home-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.home-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.home-orb--violet {
  width: 500px;
  height: 500px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.08);
}

.home-orb--pink {
  width: 400px;
  height: 400px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.06);
}

.home-orb--blue {
  width: 350px;
  height: 350px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.05);
}

.home-orb--teal {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.04);
  animation: homeOrbDrift 20s ease-in-out infinite;
}

@keyframes homeOrbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

/* CONTENT */
.home-content {
  position: relative;
  z-index: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* HEADER */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
}

.home-greeting {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
}

.home-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.home-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.home-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* SECTION */
.home-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.home-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home-section-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.home-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.home-section-count {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-violet);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
}

/* ROOMS GRID */
.home-rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

/* EMPTY STATE */
.home-empty {
  text-align: center;
  padding: 56px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.home-empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(139, 92, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-violet);
  margin-bottom: 8px;
}

.home-empty h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.home-empty p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* FEATURES BAR */
.home-features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.home-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.2s;
}

.home-feature:hover {
  border-color: var(--border-accent);
  transform: translateY(-2px);
}

.home-feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home-feature-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

/* CTA */
.home-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.home-cta-content h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.home-cta-content p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .home-content {
    padding: 24px 16px;
  }

  .home-header {
    flex-direction: column;
  }

  .home-actions {
    width: 100%;
  }

  .home-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .home-features {
    grid-template-columns: repeat(2, 1fr);
  }

  .home-cta {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .home-title {
    font-size: 24px;
  }

  .home-features {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-orb {
    animation: none !important;
  }
}
</style>
