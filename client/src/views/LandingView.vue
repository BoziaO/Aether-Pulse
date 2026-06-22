<script setup lang="ts">
import { ref, markRaw, onMounted } from 'vue'
import {
  Download,
  Globe2,
  Headphones,
  Laptop,
  MessageCircle,
  MonitorUp,
  Palette,
  PictureInPicture2,
  Radio,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-vue-next'

interface DownloadItem {
  icon: any
  platform: string
  meta: string
  href: string
  label: string
  primary: boolean
  version?: string
  size?: string
}

interface FeatureItem {
  icon: any
  title: string
  desc: string
}

const downloads = ref<DownloadItem[]>([
  {
    icon: markRaw(MonitorUp),
    platform: 'Windows',
    meta: 'Windows 10+',
    href: 'https://github.com/BoziaO/Aether-Pulse/releases/latest/download/AetherPulse-setup.exe',
    label: 'Pobierz .exe',
    primary: true,
    version: 'Najnowsza',
    size: '~120MB',
  },
  {
    icon: markRaw(Smartphone),
    platform: 'Android',
    meta: 'APK dla telefonu',
    href: 'https://github.com/BoziaO/Aether-Pulse/releases/latest/download/AetherPulse.apk',
    label: 'Pobierz APK',
    primary: false,
    version: 'Najnowsza',
    size: '~45MB',
  },
  {
    icon: markRaw(Laptop),
    platform: 'Linux',
    meta: 'x64 desktop',
    href: 'https://github.com/BoziaO/Aether-Pulse/releases/latest/download/AetherPulse-linux-x64.zip',
    label: 'Pobierz ZIP',
    primary: false,
    version: 'Najnowsza',
    size: '~140MB',
  },
])

const features = ref<FeatureItem[]>([
  {
    icon: markRaw(Radio),
    title: 'Streamy i live rooms',
    desc: 'Rozmowy WebRTC z kamerą, ekranem na desktopie i trybem streamowania kamery na Androidzie.',
  },
  {
    icon: markRaw(PictureInPicture2),
    title: 'Obraz w obrazie',
    desc: 'Na Androidzie aplikacja przechodzi w PiP po wyjściu z aktywnego pokoju, a w przeglądarce działa mini player.',
  },
  {
    icon: markRaw(Headphones),
    title: 'Spatial audio',
    desc: 'Głos z pozycjonowaniem przestrzennym, redukcją szumu i kontrolą mikrofonu.',
  },
  {
    icon: markRaw(MessageCircle),
    title: 'Chat realtime',
    desc: 'Pokoje, wiadomości prywatne, reakcje i obecność użytkowników w czasie rzeczywistym.',
  },
  {
    icon: markRaw(Palette),
    title: 'Personalizacja',
    desc: 'Motywy, profile i efekty wizualne bez ciężkiego, marketingowego interfejsu.',
  },
  {
    icon: markRaw(ShieldCheck),
    title: 'Bezpieczne podstawy',
    desc: 'JWT, CORS, rate limiting i transakcyjne operacje po stronie API.',
  },
])

const isLoading = ref<boolean>(false)
const downloadProgress = ref<number>(0)
const downloadStatus = ref<string>('')
const selectedPlatform = ref<string>('')
const showBrowserOption = ref<boolean>(false)

// Browser compatibility check
const isElectron = ref<boolean>(false)
const isMobile = ref<boolean>(false)

onMounted(() => {
  // Check if running in Electron
  isElectron.value = typeof window !== 'undefined' && 'electron' in window.process.versions
  
  // Check if mobile device
  if (typeof window !== 'undefined') {
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
})

function handleDownload(platform: string, href: string) {
  selectedPlatform.value = platform
  isLoading.value = true
  downloadProgress.value = 0
  downloadStatus.value = `Pobieranie ${platform}...`
  
  // Simulate progress for better UX (real progress would require server support)
  const interval = setInterval(() => {
    downloadProgress.value += Math.random() * 15
    if (downloadProgress.value >= 90) {
      clearInterval(interval)
    }
  }, 300)
  
  // Start actual download
  const link = document.createElement('a')
  link.href = href
  link.download = true
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Reset after a delay
  setTimeout(() => {
    isLoading.value = false
    downloadProgress.value = 100
    downloadStatus.value = `Pobrano ${platform}!`
    setTimeout(() => {
      downloadProgress.value = 0
      downloadStatus.value = ''
    }, 2000)
  }, 3000)
}

function getDownloadButtonText(platform: string, isPrimary: boolean): string {
  if (isLoading.value && selectedPlatform.value === platform) {
    return 'Pobieranie...'
  }
  return platform === 'Windows' && isPrimary ? 'Pobierz dla Windows' : 
         platform === 'Android' ? 'Pobierz APK' : 
         'Pobierz dla Linux'
}

function getStatusColor(platform: string): string {
  if (downloadStatus.value.includes(platform) && downloadProgress.value === 100) {
    return '#22c55e' // success green
  }
  return ''
}
</script>

<template>
  <div class="landing">
    <!-- Navigation -->
    <nav class="nav">
      <a class="brand" href="/">
        <img src="/icons/logo.png" alt="AetherPulse" loading="lazy" />
        <span>AetherPulse</span>
      </a>
      <div class="nav-actions">
        <a href="/auth" class="btn ghost" prefetch>Zaloguj się</a>
        <a href="/auth" class="btn solid">Otwórz w przeglądarce</a>
      </div>
    </nav>

    <!-- Hero Section -->
    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">🎙️ Voice, chat i streamy dla Twojej załogi</p>
          <h1>AetherPulse</h1>
          <p class="hero-text">
            Prywatne pokoje głosowe, chat realtime, stream z kamery lub ekranu 
            i wygodny tryb Picture-in-Picture na telefonie. Wszystko w jednym miejscu.
          </p>
          
          <!-- Primary CTA with loading state -->
          <div class="hero-actions">
            <button 
              class="btn solid large download-btn"
              @click="handleDownload('Windows', downloads[0].href)"
              :disabled="isLoading && selectedPlatform === 'Windows'"
            >
              <Loader2 v-if="isLoading && selectedPlatform === 'Windows'" class="loader" :size="20" />
              <Download v-else :size="20" />
              {{ getDownloadButtonText('Windows', true) }}
            </button>
            
            <a href="/auth" class="btn outline large">
              <Globe2 :size="20" />
              Uruchom w przeglądarce
            </a>
          </div>
          
          <!-- Download progress bar -->
          <div v-if="isLoading && downloadProgress > 0" class="download-progress">
            <div 
              class="progress-bar"
              :style="{ width: `${downloadProgress}%` }"
              :class="{ complete: downloadProgress === 100 }"
            ></div>
            <span class="progress-text">{{ downloadStatus }}</span>
          </div>
          
          <div class="hero-pills">
            <span>✅ Android PiP</span>
            <span>✅ Linux build</span>
            <span>✅ WebRTC live</span>
            <span>✅ Spatial Audio</span>
          </div>
        </div>

        <!-- Product Preview Panel -->
        <div class="product-panel" aria-label="AetherPulse preview">
          <div class="panel-top">
            <div>
              <span class="panel-label">🔴 Live room</span>
              <strong># night-session</strong>
            </div>
            <span class="live-dot">🎵 LIVE</span>
          </div>
          <div class="stream-preview">
            <div class="stream-main">
              <Radio :size="34" />
              <span>Camera stream</span>
            </div>
            <div class="pip-card">
              <PictureInPicture2 :size="18" />
              <span>PiP active</span>
            </div>
          </div>
          <div class="room-row">
            <span class="avatar a" />
            <span class="avatar b" />
            <span class="avatar c" />
            <p>8 online · 3 streaming</p>
          </div>
        </div>
      </section>

      <!-- Downloads Section with better UX -->
      <section class="downloads" id="download">
        <div class="section-head">
          <p class="eyebrow">📥 Pobierz aplikację</p>
          <h2>Dostępna na wszystkie platformy</h2>
          <p class="section-desc">
            Wybierz swoją platformę i ciesz się pełną funkcjonalnością AetherPulse
          </p>
        </div>
        
        <div class="download-grid">
          <div 
            v-for="item in downloads"
            :key="item.platform"
            class="download-card"
            :class="{ primary: item.primary, loading: isLoading && selectedPlatform === item.platform }"
            @click="!isLoading ? handleDownload(item.platform, item.href) : null"
          >
            <div class="download-icon">
              <component :is="item.icon" :size="32" />
            </div>
            <div class="download-info">
              <strong>{{ item.platform }}</strong>
              <small>{{ item.meta }}</small>
              <div class="download-meta">
                <span class="version">{{ item.version }}</span>
                <span class="size">{{ item.size }}</span>
              </div>
            </div>
            <div class="download-action">
              <span v-if="isLoading && selectedPlatform === item.platform" class="downloading">
                <Loader2 class="loader-small" :size="18" />
                {{ downloadProgress }}%
              </span>
              <em v-else>{{ item.label }}</em>
            </div>
            
            <!-- Status indicator -->
            <div 
              v-if="downloadProgress === 100 && selectedPlatform === item.platform"
              class="download-status success"
            >
              <CheckCircle :size="20" />
            </div>
          </div>
        </div>
        
        <!-- Browser option for users who can't download -->
        <div class="browser-option">
          <p>⚡ <strong>Nie chcesz pobierać?</strong> Uruchom aplikację bezpośrednio w przeglądarce!</p>
          <a href="/auth" class="btn outline">
            <Globe2 :size="18" />
            Otwórz AetherPulse w przeglądarce
          </a>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="section-head">
          <p class="eyebrow">✨ Funkcjonalności</p>
          <h2>Komunikacja, która działa też na telefonie</h2>
        </div>
        <div class="features-grid">
          <article 
            v-for="(feature, index) in features" 
            :key="feature.title" 
            class="feature-card"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <div class="feature-icon">
              <component :is="feature.icon" :size="28" />
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.desc }}</p>
          </article>
        </div>
      </section>

      <!-- Browser Compatibility Notice -->
      <section v-if="!isElectron && isMobile" class="browser-notice">
        <div class="notice-card">
          <AlertTriangle :size="24" />
          <div class="notice-content">
            <h3>Używasz telefonu?</h3>
            <p>Dla najlepszego doświadczenia pobierz naszą aplikację mobilną lub użyj trybu PWA (Progressive Web App).</p>
          </div>
          <a href="/auth" class="btn solid">
            Kontynuuj w przeglądarce
          </a>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <a class="brand" href="/">
        <img src="/icons/logo.png" alt="AetherPulse" loading="lazy" />
        <span>AetherPulse</span>
      </a>
      <div class="footer-links">
        <a href="https://github.com/BoziaO/Aether-Pulse" target="_blank" rel="noopener noreferrer">📱 GitHub</a>
        <a href="/auth">Zaloguj się</a>
        <a href="/auth">Zarejestruj się</a>
      </div>
      <div class="footer-copyright">
        <p>© {{ new Date().getFullYear() }} AetherPulse. Wszelkie prawa zastrzeżone.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Animations for Core Web Vitals */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes progress {
  from {
    width: 0%;
  }
}

