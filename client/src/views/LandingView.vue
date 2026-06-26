<script setup lang="ts">
import { ref, markRaw, onMounted, onUnmounted, computed, type Component } from 'vue'
import {
  Download,
  Globe2,
  Laptop,
  MessageCircle,
  MonitorUp,
  PictureInPicture2,
  Smartphone,
  Users,
  Mic,
  Video,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Code2,
  Menu,
  X,
  Sparkles,
  Waves,
} from 'lucide-vue-next'

interface DownloadItem {
  icon: Component
  platform: string
  meta: string
  href: string
  label: string
  primary: boolean
  version?: string
  size?: string
  badge?: string
}

interface FeatureItem {
  icon: Component
  title: string
  desc: string
  category?: string
}

const downloads = ref<DownloadItem[]>([
  {
    icon: markRaw(MonitorUp),
    platform: 'Windows',
    meta: 'Windows 10+',
    href: 'https://github.com/BoziaO/Aether-Pulse/releases/download/v1.0/AetherPulse-setup-Windows-v1.0.exe',
    label: 'Pobierz',
    primary: true,
    version: 'Najnowsza',
    size: '120MB',
    badge: 'POPULARNY',
  },
  {
    icon: markRaw(Smartphone),
    platform: 'Android',
    meta: 'APK',
    href: '',
    label: 'Wkrótce',
    primary: false,
    version: 'Najnowsza',
    size: '45MB',
    badge: 'MOBILNY',
  },
  {
    icon: markRaw(Laptop),
    platform: 'Linux',
    meta: 'x64',
    href: 'https://github.com/BoziaO/Aether-Pulse/releases/download/v1.0/AetherPulse-setup-Linux-v1.0.zip',
    label: 'Pobierz',
    primary: false,
    version: 'Najnowsza',
    size: '140MB',
    badge: 'DEVELOPER',
  },
])

const features = ref<FeatureItem[]>([
  {
    icon: markRaw(Mic),
    title: 'Krystalicznie czysty dźwięk',
    desc: 'Dźwięk przestrzenny z redukcją szumów i ech, by każda rozmowa brzmiała profesjonalnie.',
    category: 'audio',
  },
  {
    icon: markRaw(Video),
    title: 'Streaming w HD',
    desc: 'Udostępniaj swój ekran lub kamerę w jakości do 1080p z niską latencją.',
    category: 'video',
  },
  {
    icon: markRaw(MessageCircle),
    title: 'Chat w czasie rzeczywistym',
    desc: 'Szybkie wiadomości, reakcje i prywatne pokoje dla Twojej załogi.',
    category: 'chat',
  },
  {
    icon: markRaw(Users),
    title: 'Pokoje głosowe',
    desc: 'Tworzenie prywatnych i publicznych pokoi z kontrolą dostępu.',
    category: 'social',
  },
  {
    icon: markRaw(PictureInPicture2),
    title: 'Picture-in-Picture',
    desc: 'Oglądaj streamy w mini playerze, nawet gdy przełączysz aplikację.',
    category: 'mobile',
  },
  {
    icon: markRaw(Shield),
    title: 'Bezpieczeństwo',
    desc: 'E2E szyfrowanie, JWT autentykacja i ochrona przed nadużyciami.',
    category: 'security',
  },
])

const selectedPlatform = ref<string>('')
const currentFeatureTab = ref<
  'all' | 'audio' | 'video' | 'chat' | 'social' | 'mobile' | 'security'
>('all')
const isScrolled = ref<boolean>(false)
const mobileMenuOpen = ref<boolean>(false)
const visibleSections = ref<Set<string>>(new Set())

const isElectron = ref<boolean>(false)
const isMobile = ref<boolean>(false)

const filteredFeatures = computed(() => {
  if (currentFeatureTab.value === 'all') return features.value
  return features.value.filter((f) => f.category === currentFeatureTab.value)
})

