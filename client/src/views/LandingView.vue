<script setup lang="ts">
  import { ref, markRaw, onMounted, onUnmounted, computed, type Component } from 'vue'
  import {
    Download,
    Globe2,
    Laptop,
    MonitorUp,
    Smartphone,
    Shield,
    Zap,
    Star,
    ArrowRight,
    Code2,
    Menu,
    X,
    Sparkles,
    Heart,
    Gamepad2,
    Briefcase,
    Palette,
    MessageCircle,
  } from 'lucide-vue-next'

  interface DownloadItem {
    icon: Component
    platform: string
    meta: string
    href: string
    label: string
    primary: boolean
    badge?: string
  }

  interface AudienceItem {
    icon: Component
    title: string
    desc: string
    color: string
  }

  interface ShowcaseItem {
    icon: Component
    title: string
    desc: string
    stat: string
  }

  const downloads: DownloadItem[] = [
    {
      icon: markRaw(MonitorUp),
      platform: 'Windows',
      meta: 'Windows 10+',
      href: 'https://github.com/BoziaO/Nicori/releases/download/v1.0/Nicori-setup-Windows-v1.0.exe',
      label: 'Pobierz',
      primary: true,
      badge: 'POPULARNY',
    },
    {
      icon: markRaw(Smartphone),
      platform: 'Android',
      meta: 'APK',
      href: '',
      label: 'Wkrótce',
      primary: false,
      badge: 'MOBILNY',
    },
    {
      icon: markRaw(Laptop),
      platform: 'Linux',
      meta: 'x64',
      href: 'https://github.com/BoziaO/Nicori/releases/download/v1.0/Nicori-setup-Linux-v1.0.zip',
      label: 'Pobierz',
      primary: false,
      badge: 'DEVELOPER',
    },
  ]

  const audienceItems: AudienceItem[] = [
    {
      icon: markRaw(Gamepad2),
      title: 'Gracze',
      desc: 'Niska latencja i krystaliczny dźwięk dla najlepszych wrażeń z rozgrywki.',
      color: '#d946ef',
    },
    {
      icon: markRaw(Briefcase),
      title: 'Zespoły',
      desc: 'Efektywna współpraca dzięki dedykowanym kanałom głosowym i tekstowym.',
      color: '#8b5cf6',
    },
    {
      icon: markRaw(Palette),
      title: 'Twórcy',
      desc: 'Streamuj w HD, nagrywaj i dziel się swoją twórczością ze światem.',
      color: '#3b82f6',
    },
    {
      icon: markRaw(MessageCircle),
      title: 'Przyjaciele',
      desc: 'Prywatne pokoje i bezpieczne rozmowy z najbliższymi.',
      color: '#06b6d4',
    },
  ]

  const showcaseItems: ShowcaseItem[] = [
    {
      icon: markRaw(Zap),
      title: 'Szybkość i lekkość',
      desc: 'Zoptymalizowany pod kątem wydajności, działa płynnie nawet na słabszych urządzeniach.',
      stat: '2x',
    },
    {
      icon: markRaw(Shield),
      title: 'Prywatność przede wszystkim',
      desc: 'Szyfrowanie end-to-end, brak śledzenia i zero reklam.',
      stat: '0',
    },
    {
      icon: markRaw(Heart),
      title: 'Open source',
      desc: 'Kod w pełni otwarty na GitHubie. Społeczność współtworzyć każdą linię.',
      stat: '100%',
    },
    {
      icon: markRaw(Star),
      title: 'Kawaii design',
      desc: 'Nowoczesny design z możliwością personalizacji. Nicori wygląda jak nikt inny.',
      stat: '∞',
    },
  ]

  const isScrolled = ref(false)
  const mobileOpen = ref(false)
  const visible = ref(new Set<string>())
  const downloadingPlatform = ref('')
  const scrollY = ref(0)
  const mouse = ref({ x: 0, y: 0 })

  let scrollFn: (() => void) | null = null
  let mouseFn: ((e: MouseEvent) => void) | null = null
  let obs: IntersectionObserver | null = null

  onMounted(() => {
    scrollFn = () => {
      isScrolled.value = window.scrollY > 50
      scrollY.value = window.scrollY
    }
    window.addEventListener('scroll', scrollFn, { passive: true })

    mouseFn = (e: MouseEvent) => {
      mouse.value = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', mouseFn, { passive: true })

    obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const key = (entry.target as HTMLElement).dataset.reveal
            if (key) {
              visible.value.add(key)
              visible.value = new Set(visible.value)
            }
          }
        }
      },
      { threshold: 0.15 }
    )

    document.querySelectorAll('[data-reveal]').forEach((el) => obs?.observe(el))
  })

  onUnmounted(() => {
    obs?.disconnect()
    if (scrollFn) window.removeEventListener('scroll', scrollFn)
    if (mouseFn) window.removeEventListener('mousemove', mouseFn)
  })

  function is(id: string) {
    return visible.value.has(id)
  }

  function handleDownload(platform: string, href: string) {
    if (!href) return
    downloadingPlatform.value = platform
    try {
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch {
      window.location.href = href
    }
    setTimeout(() => { downloadingPlatform.value = '' }, 3000)
  }

  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const platform = computed(() => {
    const ua = navigator.userAgent
    if (/Android/i.test(ua)) return 'Android'
    if (/Windows/i.test(ua)) return 'Windows'
    if (/Linux/i.test(ua)) return 'Linux'
    return 'Windows'
  })

  const recommended = computed(
    () => downloads.find((d) => d.platform === platform.value) || downloads[0]
  )
</script>

<template>
  <div class="lp">
    <div class="bg-orbs" aria-hidden="true">
      <div class="bg-orb bg-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="bg-orb bg-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="bg-orb bg-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="bg-orb bg-orb--teal"></div>
    </div>
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[9999] focus:px-5 focus:py-2.5 focus:rounded-full focus:bg-[var(--accent-violet)] focus:text-white focus:text-sm focus:font-semibold">
      Przejdź do treści
    </a>

    <!-- NAV -->
    <header class="nav" :class="{ scrolled: isScrolled }">
      <div class="nav-inner">
        <a href="/" class="nav-brand">
          <img src="/icons/logo.png" alt="" class="nav-logo" />
          <span class="nav-name">Nicori</span>
        </a>

        <nav class="nav-links">
          <button @click="go('showcase')">Wyróżniki</button>
          <button @click="go('audience')">Dla kogo?</button>
          <button @click="go('download')">Pobierz</button>
        </nav>

        <a href="/auth" class="btn btn-primary btn-sm nav-cta">
          <Zap :size="14" />
          Otwórz
        </a>

        <button class="nav-toggle" :aria-label="mobileOpen ? 'Zamknij' : 'Menu'" @click="mobileOpen = !mobileOpen">
          <Menu v-if="!mobileOpen" :size="20" />
          <X v-else :size="20" />
        </button>
      </div>

      <Transition name="drawer">
        <div v-if="mobileOpen" class="nav-mobile">
          <button @click="go('showcase'); mobileOpen = false">Wyróżniki</button>
          <button @click="go('audience'); mobileOpen = false">Dla kogo?</button>
          <button @click="go('download'); mobileOpen = false">Pobierz</button>
          <hr />
          <a href="/auth" class="btn btn-primary" @click="mobileOpen = false">
            <Zap :size="14" />
            Otwórz Nicori
          </a>
        </div>
      </Transition>
    </header>

    <!-- HERO -->
    <section id="main" class="hero">
      <div class="hero-inner">
        <div class="hero-text">
          <div class="badge badge-violet hero-badge">
            <Sparkles :size="12" />
            Darmowa platforma komunikacyjna
          </div>

          <h1 class="hero-title">
            Rozmawiaj,<br />
            streamuj,<br />
            <span class="gradient-text">baw się!</span>
          </h1>

          <p class="hero-desc">
            Nicori to nowoczesna platforma do komunikacji głosowej,
            wideorozmów i streamingu.
          </p>

          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" @click="handleDownload(recommended.platform, recommended.href)">
              <Download :size="18" />
              Pobierz na {{ recommended.platform }}
            </button>
            <a href="/auth" class="btn btn-ghost btn-lg">
              <Globe2 :size="18" />
              Otwórz w przeglądarce
            </a>
          </div>

          <div class="hero-stats">
            <div class="stat">
              <span class="stat-val">120MB</span>
              <span class="stat-lbl">Windows</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <span class="stat-val">45MB</span>
              <span class="stat-lbl">Android</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <span class="stat-val">140MB</span>
              <span class="stat-lbl">Linux</span>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="hero-glow"></div>
          <div class="hero-ring hero-ring--outer"></div>
          <div class="hero-ring hero-ring--inner"></div>
          <img src="/icons/logo-simp.png" alt="" class="hero-mascot" />
          <div class="orbit-dot orbit-dot--1"></div>
          <div class="orbit-dot orbit-dot--2"></div>
          <div class="orbit-dot orbit-dot--3"></div>
        </div>
      </div>

      <div class="hero-scroll" @click="go('showcase')">
        <ArrowRight :size="16" class="rotate-90" />
      </div>
    </section>

    <!-- SHOWCASE -->
    <section id="showcase" class="section">
      <div class="container">
        <div class="section-head" data-reveal="showcase-head" :class="{ 'is-visible': is('showcase-head') }">
          <div class="badge badge-violet">
            <Star :size="12" />
            Wyróżniki
          </div>
          <h2 class="section-title">
            Nie kolejny klon Discorda<br />
            <span class="gradient-text">coś zupełnie nowego</span>
          </h2>
        </div>

        <div class="showcase-grid">
          <div
            v-for="(item, i) in showcaseItems"
            :key="item.title"
            class="card glass showcase-card"
            :data-reveal="'sc-' + i"
            :class="{ 'is-visible': is('sc-' + i) }"
            :style="{ transitionDelay: i * 80 + 'ms' }"
          >
            <div class="showcase-stat gradient-text">{{ item.stat }}</div>
            <div class="showcase-icon-wrap">
              <component :is="item.icon" :size="20" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- AUDIENCE -->
    <section id="audience" class="section">
      <div class="container">
        <div class="section-head" data-reveal="aud-head" :class="{ 'is-visible': is('aud-head') }">
          <div class="badge badge-violet">
            <Heart :size="12" />
            Dla kogo?
          </div>
          <h2 class="section-title">
            Dla każdego,<br />
            <span class="gradient-text">kto kocha rozmawiać</span>
          </h2>
        </div>

        <div class="audience-grid">
          <div
            v-for="(item, i) in audienceItems"
            :key="item.title"
            class="card audience-card"
            :data-reveal="'ac-' + i"
            :class="{ 'is-visible': is('ac-' + i) }"
            :style="{ '--accent': item.color, transitionDelay: i * 80 + 'ms' }"
          >
            <div class="audience-accent"></div>
            <div class="audience-icon" :style="{ background: item.color }">
              <component :is="item.icon" :size="20" color="white" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- DOWNLOAD -->
    <section id="download" class="section">
      <div class="container">
        <div class="section-head" data-reveal="dl-head" :class="{ 'is-visible': is('dl-head') }">
          <div class="badge badge-violet">
            <Download :size="12" />
            Pobierz
          </div>
          <h2 class="section-title">
            Dołącz do społeczności<br />
            <span class="gradient-text">już teraz</span>
          </h2>
          <p class="section-desc">Dostępne na Windows, Android i Linux. Wybierz platformę i zaczynaj.</p>
        </div>

        <div class="download-grid">
          <div
            v-for="(item, i) in downloads"
            :key="item.platform"
            class="download-card"
            :class="{ 'is-featured': item.primary, 'is-disabled': !item.href }"
            :style="{ transitionDelay: i * 100 + 'ms' }"
            role="button"
            :tabindex="item.href ? 0 : -1"
            :aria-disabled="!item.href"
            @click="handleDownload(item.platform, item.href)"
            @keydown.enter.prevent="handleDownload(item.platform, item.href)"
            @keydown.space.prevent="handleDownload(item.platform, item.href)"
          >
            <div v-if="item.primary" class="dl-glow"></div>
            <div class="dl-icon-wrap">
              <component :is="item.icon" :size="32" />
            </div>
            <div class="dl-info">
              <h4>{{ item.platform }}</h4>
              <span class="dl-meta">{{ item.meta }}</span>
            </div>
            <div v-if="item.badge" class="dl-badge">{{ item.badge }}</div>
            <div class="dl-action-row">
              <span v-if="item.href" class="dl-action">
                <template v-if="downloadingPlatform !== item.platform">
                  {{ item.label }}
                  <ArrowRight :size="14" />
                </template>
                <span v-else class="spinner"></span>
              </span>
              <span v-else class="dl-action dl-action--muted">Wkrótce</span>
            </div>
          </div>
        </div>

        <div class="card glass browser-row" data-reveal="browser" :class="{ 'is-visible': is('browser') }">
          <div class="browser-left">
            <Globe2 :size="20" class="text-[var(--accent-teal)]" />
            <div>
              <strong>Wolisz przeglądarkę?</strong>
              <p class="text-sm text-[var(--text-secondary)]">Uruchom Nicori bezpośrednio — wystarczy konto.</p>
            </div>
          </div>
          <a href="/auth" class="btn btn-ghost btn-sm">Otwórz w przeglądarce</a>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="cta-glow"></div>
      <div class="cta-inner">
        <h2 class="cta-title">
          Gotowy na nową erę<br />
          <span class="gradient-text">komunikacji?</span>
        </h2>
        <p class="cta-desc">
          Dołącz do tysięcy użytkowników, którzy już odkryli swobodę Nicori.
        </p>
        <div class="cta-actions">
          <button class="btn btn-primary btn-lg" @click="handleDownload(recommended.platform, recommended.href)">
            <Download :size="18" />
            Pobierz teraz
          </button>
          <a href="/auth" class="btn btn-ghost btn-lg">
            Zaczynaj za darmo
            <ArrowRight :size="18" />
          </a>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <a href="/" class="footer-logo">
              <img src="/icons/logo-mono.png" alt="" class="footer-logo-img" />
              <span>Nicori</span>
            </a>
            <p>Nowoczesna platforma do komunikacji głosowej, wideorozmów i współpracy zespołowej.</p>
          </div>
          <div class="footer-cols">
            <div class="footer-col">
              <h4>Produkt</h4>
              <a href="#showcase">Wyróżniki</a>
              <a href="#download">Pobierz</a>
              <a href="#audience">Dla kogo?</a>
            </div>
            <div class="footer-col">
              <h4>Społeczność</h4>
              <a href="https://github.com/BoziaO/Nicori" target="_blank">GitHub</a>
              <a href="https://discord.gg/example" target="_blank">Discord</a>
            </div>
            <div class="footer-col">
              <h4>Wsparcie</h4>
              <a href="/docs">Dokumentacja</a>
              <a href="mailto:support@nicori.app">Kontakt</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ new Date().getFullYear() }} Nicori. Wszelkie prawa zastrzeżone.</p>
          <a href="https://github.com/BoziaO/Nicori" target="_blank" aria-label="GitHub">
            <Code2 :size="16" />
          </a>
        </div>
      </div>
    </footer>

    <!-- MOBILE BAR -->
    <div class="mobile-bar">
      <button class="btn btn-primary" @click="handleDownload(recommended.platform, recommended.href)">
        <Download :size="16" />
        Pobierz aplikację
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ========== BASE ========== */
.lp {
  min-height: 100dvh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
  position: relative;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

.gradient-text {
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lp .badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: auto;
}

/* ========== NAV ========== */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 20px;
  transition: all 0.3s ease;
}