.landing {
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  background:
    radial-gradient(ellipse at top left, rgba(139, 92, 246, 0.15), transparent 40%),
    radial-gradient(ellipse at bottom right, rgba(6, 182, 212, 0.12), transparent 40%),
    #070a13;
  color: #e2e8f0;
  scroll-behavior: smooth;
}

.nav,
.footer {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.nav {
  min-height: 72px;
  position: sticky;
  top: 0;
  background: rgba(7, 10, 19, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 8px;
  padding-bottom: 8px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #f8fafc;
  font-size: 18px;
  font-weight: 800;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.brand:hover {
  transform: scale(1.02);
}

.brand img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.3));
}

.nav-actions,
.hero-actions,
.footer-links {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
  cursor: pointer;
  will-change: transform, background;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.btn.solid {
  background: linear-gradient(135deg, #8b5cf6, #2563eb);
  box-shadow: 0 14px 34px rgba(37, 99, 235, 0.22);
}

.btn.solid:hover:not(:disabled) {
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.3);
}

.btn.outline,
.btn.ghost {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn.ghost {
  color: #cbd5e1;
}

.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.btn.large {
  min-height: 52px;
  padding: 14px 20px;
  font-size: 15px;
}

main {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.hero {
  min-height: calc(100svh - 80px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 480px);
  align-items: center;
  gap: 48px;
  padding: 48px 0 72px;
  animation: fadeInUp 0.6s ease-out;
}

.hero-copy {
  max-width: 720px;
}

.eyebrow {
  margin: 0 0 14px;
  color: #67e8f9;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  font-size: clamp(48px, 9vw, 104px);
  line-height: 0.95;
  letter-spacing: 0;
  background: linear-gradient(135deg, #f8fafc, #a78bfa, #67e8f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.hero-text {
  max-width: 620px;
  margin-top: 24px;
  color: #b6c2d4;
  font-size: clamp(17px, 2vw, 22px);
  line-height: 1.55;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.hero-actions {
  margin-top: 34px;
  flex-wrap: wrap;
  gap: 16px;
  animation: fadeInUp 0.6s ease-out 0.3s both;
}

.download-btn {
  position: relative;
}

.loader {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loader-small {
  animation: spin 0.8s linear infinite;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.hero-pills span {
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
}

.product-panel,
.download-card,
.feature-card,
.notice-card {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(13, 16, 23, 0.72);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  will-change: transform, box-shadow;
  transition: 
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.product-panel {
  border-radius: 8px;
  padding: 16px;
}

.product-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.4);
}

.panel-top,
.room-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-label {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.live-dot {
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.14);
  color: #fca5a5;
  font-size: 11px;
  font-weight: 900;
}

.stream-preview {
  position: relative;
  aspect-ratio: 4 / 3;
  margin: 16px 0;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.34), transparent),
    linear-gradient(45deg, rgba(6, 182, 212, 0.28), transparent), #0d1017;
}

.stream-main {
  height: 100%;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: #dbeafe;
  font-weight: 800;
}

.pip-card {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 8px;
  background: rgba(3, 7, 18, 0.72);
  color: #e0f2fe;
  font-size: 13px;
  font-weight: 800;
}

.room-row {
  justify-content: flex-start;
  color: #94a3b8;
  font-size: 13px;
}

.avatar {
  width: 30px;
  height: 30px;
  margin-right: -12px;
  border: 2px solid #0d1017;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.avatar.a {
  background: #8b5cf6;
}

.avatar.b {
  background: #06b6d4;
}

.avatar.c {
  background: #22c55e;
}

.downloads,
.features {
  padding: 64px 0;
}

.section-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 32px;
  animation: fadeInUp 0.6s ease-out both;
}

.section-head h2 {
  max-width: 680px;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.08;
  letter-spacing: 0;
}

.section-desc {
  color: #94a3b8;
  font-size: 15px;
  line-height: 1.6;
  max-width: 560px;
}

.download-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.download-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  gap: 12px;
  min-height: 120px;
  padding: 20px;
  border-radius: 12px;
  color: #e2e8f0;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
  position: relative;
  overflow: hidden;
}

.download-card:hover:not(.loading) {
  transform: translateY(-4px);
  border-color: rgba(103, 232, 249, 0.42);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.15);
}

.download-card.primary {
  background: rgba(37, 99, 235, 0.18);
  border-color: rgba(37, 99, 235, 0.3);
}

.download-card.loading {
  cursor: wait;
}

.download-icon {
  grid-row: span 2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #67e8f9;
}

.download-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.download-info strong {
  font-size: 18px;
  font-weight: 700;
}

.download-info small {
  color: #94a3b8;
  font-size: 13px;
}

.download-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.download-meta .version,
.download-meta .size {
  font-size: 11px;
  color: #64748b;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
}

.download-action {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.download-action em {
  color: #67e8f9;
  font-size: 13px;
  font-style: normal;
  font-weight: 800;
  padding: 6px 10px;
  background: rgba(103, 232, 249, 0.1);
  border-radius: 6px;
  transition: background 0.18s ease;
}

.download-action em:hover {
  background: rgba(103, 232, 249, 0.2);
}

.downloading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #67e8f9 !important;
  font-size: 13px !important;
  font-weight: 800 !important;
  padding: 6px 10px;
  background: rgba(103, 232, 249, 0.15);
  border-radius: 6px;
}

.download-status {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #22c55e;
  animation: fadeInUp 0.3s ease-out;
}

.download-status.success {
  color: #22c55e;
}

.features-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.feature-card {
  min-height: 164px;
  padding: 24px;
  border-radius: 12px;
  cursor: default;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
}

.feature-icon {
  color: #67e8f9;
  margin-bottom: 16px;
}

.feature-icon svg {
  color: #67e8f9;
}

.feature-card h3 {
  margin-top: 0;
  color: #f8fafc;
  font-size: 18px;
}

.feature-card p {
  margin-top: 10px;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.55;
}

/* Download Progress */
.download-progress {
  margin-top: 20px;
  width: 100%;
  max-width: 300px;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #2563eb, #67e8f9);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-bar.complete {
  animation: pulse 1.5s ease-in-out infinite;
}

.progress-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #67e8f9;
  font-weight: 600;
}