const featureCategories = ref<
  Array<{
    id: 'all' | 'chat' | 'audio' | 'video' | 'social' | 'mobile' | 'security'
    label: string
    icon: Component
  }>
>([
  { id: 'all', label: 'Wszystkie', icon: markRaw(Star) },
  { id: 'audio', label: 'Dźwięk', icon: markRaw(Mic) },
  { id: 'video', label: 'Wideo', icon: markRaw(Video) },
  { id: 'chat', label: 'Chat', icon: markRaw(MessageCircle) },
  { id: 'social', label: 'Społeczność', icon: markRaw(Users) },
  { id: 'mobile', label: 'Mobilne', icon: markRaw(Smartphone) },
  { id: 'security', label: 'Bezpieczeństwo', icon: markRaw(Shield) },
])

let observer: IntersectionObserver | null = null

onMounted(() => {
  isElectron.value = typeof window !== 'undefined' && !!(window as any).process?.versions?.electron

  if (typeof window !== 'undefined') {
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }

  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 50
  })

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.value = new Set([...visibleSections.value, entry.target.id])
        }
      })
    },
    { threshold: 0.1 }
  )

  document.querySelectorAll('[data-observe]').forEach((el) => observer?.observe(el))
})

onUnmounted(() => {
  observer?.disconnect()
})

function isVisible(id: string): boolean {
  return visibleSections.value.has(id)
}

function handleDownload(platform: string, href: string) {
  selectedPlatform.value = platform
  try {
    window.open(href, '_blank', 'noopener,noreferrer')
  } catch {
    window.location.href = href
  }
}

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function scrollToSectionMobile(sectionId: string) {
  scrollToSection(sectionId)
  mobileMenuOpen.value = false
}

const recommendedPlatform = computed(() => {
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Windows'
})

const recommendedDownload = computed(
  () => downloads.value.find((d) => d.platform === recommendedPlatform.value) || downloads.value[0]
)
</script>