.nav.scrolled {
  background: rgba(7, 10, 19, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}

.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
}

.nav-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: contain;
}

.nav-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-links button {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-links button:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-cta {
  border-radius: 9999px;
}

.nav-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.nav-toggle:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-mobile {
  max-width: 1100px;
  margin: 0 auto;
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-mobile button {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.nav-mobile button:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-mobile hr {
  border: none;
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.nav-mobile .btn {
  width: 100%;
  justify-content: center;
}

/* Drawer transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ========== HERO ========== */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 100px 20px 60px;
}

/* ========== BG ORBS (fixed, full-page) ========== */
.bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.bg-orb--violet {
  width: 600px;
  height: 600px;
  top: -15%;
  right: 5%;
  background: rgba(139, 92, 246, 0.08);
}

.bg-orb--pink {
  width: 500px;
  height: 500px;
  top: 40%;
  left: -10%;
  background: rgba(217, 70, 239, 0.06);
}

.bg-orb--blue {
  width: 450px;
  height: 450px;
  top: 60%;
  right: -5%;
  background: rgba(59, 130, 246, 0.05);
}

.bg-orb--teal {
  width: 350px;
  height: 350px;
  top: 10%;
  left: 30%;
  background: rgba(6, 182, 212, 0.04);
  animation: orbDrift 20s ease-in-out infinite;
}

@keyframes orbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(40px, -30px); }
}

.hero-inner {
  max-width: 1100px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-text {
  display: flex;
  flex-direction: column;
}

.hero-badge {
  align-self: flex-start;
  margin-bottom: 28px;
  animation: fadeSlideUp 0.5s ease both;
}

.hero-title {
  font-size: clamp(38px, 5.5vw, 64px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
  animation: fadeSlideUp 0.5s ease 0.1s both;
}

.hero-desc {
  font-size: 17px;
  color: var(--text-secondary);
  line-height: 1.65;
  max-width: 440px;
  margin-bottom: 32px;
  animation: fadeSlideUp 0.5s ease 0.2s both;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 48px;
  animation: fadeSlideUp 0.5s ease 0.3s both;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  animation: fadeSlideUp 0.5s ease 0.4s both;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-size: 18px;
  font-weight: 700;
}

.stat-lbl {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
}

/* Hero Visual */
.hero-visual {
  position: relative;
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-glow {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%);
  animation: heroGlow 4s ease-in-out infinite;
}

.hero-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--border);
}

.hero-ring--outer {
  width: 300px;
  height: 300px;
  animation: heroSpin 25s linear infinite;
}

.hero-ring--inner {
  width: 220px;
  height: 220px;
  animation: heroSpin 18s linear infinite reverse;
  border-color: rgba(139, 92, 246, 0.1);
}

.hero-mascot {
  position: relative;
  z-index: 2;
  width: 160px;
  height: 160px;
  object-fit: contain;
  animation: heroFloat 5s ease-in-out infinite;
  filter: drop-shadow(0 0 40px rgba(139, 92, 246, 0.2));
}

.orbit-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.orbit-dot--1 {
  top: 8%;
  right: 20%;
  background: var(--accent-violet);
  animation: dotPulse 3s ease-in-out infinite;
}

.orbit-dot--2 {
  bottom: 15%;
  left: 10%;
  background: var(--accent-blue);
  animation: dotPulse 3.5s ease-in-out infinite 1s;
}

.orbit-dot--3 {
  top: 40%;
  right: 5%;
  background: var(--accent-teal);
  animation: dotPulse 2.8s ease-in-out infinite 0.5s;
}

.hero-scroll {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
  animation: fadeSlideUp 0.5s ease 0.6s both;
}

.hero-scroll:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
  background: var(--bg-hover);
}

