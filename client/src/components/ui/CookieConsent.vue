<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { Cookie, X } from 'lucide-vue-next'

  const COOKIE_CONSENT_KEY = 'nicori_cookie_consent'
  const visible = ref(false)

  onMounted(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!stored) {
      visible.value = true
    }
  })

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    visible.value = false
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined')
    visible.value = false
  }
</script>

<template>
  <Transition name="cookie-slide">
    <div v-if="visible" class="cookie-banner">
      <div class="cookie-content">
        <div class="cookie-icon">
          <Cookie :size="20" />
        </div>
        <div class="cookie-text">
          <strong>Pliki cookies</strong>
          <p>
            Używamy niezbędnych plików cookies do działania aplikacji oraz opcjonalnych do
            analityki. Możesz zaakceptować wszystkie lub odrzucić opcjonalne.
          </p>
        </div>
        <div class="cookie-actions">
          <button class="btn-ghost small" @click="decline"><X :size="14" /> Odrzuć</button>
          <button class="btn-primary small" @click="accept">Akceptuj wszystkie</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  padding: 16px 24px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
}
.cookie-content {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.cookie-icon {
  color: var(--accent-violet);
  flex-shrink: 0;
}
.cookie-text {
  flex: 1;
  min-width: 240px;
}
.cookie-text strong {
  display: block;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.cookie-text p {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}
.cookie-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.cookie-actions .btn-ghost {
  font-size: 12px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.cookie-actions .btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.cookie-actions .btn-primary {
  font-size: 12px;
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.cookie-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.cookie-slide-leave-active {
  transition: all 0.25s ease-in;
}
.cookie-slide-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.cookie-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .cookie-banner {
    padding: 12px 16px;
  }
  .cookie-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