<template>
  <div class="landing">
    <!-- Navigation -->
    <nav class="nav" :class="{ scrolled: isScrolled }">
      <div class="nav-container">
        <a class="brand" href="/">
          <div class="brand-icon">
            <Waves :size="24" />
          </div>
          <span>AetherPulse</span>
        </a>

        <div class="nav-links">
          <button class="nav-link" @click="scrollToSection('features')">Funkcje</button>
          <button class="nav-link" @click="scrollToSection('download')">Pobierz</button>
        </div>

        <button class="mobile-menu-btn" aria-label="Menu" @click="mobileMenuOpen = !mobileMenuOpen">
          <Menu v-if="!mobileMenuOpen" :size="24" />
          <X v-else :size="24" />
        </button>

        <div v-if="mobileMenuOpen" class="mobile-menu">
          <button class="nav-link" @click="scrollToSectionMobile('features')">Funkcje</button>
          <button class="nav-link" @click="scrollToSectionMobile('download')">Pobierz</button>
          <a href="/auth" class="btn secondary" @click="mobileMenuOpen = false">Zaloguj się</a>
          <a href="/auth" class="btn primary" @click="mobileMenuOpen = false">
            <Zap :size="16" />
            Otwórz AetherPulse
          </a>
        </div>

        <div class="nav-actions">
          <a href="/auth" class="btn secondary">Zaloguj się</a>
          <a href="/auth" class="btn primary">
            <Zap :size="16" />
            Otwórz AetherPulse
          </a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-badge">
            <Sparkles :size="14" />
            Darmowa platforma do rozmów głosowych i streamingu
          </div>

          <h1 class="hero-title">
            <span class="hero-title-line">Rozmawiaj, streamuj,</span>
            <span class="hero-title-line hero-title-gradient">współtwórz</span>
          </h1>

          <p class="hero-subtitle">
            AetherPulse to nowoczesna platforma do komunikacji głosowej, wideorozmów i współpracy.
            <strong>Bez ograniczeń, na każdej platformie.</strong>
          </p>

          <div class="hero-actions">
            <button
              class="btn primary large"
              @click="handleDownload(recommendedDownload.platform, recommendedDownload.href)"
            >
              <Download :size="20" />
              <span>Pobierz dla {{ recommendedDownload.platform }}</span>
            </button>

            <div class="hero-secondary-actions">
              <a href="/auth" class="btn secondary large">
                <Globe2 :size="20" />
                Otwórz w przeglądarce
              </a>
              <div class="platform-icons">
                <span class="platform-icon" title="Windows"><MonitorUp :size="18" /></span>
                <span class="platform-icon" title="Android"><Smartphone :size="18" /></span>
                <span class="platform-icon" title="Linux"><Laptop :size="18" /></span>
                <span class="platform-icon" title="Web"><Globe2 :size="18" /></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Visual - App mockup -->
        <div class="hero-visual">
          <div class="mockup">
            <div class="mockup-header">
              <div class="mockup-dots"><span /><span /><span /></div>
              <div class="mockup-title">AetherPulse</div>
            </div>
            <div class="mockup-body">
              <div class="mockup-sidebar">
                <div class="mockup-avatar" />
                <div class="mockup-avatar" />
                <div class="mockup-avatar" />
                <div class="mockup-avatar muted" />
              </div>
              <div class="mockup-main">
                <div class="mockup-topbar">
                  <div class="mockup-tag"># ogólny</div>
                  <div class="mockup-icons">
                    <Mic :size="14" />
                    <Video :size="14" />
                  </div>
                </div>
                <div class="mockup-messages">
                  <div class="mockup-msg theirs" style="width: 70%" />
                  <div class="mockup-msg theirs" style="width: 50%" />
                  <div class="mockup-msg mine" style="width: 60%" />
                  <div class="mockup-msg theirs" style="width: 80%" />
                  <div class="mockup-msg mine" style="width: 45%" />
                </div>
                <div class="mockup-input">
                  <div class="mockup-input-dot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="hero-decoration">
        <div class="hero-gradient-sphere s1" />
        <div class="hero-gradient-sphere s2" />
        <div class="hero-gradient-sphere s3" />
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features-section">
      <div class="section-container">
        <div
          class="section-header"
          data-observe="features-header"
          :class="{ visible: isVisible('features-header') }"
        >
          <span class="section-badge">
            <Sparkles :size="14" />
            Funkcjonalności
          </span>
          <h2 class="section-title">Wszystko, czego potrzebujesz<br />w jednym miejscu</h2>
          <p class="section-subtitle">
            Od rozmów głosowych po streaming w jakości HD &mdash; AetherPulse oferuje kompletny
            zestaw narzędzi dla Twojej społeczności.
          </p>
        </div>

        <!-- Feature Categories -->
        <div
          class="feature-tabs"
          data-observe="features-tabs"
          :class="{ visible: isVisible('features-tabs') }"
        >
          <button
            v-for="tab in featureCategories"
            :key="tab.id"
            class="feature-tab"
            :class="{ active: currentFeatureTab === tab.id }"
            @click="currentFeatureTab = tab.id"
          >
            <component :is="tab.icon" :size="18" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Features Grid -->
        <div class="features-grid">
          <article
            v-for="(feature, i) in filteredFeatures"
            :id="'feature-' + i"
            :key="feature.title"
            class="feature-card"
            :class="{ visible: isVisible('feature-' + i) }"
            :data-observe="'feature-' + i"
            :style="{ transitionDelay: i * 100 + 'ms' }"
          >
            <div class="feature-card-glow" />
            <div class="feature-icon-wrapper">
              <component :is="feature.icon" :size="28" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Downloads Section -->
    <section id="download" class="downloads-section">
      <div class="section-container">
        <div
          class="section-header"
          data-observe="download-header"
          :class="{ visible: isVisible('download-header') }"
        >
          <span class="section-badge">
            <Download :size="14" />
            Pobierz
          </span>
          <h2 class="section-title">Dołącz do społeczności<br />już teraz</h2>
          <p class="section-subtitle">
            Dostępne na Windows, Android, Linux i w przeglądarce. Wybierz swoją platformę i zaczynaj
            przygodę.
          </p>
        </div>

        <div class="download-platforms">
          <div
            v-for="item in downloads"
            :key="item.platform"
            class="download-card"
            :class="{ featured: item.primary }"
            @click="handleDownload(item.platform, item.href)"
          >
            <div class="download-icon">
              <component :is="item.icon" :size="32" />
            </div>
            <div class="download-info">
              <h4>{{ item.platform }}</h4>
              <p>{{ item.meta }}</p>
            </div>
            <div class="download-details">
              <span class="download-badge">{{ item.badge }}</span>
              <span class="download-size">{{ item.size }}</span>
            </div>
            <button class="download-btn">
              <Download :size="18" />
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- Browser option -->
        <div
          class="browser-promo"
          data-observe="browser-promo"
          :class="{ visible: isVisible('browser-promo') }"
        >
          <div class="browser-promo-content">
            <Globe2 :size="24" />
            <div class="browser-promo-text">
              <strong>Wolisz przeglądarkę?</strong>
              <p>
                Uruchom AetherPulse bezpośrednio w przeglądarce bez instalacji &mdash; wystarczy
                konto.
              </p>
            </div>
          </div>
          <a href="/auth" class="btn secondary"> Otwórz w przeglądarce </a>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-container" data-observe="cta" :class="{ visible: isVisible('cta') }">
        <div class="cta-content">
          <h2>Gotowy na nową erę<br />komunikacji?</h2>
          <p>
            Dołącz do tysięcy użytkowników, którzy już odkryli swobodę AetherPulse.
            <strong>Za darmo.</strong>
          </p>
        </div>
        <div class="cta-actions">
          <button class="btn primary large" @click="handleDownload('Windows', downloads[0].href)">
            <Download :size="20" />
            Pobierz teraz
          </button>
          <a href="/auth" class="btn ghost large">
            Zaczynaj za darmo
            <ArrowRight :size="18" />
          </a>
        </div>
      </div>
      <div class="cta-decoration">
        <div class="cta-glow" />
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-main">
          <div class="footer-brand-col">
            <a class="footer-brand" href="/">
              <Waves :size="24" />
              <span>AetherPulse</span>
            </a>
            <p class="footer-desc">
              Nowoczesna platforma do komunikacji głosowej, wideorozmów i współpracy zespołowej.
            </p>
          </div>

          <div class="footer-links">
            <div class="footer-column">
              <h4>Produkt</h4>
              <a href="#features">Funkcje</a>
              <a href="#download">Pobierz</a>
            </div>
            <div class="footer-column">
              <h4>Społeczność</h4>
              <a href="https://github.com/BoziaO/Aether-Pulse" target="_blank">GitHub</a>
              <a href="https://discord.gg/example" target="_blank">Discord</a>
            </div>
            <div class="footer-column">
              <h4>Wsparcie</h4>
              <a href="/docs">Dokumentacja</a>
              <a href="mailto:support@aetherpulse.app">Kontakt</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; {{ new Date().getFullYear() }} AetherPulse. Wszelkie prawa zastrzeżone.</p>
          <div class="footer-social">
            <a href="https://github.com/BoziaO/Aether-Pulse" target="_blank" title="GitHub">
              <Code2 :size="18" />
            </a>
          </div>
        </div>
      </div>
    </footer>

    <div class="mobile-download-bar">
      <button class="btn primary large" @click="handleDownload('Windows', downloads[0].href)">
        <Download :size="18" />
        Pobierz aplikację
      </button>
    </div>
  </div>
