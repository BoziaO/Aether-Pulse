<script setup lang="ts">
  import { ref, markRaw, onMounted, computed } from 'vue'
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
    badge?: string
  }

  interface FeatureItem {
    icon: any
    title: string
    desc: string
    category?: string
  }

  interface Testimonial {
    avatar: string
    name: string
    username: string
    quote: string
    stars: number
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

  const testimonials = ref<Testimonial[]>([
    {
      avatar: '🎮',
      name: 'GamerX',
      username: '@gamerx',
      quote: 'AetherPulse to rewolucja! Wreszcie mogę streamować z przyjaciółmi bez lagów i z doskonałą jakością dźwięku.',
      stars: 5,
    },
    {
      avatar: '💼',
      name: 'Anna K.',
      username: '@annak',
      quote: 'Używamy AetherPulse do zdalnej współpracy. Idealne rozwiązanie dla naszego zespołu.',
      stars: 5,
    },
    {
      avatar: '🎵',
      name: 'DJ Mark',
      username: '@djmark',
      quote: 'Dźwięk przestrzenny sprawia, że czuję się jakbym był w studiu nagraniowym. Niesamowite!',
      stars: 5,
    },
  ])

  const selectedPlatform = ref<string>('')
  const currentFeatureTab = ref<'all' | 'audio' | 'video' | 'chat' | 'social' | 'mobile' | 'security'>('all')
  const isScrolled = ref<boolean>(false)
  const mobileMenuOpen = ref<boolean>(false)

  // Browser compatibility check
  const isElectron = ref<boolean>(false)
  const isMobile = ref<boolean>(false)

  const filteredFeatures = computed(() => {
    if (currentFeatureTab.value === 'all') return features.value
    return features.value.filter(f => f.category === currentFeatureTab.value)
  })

  const featureCategories = ref<Array<{ id: 'all' | 'chat' | 'audio' | 'video' | 'social' | 'mobile' | 'security'; label: string; icon: any }>>([
    { id: 'all', label: 'Wszystkie', icon: markRaw(Star) },
    { id: 'audio', label: 'Dźwięk', icon: markRaw(Mic) },
    { id: 'video', label: 'Wideo', icon: markRaw(Video) },
    { id: 'chat', label: 'Chat', icon: markRaw(MessageCircle) },
    { id: 'social', label: 'Społeczność', icon: markRaw(Users) },
    { id: 'mobile', label: 'Mobilne', icon: markRaw(Smartphone) },
    { id: 'security', label: 'Bezpieczeństwo', icon: markRaw(Shield) },
  ])

  onMounted(() => {
    // Check if running in Electron
    isElectron.value = typeof window !== 'undefined' && 'electron' in window.process?.versions

    // Check if mobile device
    if (typeof window !== 'undefined') {
      isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

    // Handle scroll for navbar
    window.addEventListener('scroll', () => {
      isScrolled.value = window.scrollY > 50
    })
  })

  function handleDownload(platform: string, href: string) {
    selectedPlatform.value = platform

    try {
      window.open(href, '_blank', "noopener,noreferrer")
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

  function getStarRating(stars: number): string {
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  const recommendedPlatform = computed(() => {
    const ua = navigator.userAgent

    if (/Android/i.test(ua)) return 'Android'
    if (/Windows/i.test(ua)) return 'Windows'
    if (/Linux/i.test(ua)) return 'Linux'

    return 'Windows'
  })

  const recommendedDownload = computed(() =>
    downloads.value.find(
      d => d.platform === recommendedPlatform.value
    ) || downloads.value[0]
  )
</script>

<template>
  <div class="landing">
    <!-- Navigation -->
    <nav class="nav" :class="{ scrolled: isScrolled }">
      <div class="nav-container">
        <a class="brand" href="/">
          <img src="/icons/logo.png" alt="AetherPulse" loading="lazy" />
          <span>AetherPulse</span>
        </a>

        <div class="nav-links">
          <button class="nav-link" @click="scrollToSection('features')">Funkcje</button>
          <button class="nav-link" @click="scrollToSection('download')">Pobierz</button>
          <button class="nav-link" @click="scrollToSection('testimonials')">Opinie</button>
        </div>

        <button
          class="mobile-menu-btn"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Menu"
        >
          <Menu v-if="!mobileMenuOpen" :size="24" />
          <X v-else :size="24" />
        </button>

        <div
          v-if="mobileMenuOpen"
          class="mobile-menu"
        >
          <button class="nav-link" @click="scrollToSection('features'); mobileMenuOpen = false">Funkcje</button>
          <button class="nav-link" @click="scrollToSection('download'); mobileMenuOpen = false">Pobierz</button>
          <button class="nav-link" @click="scrollToSection('testimonials'); mobileMenuOpen = false">Opinie</button>
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
            <span class="badge-dot" />
            Najwyżej oceniana platforma do rozmów głosowych
          </div>

          <h1 class="hero-title">
            <span class="hero-title-inner">AetherPulse</span>
          </h1>

          <p class="hero-subtitle">
            Twój prywatny space do rozmów głosowych, streamingu i collaboration.
            <strong>Działa na wszystkim.</strong>
          </p>

          <div class="hero-actions">
            <button
              class="btn primary large" @click="handleDownload(
                recommendedDownload.platform,
                recommendedDownload.href
              )">
              <Download :size="20" />
              <span>Pobierz dla {{ recommendedDownload.platform }}</span>
            </button>

            <div class="hero-secondary-actions">
              <a href="/auth" class="btn secondary large">
                <Globe2 :size="20" />
                Otwórz w przeglądarce
              </a>
              <div class="platform-icons">
                <span class="platform-icon windows" title="Windows">🪟</span>
                <span class="platform-icon android" title="Android">📱</span>
                <span class="platform-icon linux" title="Linux">🐧</span>
                <span class="platform-icon web" title="Web">🌐</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Image / Preview -->
        <div class="hero-visual">
          <img
            src="/images/app-preview.webp"
            alt="AetherPulse Preview"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="hero-decoration">
        <div class="floating-element e1" />
        <div class="floating-element e2" />
        <div class="floating-element e3" />
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features-section">
      <div class="section-container">
        <div class="section-header">
          <span class="section-badge">✨ Funkcjonalności</span>
          <h2 class="section-title">Wszystko, czego potrzebujesz<br>w jednym miejscu</h2>
          <p class="section-subtitle">
            Od rozmów głosowych po streaming - AetherPulse oferuje kompletne rozwiązanie
            dla Twojej społeczności.
          </p>
        </div>

        <!-- Feature Categories -->
        <div class="feature-tabs">
          <button
            v-for="tab in featureCategories" :key="tab.id" class="feature-tab"
            :class="{ active: currentFeatureTab === tab.id }" @click="currentFeatureTab = tab.id">
            <component :is="tab.icon" :size="18" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Features Grid -->
        <div class="features-grid">
          <article v-for="feature in filteredFeatures" :key="feature.title" class="feature-card">
            <div class="feature-icon-wrapper">
              <component :is="feature.icon" :size="28" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.desc }}</p>
            <div class="feature-hover-effect" />
          </article>
        </div>
      </div>
    </section>

    <!-- Downloads Section -->
    <section id="download" class="downloads-section">
      <div class="section-container">
        <div class="section-header">
          <span class="section-badge">📥 Pobierz</span>
          <h2 class="section-title">Dołącz do społeczności<br>już teraz</h2>
          <p class="section-subtitle">
            Dostępne na Windows, Android, Linux i w przeglądarce.
            Wybierz swoją platformę i zaczynaj przygodę.
          </p>
        </div>

        <div class="download-platforms">
          <div
            v-for="item in downloads" :key="item.platform" class="download-card" :class="{ featured: item.primary }"
            @click="handleDownload(item.platform, item.href)">
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
        <div class="browser-promo">
          <div class="browser-promo-content">
            <Globe2 :size="24" />
            <div class="browser-promo-text">
              <strong>Wolisz przeglądarkę?</strong>
              <p>Uruchom AetherPulse bezpośrednio w przeglądarce bez instalacji.</p>
            </div>
          </div>
          <a href="/auth" class="btn secondary">
            Otwórz w przeglądarce
          </a>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="testimonials-section">
      <div class="section-container">
        <div class="section-header">
          <span class="section-badge">💬 Opinie</span>
          <h2 class="section-title">Co mówią nasi użytkownicy</h2>
        </div>

        <div class="testimonials-grid">
          <div v-for="testimonial in testimonials" :key="testimonial.username" class="testimonial-card">
            <div class="testimonial-header">
              <div class="testimonial-avatar">{{ testimonial.avatar }}</div>
              <div class="testimonial-author">
                <strong>{{ testimonial.name }}</strong>
                <span>{{ testimonial.username }}</span>
              </div>
            </div>
            <div class="testimonial-rating">{{ getStarRating(testimonial.stars) }}</div>
            <p class="testimonial-quote">{{ testimonial.quote }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-container">
        <div class="cta-content">
          <h2>Gotowy na nową erę<br>komunikacji?</h2>
          <p>Dołącz do tysięcy użytkowników, którzy już odkryli swobodę AetherPulse.</p>
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
          <a class="footer-brand" href="/">
            <img src="/icons/logo.png" alt="AetherPulse" loading="lazy" />
            <span>AetherPulse</span>
          </a>

          <div class="footer-links">
            <div class="footer-column">
              <h4>Produkt</h4>
              <a href="#features">Funkcje</a>
              <a href="#download">Pobierz</a>
              <a href="#testimonials">Opinie</a>
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
          <p>© {{ new Date().getFullYear() }} AetherPulse. Wszelkie prawa zastrzeżone.</p>
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
  --primary: #5865F2;
  --primary-hover: #4752C4;
  --primary-gradient: linear-gradient(135deg, #5865F2, #7289DA);
  --secondary: #3BA55C;
  --secondary-hover: #2E8E49;
  --danger: #ED4245;
  --warning: #FAA61A;
  --bg-primary: #0A0A0F;
  --bg-secondary: #1E1E2E;
  --bg-tertiary: #2E2E42;
  --border: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.16);
  --text-primary: #FFFFFF;
  --text-secondary: #B9BBBE;
  --text-muted: #72767D;
  --accent: #5865F2;
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
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

.brand img {
  width: 32px;
  height: 32px;
  object-fit: contain;
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
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}

.hero-title-inner {
  background: linear-gradient(135deg, #FFFFFF, #A78BFA, #67E8F9);
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

.screenshot-placeholder {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 16/10;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
}

.hero-visual img {
  width: 100%;
  max-width: 600px;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
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

.floating-element {
  position: absolute;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.02;
  filter: blur(80px);
}

.e1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.e2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
  animation: float 8s ease-in-out infinite reverse;
}

.e3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 10%;
  animation: float 7s ease-in-out infinite;
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
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--primary-gradient);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 24px;
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
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  cursor: default;
  transition: all 0.3s ease;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-hover);
  box-shadow: var(--shadow);
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

.feature-hover-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent, rgba(88, 101, 242, 0.05));
  pointer-events: none;
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
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.download-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-hover);
  box-shadow: var(--shadow);
}

.download-card.featured {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.1), var(--bg-secondary));
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

/* Testimonials Section */
.testimonials-section {
  padding: 80px 24px;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.testimonial-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}

.testimonial-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-hover);
  box-shadow: var(--shadow);
}

.testimonial-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.testimonial-avatar {
  font-size: 24px;
}

.testimonial-author strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.testimonial-author span {
  font-size: 12px;
  color: var(--text-muted);
}

.testimonial-rating {
  color: #FFBD2E;
  font-size: 14px;
  margin-bottom: 12px;
}

.testimonial-quote {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
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

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 24px;
}

.footer-brand img {
  width: 32px;
  height: 32px;
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

.hero-content>* {
  animation: fadeInUp 0.6s ease-out both;
}

.hero-content>*:nth-child(1) {
  animation-delay: 0.1s;
}

.hero-content>*:nth-child(2) {
  animation-delay: 0.2s;
}

.hero-content>*:nth-child(3) {
  animation-delay: 0.3s;
}

.hero-content>*:nth-child(4) {
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

  .testimonials-grid {
    grid-template-columns: 1fr;
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