.rotate-90 {
  transform: rotate(90deg);
}

/* ========== SECTIONS ========== */
.section {
  padding: 100px 0;
  position: relative;
  content-visibility: auto;
  contain-intrinsic-size: 0 600px;
}

.section-head {
  text-align: center;
  margin-bottom: 56px;
  opacity: 0;
  transform: translateY(16px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.section-head.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.section-head .badge {
  margin-bottom: 16px;
}

.section-title {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.section-desc {
  font-size: 16px;
  color: var(--text-secondary);
  margin-top: 12px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

/* ========== SHOWCASE ========== */
.showcase-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.showcase-card {
  padding: 28px;
  opacity: 0;
  transform: translateY(16px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.showcase-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.showcase-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-accent);
}

.showcase-card.is-visible:hover {
  transform: translateY(-3px);
}

.showcase-stat {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 16px;
}

.showcase-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-violet);
  margin-bottom: 14px;
}

.showcase-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.showcase-card p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ========== AUDIENCE ========== */
.audience-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.audience-card {
  padding: 28px 24px;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.audience-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.audience-card:hover {
  transform: translateY(-3px);
}

.audience-card.is-visible:hover {
  transform: translateY(-3px);
}

.audience-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.2s;
}

.audience-card:hover .audience-accent {
  opacity: 1;
}

.audience-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.audience-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.audience-card p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ========== DOWNLOAD ========== */
.download-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.download-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px 28px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
}

.download-card:hover {
  border-color: var(--border-accent);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.08);
}

