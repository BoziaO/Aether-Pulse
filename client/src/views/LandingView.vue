<script setup lang="ts">
const DOWNLOAD_URL = 'https://github.com/BoziaO/Aether-Pulse/releases/download/v1.0/AetherPulse-setup-v1.0.exe'

const features = [
  {
    icon: '🎙️',
    title: 'Spatial Audio',
    desc: 'WebRTC voice calls with localized spatial audio for natural team conversations.',
  },
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    desc: 'Group rooms and direct messages with editing, replies, and typing indicators.',
  },
  {
    icon: '🖥️',
    title: 'Screen Sharing',
    desc: 'Share your screen in any call — gaming, movie or standard quality.',
  },
  {
    icon: '🎨',
    title: 'Custom Themes',
    desc: 'Glassmorphism UI with six themes: Dark, Light, Neon Cyber, Sakura and more.',
  },
  {
    icon: '🛡️',
    title: 'Secure by Default',
    desc: 'JWT auth, strict CORS, rate limiting and atomic database transactions.',
  },
  {
    icon: '⚡',
    title: 'Desktop App',
    desc: 'Native Electron app for Windows with full feature parity and screen capture.',
  },
]
</script>

<template>
  <div class="landing">
    <!-- Nav -->
    <nav class="nav">
      <div class="nav-inner">
        <a class="nav-logo" href="/">
          <img src="/icons/logo.png" alt="AetherPulse" />
          <span>AetherPulse</span>
        </a>
        <div class="nav-actions">
          <a href="/auth" class="btn-ghost">Log In</a>
          <a href="/auth" class="btn-primary">Open App</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />
      <div class="hero-glow hero-glow-3" />

      <div class="hero-inner">
        <div class="hero-badge">✨ Free &amp; Open Source</div>
        <h1 class="hero-title">
          Your private<br />
          <span class="gradient-text">digital space</span>
        </h1>
        <p class="hero-subtitle">
          Real-time messaging, spatial audio calls and screen sharing — all in one beautiful,
          secure platform.
        </p>

        <div class="hero-cta">
          <a :href="DOWNLOAD_URL" class="btn-primary btn-lg" download>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download for Windows
          </a>
          <a href="/auth" class="btn-outline btn-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Open in Browser
          </a>
        </div>

        <p class="hero-note">Windows 10+ · No account required to browse</p>
      </div>

      <!-- App preview mockup -->
      <div class="hero-preview">
        <div class="preview-window">
          <div class="preview-titlebar">
            <span class="dot red" /><span class="dot yellow" /><span class="dot green" />
            <span class="preview-title">AetherPulse</span>
          </div>
          <div class="preview-body">
            <div class="preview-sidebar">
              <div class="preview-logo-small" />
              <div class="preview-room active" />
              <div class="preview-room" />
              <div class="preview-room" />
              <div class="preview-room" />
            </div>
            <div class="preview-main">
              <div class="preview-header">
                <div class="preview-channel"># general</div>
              </div>
              <div class="preview-messages">
                <div class="preview-msg">
                  <div class="preview-avatar a1" />
                  <div class="preview-lines">
                    <div class="preview-line w70" />
                    <div class="preview-line w50" />
                  </div>
                </div>
                <div class="preview-msg">
                  <div class="preview-avatar a2" />
                  <div class="preview-lines">
                    <div class="preview-line w90" />
                    <div class="preview-line w40" />
                  </div>
                </div>
                <div class="preview-msg">
                  <div class="preview-avatar a3" />
                  <div class="preview-lines">
                    <div class="preview-line w60" />
                  </div>
                </div>
              </div>
              <div class="preview-input" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="section-inner">
        <div class="section-label">Features</div>
        <h2 class="section-title">Everything you need,<br />nothing you don't</h2>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-icon">{{ f.icon }}</div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Download CTA -->
    <section class="download-cta">
      <div class="section-inner cta-inner">
        <div class="cta-glow" />
        <div class="cta-content">
          <h2>Ready to get started?</h2>
          <p>Download the desktop app or jump straight into the browser — it's free.</p>
          <div class="cta-buttons">
            <a :href="DOWNLOAD_URL" class="btn-primary btn-lg" download>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download for Windows
            </a>
            <a href="/auth" class="btn-outline btn-lg">Open in Browser →</a>
          </div>
          <div class="platform-badges">
            <span class="badge">🪟 Windows 10+</span>
            <span class="badge">🌐 Any Browser</span>
            <span class="badge">🔒 End-to-End Secure</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <a class="nav-logo" href="/">
          <img src="/icons/logo.png" alt="AetherPulse" />
          <span>AetherPulse</span>
        </a>
        <div class="footer-links">
          <a href="https://github.com/BoziaO/Aether-Pulse" target="_blank" rel="noopener">GitHub</a>
          <a href="/auth">Log In</a>
          <a href="/auth">Register</a>
        </div>
        <p class="footer-copy">© 2025 AetherPulse · MIT License</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Reset & base ── */
.landing {
  min-height: 100vh;
  background: #070a13;
  color: #e2e8f0;
  font-family: inherit;
  overflow-x: hidden;
}