/* Browser Option */
.browser-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  animation: fadeInUp 0.6s ease-out 0.5s both;
}

.browser-option p {
  color: #94a3b8;
  font-size: 14px;
}

.browser-option p strong {
  color: #f8fafc;
}

/* Browser Notice */
.browser-notice {
  padding: 32px 0;
  animation: fadeInUp 0.6s ease-out 0.6s both;
}

.notice-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 182, 0, 0.05), rgba(255, 182, 0, 0.02));
  border-color: rgba(255, 182, 0, 0.2);
}

.notice-card svg {
  color: #ff9900;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-content h3 {
  color: #fbbf24;
  font-size: 16px;
  margin-bottom: 4px;
}

.notice-content p {
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.5;
}

.footer {
  padding: 40px 0;
  color: #64748b;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 40px;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-links a {
  color: #94a3b8;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.18s ease;
}

.footer-links a:hover {
  color: #f8fafc;
}

.footer-copyright {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-copyright p {
  font-size: 13px;
  color: #64748b;
}

@media (max-width: 1024px) {
  .download-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .hero {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 28px;
    padding-top: 38px;
  }

  .product-panel {
    max-width: 560px;
    margin: 0 auto;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .download-grid {
    grid-template-columns: 1fr;
  }
  
  .nav-actions {
    gap: 8px;
  }
  
  .btn.large {
    padding: 12px 16px;
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .nav,
  .footer,
  main {
    width: min(100% - 20px, 1180px);
  }

  .nav {
    min-height: 64px;
  }

  .nav-actions .ghost {
    display: none;
  }

  .hero {
    padding: 28px 0 42px;
  }

  .hero-actions {
    width: 100%;
  }

  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .hero-pills span {
    flex: 1 1 auto;
    text-align: center;
    font-size: 12px;
    padding: 6px 8px;
  }

  .section-head {
    align-items: flex-start;
  }

  .downloads,
  .features {
    padding: 34px 0;
  }

  .download-card {
    grid-template-columns: auto 1fr;
    min-height: auto;
    padding: 16px;
  }
  
  .download-icon {
    grid-row: auto;
  }
  
  .download-action {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }

  .download-meta {
    display: none;
  }

  .browser-option {
    flex-direction: column;
    text-align: center;
  }

  .footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .footer-links {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .footer-copyright {
    margin-top: 0;
    padding-top: 16px;
    border-top: none;
  }
  
  .browser-notice {
    padding: 20px 0;
  }
  
  .notice-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}
</style>