</template>

<style scoped>
/* CSS Variables */
:root {
  --primary: #5865f2;
  --primary-hover: #4752c4;
  --primary-gradient: linear-gradient(135deg, #5865f2, #7289da);
  --secondary: #3ba55c;
  --secondary-hover: #2e8e49;
  --danger: #ed4245;
  --warning: #faa61a;
  --bg-primary: #0a0a0f;
  --bg-secondary: #1e1e2e;
  --bg-tertiary: #2e2e42;
  --border: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.16);
  --text-primary: #ffffff;
  --text-secondary: #b9bbbe;
  --text-muted: #72767d;
  --accent: #5865f2;
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 16px 64px rgba(0, 0, 0, 0.4);
}

/* Reset & Base */
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  scroll-behavior: smooth;
}

.landing {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  overflow-x: hidden;
  position: relative;
}

/* Typography */
h1,
h2,
h3,
h4,
p {
  margin: 0;
  line-height: 1.5;
}

a {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn.primary {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 14px rgba(88, 101, 242, 0.4);
}

.btn.primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(88, 101, 242, 0.5);
}

.btn.secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn.secondary:hover {
  border-color: var(--border-hover);
  background: rgba(255, 255, 255, 0.02);
}

.btn.ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn.ghost:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.btn.large {
  padding: 14px 28px;
  font-size: 15px;
}