/* ── Nav ── */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 24px;
  height: 60px;
  backdrop-filter: blur(20px);
  background: rgba(7, 10, 19, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #e2e8f0;
  font-weight: 700;
  font-size: 17px;
}
.nav-logo img { width: 30px; height: 30px; object-fit: contain; }
.nav-actions { display: flex; gap: 12px; align-items: center; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s, transform 0.15s;
}
.btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-lg { padding: 14px 28px; font-size: 16px; border-radius: 12px; }
.btn-ghost {
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  border-radius: 8px;
  transition: color 0.15s;
}
.btn-ghost:hover { color: #e2e8f0; }
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: #e2e8f0;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.btn-outline:hover {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
  transform: translateY(-1px);
}

/* ── Hero ── */
.hero {
  position: relative;
  padding: 140px 24px 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
}
.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.hero-glow-1 {
  width: 600px; height: 400px;
  background: rgba(139, 92, 246, 0.15);
  top: 0; left: 50%;
  transform: translateX(-60%);
}
.hero-glow-2 {
  width: 400px; height: 300px;
  background: rgba(59, 130, 246, 0.1);
  top: 100px; right: 10%;
}
.hero-glow-3 {
  width: 300px; height: 300px;
  background: rgba(6, 182, 212, 0.07);
  bottom: 0; left: 5%;
}
.hero-inner {
  position: relative;
  z-index: 2;
  max-width: 700px;
}
.hero-badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  font-size: 13px;
  color: #a78bfa;
  margin-bottom: 24px;
}
.hero-title {
  font-size: clamp(40px, 6vw, 72px);
  font-weight: 900;
  line-height: 1.1;
  margin: 0 0 20px;
  letter-spacing: -1px;
}
.gradient-text {
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-subtitle {
  font-size: 18px;
  color: #94a3b8;
  line-height: 1.6;
  max-width: 540px;
  margin: 0 auto 36px;
}
.hero-cta { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.hero-note { margin-top: 16px; font-size: 13px; color: #475569; }

/* ── App preview ── */
.hero-preview {
  position: relative;
  z-index: 2;
  margin-top: 64px;
  width: 100%;
  max-width: 820px;
}
.preview-window {
  background: #0d1017;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 40px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(139, 92, 246, 0.15),
    0 0 60px rgba(139, 92, 246, 0.08);
}
.preview-titlebar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #141820;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot.red { background: #ff5f57; }
.dot.yellow { background: #febc2e; }
.dot.green { background: #28c840; }
.preview-title {
  margin-left: 8px;
  font-size: 12px;
  color: #475569;
  flex: 1;
  text-align: center;
}
.preview-body { display: flex; height: 340px; }
.preview-sidebar {
  width: 56px;
  background: #0a0d14;
  border-right: 1px solid rgba(255,255,255,0.05);
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.preview-logo-small {
  width: 32px; height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  margin-bottom: 4px;
}
.preview-room {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  transition: border-radius 0.2s;
}
.preview-room.active {
  background: linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.3));
  border-radius: 12px;
}
.preview-main { flex: 1; display: flex; flex-direction: column; }
.preview-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.01);
}
.preview-channel { font-size: 13px; font-weight: 600; color: #94a3b8; }
.preview-messages { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.preview-msg { display: flex; gap: 10px; align-items: flex-start; }
.preview-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}
.a1 { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
.a2 { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.a3 { background: linear-gradient(135deg, #06b6d4, #0891b2); }
.preview-lines { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; flex: 1; }
.preview-line {
  height: 10px;
  border-radius: 5px;
  background: rgba(255,255,255,0.07);
  animation: shimmer 2s infinite;
}
.w40 { width: 40%; }
.w50 { width: 50%; }
.w60 { width: 60%; }
.w70 { width: 70%; }
.w90 { width: 90%; }
@keyframes shimmer {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
.preview-input {
  margin: 12px 16px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
}

/* ── Features ── */
.features {
  padding: 100px 24px;
  background: linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.03) 50%, transparent 100%);
}
.section-inner { max-width: 1100px; margin: 0 auto; }
.section-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #8b5cf6;
  margin-bottom: 12px;
}
.section-title {
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 56px;
  letter-spacing: -0.5px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.feature-card {
  padding: 28px;
  background: rgba(20, 24, 32, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.feature-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}
.feature-icon { font-size: 32px; margin-bottom: 16px; }
.feature-card h3 { font-size: 17px; font-weight: 700; margin: 0 0 8px; }
.feature-card p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0; }

/* ── Download CTA ── */
.download-cta {
  padding: 100px 24px;
}
.cta-inner {
  position: relative;
  text-align: center;
}
.cta-glow {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 600px; height: 300px;
  background: radial-gradient(ellipse, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
  pointer-events: none;
}
.cta-content { position: relative; z-index: 1; }
.cta-content h2 { font-size: clamp(28px, 4vw, 44px); font-weight: 800; margin: 0 0 16px; }
.cta-content p { font-size: 17px; color: #94a3b8; margin: 0 0 36px; }
.cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }
.platform-badges { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.badge {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  font-size: 13px;
  color: #94a3b8;
}

/* ── Footer ── */
.footer {
  padding: 32px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.footer-links { display: flex; gap: 24px; }
.footer-links a { font-size: 14px; color: #475569; text-decoration: none; transition: color 0.15s; }
.footer-links a:hover { color: #94a3b8; }
.footer-copy { font-size: 13px; color: #334155; margin: 0; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .hero { padding-top: 100px; }
  .hero-cta { flex-direction: column; align-items: center; }
  .cta-buttons { flex-direction: column; align-items: center; }
  .footer-inner { flex-direction: column; align-items: flex-start; }
  .nav-actions .btn-ghost { display: none; }
}
</style>