.download-card.is-featured {
  border-color: var(--border-accent);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(59, 130, 246, 0.04), var(--bg-surface));
}

.dl-glow {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent 70%);
  pointer-events: none;
}

.download-card.is-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.dl-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(139, 92, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-violet);
}

.download-card.is-featured .dl-icon-wrap {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.15));
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);
}

.dl-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dl-info h4 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.dl-meta {
  font-size: 13px;
  color: var(--text-muted);
}

.dl-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  color: white;
}

.dl-action-row {
  width: 100%;
  margin-top: auto;
}

.dl-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-violet);
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.dl-action:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.dl-action--muted {
  color: var(--text-muted);
  background: var(--bg-hover);
  border-color: var(--border);
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-top-color: var(--accent-violet);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Browser row */
.browser-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  gap: 16px;
  flex-wrap: wrap;
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-row.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.browser-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.browser-left strong {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}

/* ========== CTA ========== */
.cta {
  padding: 100px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(139, 92, 246, 0.08), transparent 60%);
  pointer-events: none;
}

.cta-inner {
  max-width: 520px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.cta-title {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 12px;
}

.cta-desc {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 28px;
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ========== FOOTER ========== */
.footer {
  padding: 48px 0 28px;
  border-top: 1px solid var(--border);
}

.footer-inner {
  display: flex;
  flex-direction: column;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 48px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}

.footer-brand {
  max-width: 260px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.footer-logo-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.footer-brand p {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}

.footer-cols {
  display: flex;
  gap: 48px;
  flex-wrap: wrap;
}

.footer-col h4 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.footer-col a {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 0;
  transition: color 0.15s;
}

.footer-col a:hover {
  color: var(--text-primary);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.footer-bottom p {
  font-size: 12px;
  color: var(--text-muted);
}

.footer-bottom a {
  color: var(--text-muted);
  transition: color 0.15s;
}

.footer-bottom a:hover {
  color: var(--accent-violet);
}

/* ========== MOBILE BAR ========== */
.mobile-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  background: rgba(7, 10, 19, 0.92);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--border);
}

.mobile-bar .btn {
  width: 100%;
  justify-content: center;
}

/* ========== ANIMATIONS ========== */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes heroGlow {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

@keyframes heroSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes heroFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.6); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========== REDUCED MOTION ========== */
@media (prefers-reduced-motion: reduce) {
  .bg-orb,
  .hero-ring,
  .hero-glow,
  .hero-mascot,
  .orbit-dot,
  .hero-text > * {
    animation: none !important;
  }
  .section-head,
  .showcase-card,
  .audience-card,
  .browser-row {
    opacity: 1 !important;
    transform: none !important;
  }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 40px;
  }

  .hero-text {
    align-items: center;
  }

  .hero-badge {
    align-self: center;
  }

  .hero-desc {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-stats {
    justify-content: center;
  }

  .hero-visual {
    height: 320px;
  }

  .hero-mascot {
    width: 130px;
    height: 130px;
  }

  .hero-ring--outer {
    width: 240px;
    height: 240px;
  }

  .hero-ring--inner {
    width: 180px;
    height: 180px;
  }

  .nav-links {
    display: none;
  }

  .nav-toggle {
    display: flex;
  }

  .audience-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .nav-cta {
    display: none;
  }

  .nav {
    padding-top: env(safe-area-inset-top, 0px);
  }

  .audience-grid,
  .showcase-grid,
  .download-grid {
    grid-template-columns: 1fr;
  }

  .browser-row {
    flex-direction: column;
    text-align: center;
  }

  .browser-left {
    flex-direction: column;
  }

  .footer-top {
    flex-direction: column;
    text-align: center;
  }

  .footer-cols {
    justify-content: center;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .mobile-bar {
    display: block;
  }

  .footer {
    padding-bottom: calc(28px + 68px + env(safe-area-inset-bottom, 0px));
  }

  .hero-visual {
    height: 260px;
  }

  .hero-mascot {
    width: 110px;
    height: 110px;
  }

  .hero-ring--outer {
    width: 200px;
    height: 200px;
  }

  .hero-ring--inner {
    width: 150px;
    height: 150px;
  }

  .hero-glow {
    width: 200px;
    height: 200px;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 80px 16px 40px;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .hero-actions .btn {
    width: 100%;
    justify-content: center;
    min-height: 48px;
  }

  .cta-actions {
    flex-direction: column;
  }

  .cta-actions .btn {
    width: 100%;
    justify-content: center;
    min-height: 48px;
  }

  .hero-stats {
    gap: 14px;
  }

  .section {
    padding: 60px 0;
  }

  .section-title {
    font-size: clamp(24px, 6vw, 36px);
  }

  .cta {
    padding: 80px 16px calc(80px + 68px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