/* Navigation */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  transition: all 0.3s ease;
}

.nav.scrolled {
  background: rgba(10, 10, 15, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: 8px;
  color: white;
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav-actions {
  display: flex;
  gap: 12px;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.mobile-menu-btn:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.mobile-menu {
  display: none;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-top: 8px;
}

.mobile-menu .nav-link {
  width: 100%;
  text-align: center;
  padding: 12px;
}

.mobile-menu .btn {
  width: 100%;
  justify-content: center;
}

/* Hero Section */
.hero {
  padding: 120px 24px 80px;
  position: relative;
  overflow: hidden;
}

.hero-container {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 48px;
}

.hero-content {
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: var(--primary);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.hero-title {
  font-size: clamp(40px, 7vw, 80px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-title-line {
  display: block;
}

.hero-title-gradient {
  background: linear-gradient(135deg, #a78bfa, #67e8f9, #5865f2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: clamp(18px, 2.5vw, 24px);
  color: var(--text-secondary);
  max-width: 600px;
  margin-bottom: 32px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-secondary-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.platform-icons {
  display: flex;
  gap: 8px;
}

.platform-icon {
  font-size: 20px;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  transition: transform 0.2s ease;
}

.platform-icon:hover {
  transform: scale(1.1);
}

/* Hero Visual */
.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-visual .mockup {
  animation: mockupEnter 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.3s;
}

@keyframes mockupEnter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Decorative Elements */
.hero-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.hero-gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
}

.hero-gradient-sphere.s1 {
  width: 500px;
  height: 500px;
  top: -200px;
  right: -100px;
  background: radial-gradient(circle, rgba(88, 101, 242, 0.15), transparent);
  animation: sphereFloat 10s ease-in-out infinite;
}

.hero-gradient-sphere.s2 {
  width: 400px;
  height: 400px;
  bottom: -150px;
  left: -100px;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.1), transparent);
  animation: sphereFloat 14s ease-in-out infinite reverse;
}

.hero-gradient-sphere.s3 {
  width: 250px;
  height: 250px;
  top: 40%;
  left: 20%;
  background: radial-gradient(circle, rgba(103, 232, 249, 0.08), transparent);
  animation: sphereFloat 12s ease-in-out infinite;
}

@keyframes sphereFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 10px) scale(0.95);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(20px, -20px) rotate(5deg);
  }
}

/* App Mockup */
.mockup {
  width: 100%;
  max-width: 540px;
  background: rgba(30, 30, 46, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.mockup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(20, 20, 30, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.mockup-dots {
  display: flex;
  gap: 6px;
}

.mockup-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.mockup-dots span:nth-child(1) {
  background: #ed4245;
}
.mockup-dots span:nth-child(2) {
  background: #faa61a;
}
.mockup-dots span:nth-child(3) {
  background: #3ba55c;
}

.mockup-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.mockup-body {
  display: flex;
  height: 320px;
}

.mockup-sidebar {
  width: 56px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(10, 10, 15, 0.4);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  align-items: center;
}

.mockup-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.3), rgba(88, 101, 242, 0.1));
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mockup-avatar.muted {
  opacity: 0.4;
}

.mockup-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.mockup-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.mockup-tag {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.mockup-icons {
  display: flex;
  gap: 8px;
  color: var(--text-muted);
}

.mockup-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: flex-end;
  padding-bottom: 12px;
}

.mockup-msg {
  height: 10px;
  border-radius: 4px;
  animation: msgPulse 2s ease-in-out infinite;
}

.mockup-msg.theirs {
  background: rgba(255, 255, 255, 0.08);
  align-self: flex-start;
}

.mockup-msg.mine {
  background: linear-gradient(90deg, rgba(88, 101, 242, 0.3), rgba(88, 101, 242, 0.15));
  align-self: flex-end;
}

@keyframes msgPulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.mockup-input {
  height: 36px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.mockup-input-dot {
  width: 40%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

/* Features Section */
.features-section {
  padding: 80px 24px;
}

.section-container {
  max-width: 1280px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.section-header.visible {
  opacity: 1;
  transform: translateY(0);
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--primary-gradient);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 14px rgba(88, 101, 242, 0.3);
}

.section-title {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 20px;
}

.section-subtitle {
  font-size: clamp(16px, 2vw, 18px);
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

/* Feature Tabs */
.feature-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 48px;
  flex-wrap: wrap;
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 200ms;
}

.feature-tabs.visible {
  opacity: 1;
  transform: translateY(0);
}

.feature-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.feature-tab:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.feature-tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.feature-card {
  position: relative;
  background: rgba(30, 30, 46, 0.5);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 32px;
  cursor: default;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  transform: translateY(24px);
}

.feature-card.visible {
  opacity: 1;
  transform: translateY(0);
}

.feature-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: rgba(88, 101, 242, 0.3);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(88, 101, 242, 0.05);
  background: rgba(30, 30, 46, 0.7);
}

.feature-card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(88, 101, 242, 0.4), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.feature-card:hover .feature-card-glow {
  opacity: 1;
}

.feature-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: 12px;
  margin-bottom: 20px;
  color: white;
  position: relative;
}

.feature-icon-wrapper::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: var(--primary-gradient);
  opacity: 0.2;
  filter: blur(8px);
  z-index: -1;
}

.feature-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.feature-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Downloads Section */
.downloads-section {
  padding: 80px 24px;
  background: linear-gradient(180deg, transparent, rgba(30, 30, 46, 0.2));
}

.download-platforms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.download-card {
  background: rgba(30, 30, 46, 0.5);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.download-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-hover);
  box-shadow: var(--shadow);
}

.download-card.featured {
  border-color: rgba(88, 101, 242, 0.4);
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.12), rgba(30, 30, 46, 0.5));
  box-shadow: 0 0 30px rgba(88, 101, 242, 0.08);
}

