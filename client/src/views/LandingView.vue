<script setup lang="ts">
import { markRaw } from 'vue'
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
} from 'lucide-vue-next'

const downloads = [
  {
    icon: markRaw(MonitorUp),
    platform: 'Windows',
    meta: 'Windows 10+',
    href: 'https://github.com/BoziaO/Aether-Pulse/releases/download/v1.0/AetherPulse-setup-v1.0.exe',
    label: 'Pobierz .exe',
    primary: true,
  },
  {
    icon: markRaw(Smartphone),
    platform: 'Android',
    meta: 'APK dla telefonu',
    href: 'https://github.com/BoziaO/Aether-Pulse/releases/download/v1.0/AetherPulse-v1.0.apk',
    label: 'Pobierz APK',
    primary: false,
  },
  {
    icon: markRaw(Laptop),
    platform: 'Linux',
    meta: 'x64 desktop',
    href: 'https://github.com/BoziaO/Aether-Pulse/releases/download/v1.0/AetherPulse-linux-x64.zip',
    label: 'Pobierz ZIP',
    primary: false,
  },
]

const features = [
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
]
</script>

<template>
  <div class="landing">
    <nav class="nav">
      <a class="brand" href="/">
        <img src="/icons/logo.png" alt="AetherPulse" />
        <span>AetherPulse</span>
      </a>
      <div class="nav-actions">
        <a href="/auth" class="btn ghost">Log in</a>
        <a href="/auth" class="btn solid">Open app</a>
      </div>
    </nav>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Voice, chat and streams for your crew</p>
          <h1>AetherPulse</h1>
          <p class="hero-text">
            Prywatne pokoje głosowe, chat realtime, stream z kamery lub ekranu i wygodny tryb
            Picture-in-Picture na telefonie.
          </p>
          <div class="hero-actions">
            <a :href="downloads[0].href" class="btn solid large" download>
              <Download :size="20" />
              Download Windows
            </a>
            <a href="/auth" class="btn outline large">
              <Globe2 :size="20" />
              Open in browser
            </a>
          </div>
          <div class="hero-pills">
            <span>Android PiP</span>
            <span>Linux build</span>
            <span>WebRTC live</span>
          </div>
        </div>

        <div class="product-panel" aria-label="AetherPulse preview">
          <div class="panel-top">
            <div>
              <span class="panel-label">Live room</span>
              <strong># night-session</strong>
            </div>
            <span class="live-dot">LIVE</span>
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

      <section class="downloads" id="download">
        <div class="section-head">
          <p class="eyebrow">Download</p>
          <h2>Pobierz na swój system</h2>
        </div>
        <div class="download-grid">
          <a
            v-for="item in downloads"
            :key="item.platform"
            :href="item.href"
            class="download-card"
            :class="{ primary: item.primary }"
            download
          >
            <component :is="item.icon" :size="28" />
            <span>
              <strong>{{ item.platform }}</strong>
              <small>{{ item.meta }}</small>
            </span>
            <em>{{ item.label }}</em>
          </a>
        </div>
      </section>

      <section class="features">
        <div class="section-head">
          <p class="eyebrow">Features</p>
          <h2>Komunikacja, która działa też na telefonie</h2>
        </div>
        <div class="features-grid">
          <article v-for="feature in features" :key="feature.title" class="feature-card">
            <component :is="feature.icon" :size="24" />
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.desc }}</p>
          </article>
        </div>
      </section>
    </main>

    <footer class="footer">
      <a class="brand" href="/">
        <img src="/icons/logo.png" alt="AetherPulse" />
        <span>AetherPulse</span>
      </a>
      <div class="footer-links">
        <a href="https://github.com/BoziaO/Aether-Pulse" target="_blank" rel="noopener">GitHub</a>
        <a href="/auth">Log in</a>
        <a href="/auth">Register</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.12), transparent 34%),
    linear-gradient(225deg, rgba(6, 182, 212, 0.11), transparent 38%), #070a13;
  color: #e2e8f0;
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
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #f8fafc;
  font-size: 18px;
  font-weight: 800;
  text-decoration: none;
}

.brand img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.nav-actions,
.hero-actions,
.footer-links {
  display: flex;
  align-items: center;
  gap: 12px;
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
    transform 0.18s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn.solid {
  background: linear-gradient(135deg, #8b5cf6, #2563eb);
  box-shadow: 0 14px 34px rgba(37, 99, 235, 0.22);
}

.btn.outline,
.btn.ghost {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn.ghost {
  color: #cbd5e1;
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
  min-height: calc(100svh - 72px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 480px);
  align-items: center;
  gap: 48px;
  padding: 48px 0 72px;
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
}

.hero-text {
  max-width: 620px;
  margin-top: 24px;
  color: #b6c2d4;
  font-size: clamp(17px, 2vw, 22px);
  line-height: 1.55;
}

.hero-actions {
  margin-top: 34px;
  flex-wrap: wrap;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
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
.feature-card,
.download-card {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(13, 16, 23, 0.72);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(20px);
}

.product-panel {
  border-radius: 8px;
  padding: 16px;
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
  padding: 48px 0;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.section-head h2 {
  max-width: 680px;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.08;
  letter-spacing: 0;
}

.download-grid,
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.download-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  min-height: 126px;
  padding: 20px;
  border-radius: 8px;
  color: #e2e8f0;
  text-decoration: none;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

.download-card:hover {
  transform: translateY(-2px);
  border-color: rgba(103, 232, 249, 0.42);
}

.download-card.primary {
  background: rgba(37, 99, 235, 0.18);
}

.download-card strong,
.download-card small,
.download-card em {
  display: block;
}

.download-card strong {
  font-size: 18px;
}

.download-card small {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 13px;
}

.download-card em {
  grid-column: 1 / -1;
  align-self: end;
  color: #67e8f9;
  font-size: 13px;
  font-style: normal;
  font-weight: 800;
}

.features-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.feature-card {
  min-height: 164px;
  padding: 22px;
  border-radius: 8px;
}

.feature-card svg {
  color: #67e8f9;
}

.feature-card h3 {
  margin-top: 16px;
  color: #f8fafc;
  font-size: 18px;
}

.feature-card p {
  margin-top: 10px;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.55;
}

.footer {
  padding: 32px 0 42px;
  color: #64748b;
}

.footer-links a {
  color: #94a3b8;
  font-size: 14px;
  text-decoration: none;
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
  }

  .download-grid,
  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .nav,
  .footer,
  main {
    width: min(100% - 24px, 1180px);
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

  .hero-actions,
  .hero-actions .btn {
    width: 100%;
  }

  .hero-pills span {
    flex: 1 1 auto;
    text-align: center;
  }

  .section-head {
    display: block;
  }

  .downloads,
  .features {
    padding: 34px 0;
  }

  .footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