.download-icon {
  color: var(--primary);
  margin-bottom: 16px;
}

.download-info {
  margin-bottom: 20px;
}

.download-info h4 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.download-info p {
  font-size: 13px;
  color: var(--text-muted);
}

.download-details {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.download-badge {
  padding: 4px 10px;
  background: var(--primary);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.download-size {
  font-size: 12px;
  color: var(--text-muted);
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-btn:hover {
  background: var(--primary-hover);
}

.download-progress-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--bg-tertiary);
}

.progress-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 0 0 8px 8px;
  transition: width 0.3s ease;
}

/* Browser Promo */
.browser-promo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 32px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  flex-wrap: wrap;
  opacity: 0;
  transform: translateY(16px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-promo.visible {
  opacity: 1;
  transform: translateY(0);
}

.browser-promo-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.browser-promo-content svg {
  color: var(--primary);
}

.browser-promo-text strong {
  display: block;
  font-size: 16px;
  margin-bottom: 4px;
}

.browser-promo-text p {
  font-size: 13px;
  color: var(--text-muted);
}

/* CTA Section */
.cta-section {
  padding: 100px 24px;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.cta-container {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.cta-container.visible {
  opacity: 1;
  transform: translateY(0);
}

.cta-content {
  margin-bottom: 32px;
}

.cta-content h2 {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 16px;
}

.cta-content p {
  font-size: clamp(16px, 2vw, 18px);
  color: var(--text-secondary);
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.cta-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.cta-glow {
  width: 800px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(88, 101, 242, 0.1), transparent);
  filter: blur(100px);
}

/* Footer */
.footer {
  padding: 64px 24px 32px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
}

.footer-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 48px;
  margin-bottom: 48px;
  flex-wrap: wrap;
}

.footer-brand-col {
  max-width: 300px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}

.footer-brand svg {
  color: var(--primary);
}

.footer-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}

.footer-links {
  display: flex;
  gap: 64px;
  flex-wrap: wrap;
}

.footer-column h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.footer-column a {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  padding: 6px 0;
  transition: color 0.2s ease;
}

.footer-column a:hover {
  color: var(--text-primary);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.footer-bottom p {
  font-size: 12px;
  color: var(--text-muted);
}

.footer-social {
  display: flex;
  gap: 12px;
}

.footer-social a {
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.footer-social a:hover {
  color: var(--primary);
}

/* Animations */
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

.hero-content > * {
  animation: fadeInUp 0.6s ease-out both;
}

.hero-content > *:nth-child(1) {
  animation-delay: 0.1s;
}

.hero-content > *:nth-child(2) {
  animation-delay: 0.2s;
}

.hero-content > *:nth-child(3) {
  animation-delay: 0.3s;
}

.hero-content > *:nth-child(4) {
  animation-delay: 0.4s;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-content {
    order: 2;
  }

  .hero-visual {
    order: 1;
    margin-bottom: 48px;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-secondary-actions {
    align-items: center;
  }

  .nav-links {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .mobile-menu {
    display: flex;
  }
}

@media (max-width: 768px) {
  .nav-actions {
    display: none;
  }

  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-content {
    order: 2;
  }

  .hero-visual {
    order: -1;
    margin-bottom: 32px;
  }

  .hero-title {
    font-size: 48px;
  }

  .btn.large {
    padding: 12px 20px;
    font-size: 13px;
  }

  .hero {
    padding: 80px 24px 60px;
  }

  .hero-badge {
    font-size: 12px;
    padding: 4px 10px;
  }

  .download-platforms {
    grid-template-columns: 1fr;
  }

  .browser-promo {
    flex-direction: column;
    text-align: center;
  }

  .footer-main {
    flex-direction: column;
    text-align: center;
  }

  .footer-links {
    justify-content: center;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .hero-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .section-title {
    font-size: 28px;
  }

  .feature-tabs {
    justify-content: center;
  }

  .feature-tab {
    padding: 8px 12px;
    font-size: 12px;
  }

  .cta-actions {
    flex-direction: column;
  }
}

/* Loader */
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

/* Mobile Download Bar */
.mobile-download-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  padding: 12px 16px;
  background: rgba(10, 10, 15, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
}

.mobile-download-bar .btn {
  width: 100%;
  justify-content: center;
}

@media (max-width: 768px) {
  .mobile-download-bar {
    display: block;
  }
}
</style>
