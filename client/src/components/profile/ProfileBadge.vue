<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  badge: string
}>()

const badgeData = computed(() => {
  switch (props.badge) {
    case 'nitro':
      return {
        title: 'Nitro Supporter',
        color: 'linear-gradient(135deg, #ff7300, #ff007f)',
        desc: 'Premium subscriber badge',
      }
    case 'booster':
      return {
        title: 'Server Booster',
        color: 'linear-gradient(135deg, #f43f5e, #ec4899)',
        desc: 'Boosted the community server',
      }
    case 'developer':
      return {
        title: 'Active Developer',
        color: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
        desc: 'Crafted with passion & code',
      }
    case 'staff':
      return {
        title: 'Aether-Pulse Staff',
        color: 'linear-gradient(135deg, #eab308, #ca8a04)',
        desc: 'Official platform administrator',
      }
    case 'bug_hunter':
      return {
        title: 'Bug Hunter',
        color: 'linear-gradient(135deg, #10b981, #059669)',
        desc: 'Discovered and reported critical issues',
      }
    case 'early_supporter':
      return {
        title: 'Early Supporter',
        color: 'linear-gradient(135deg, #a855f7, #7c3aed)',
        desc: 'An original pioneer of Aether-Pulse',
      }
    case 'hypesquad_balance':
      return {
        title: 'HypeSquad Balance',
        color: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        desc: 'Harmony, poise, and calculated execution',
      }
    case 'hypesquad_bravery':
      return {
        title: 'HypeSquad Bravery',
        color: 'linear-gradient(135deg, #f43f5e, #e11d48)',
        desc: 'Fearless, audacious, and bold leadership',
      }
    case 'hypesquad_brilliance':
      return {
        title: 'HypeSquad Brilliance',
        color: 'linear-gradient(135deg, #f97316, #ea580c)',
        desc: 'Illuminating spark of intellect and warmth',
      }
    default:
      return {
        title: 'Verified',
        color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        desc: 'Verified user badge',
      }
  }
})
</script>

<template>
  <div
    class="profile-badge-wrapper"
    :class="`badge-${props.badge}`"
    :data-tooltip="badgeData.title + ': ' + badgeData.desc"
  >
    <!-- Inline high-fidelity SVGs -->
    <svg v-if="props.badge === 'nitro'" viewBox="0 0 24 24" class="svg-badge" fill="none">
      <defs>
        <linearGradient id="nitroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff7300" />
          <stop offset="50%" stop-color="#d946ef" />
          <stop offset="100%" stop-color="#3b82f6" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L2 9l3 11h14l3-11L12 2zm0 4.5l5.5 4-1.5 5.5h-8l-1.5-5.5 5.5-4z"
        fill="url(#nitroGrad)"
      />
      <path d="M12 8.5l3.5 2.5-1 3.5h-5l-1-3.5 3.5-2.5z" fill="#fff" opacity="0.9" />
    </svg>

    <svg v-else-if="props.badge === 'booster'" viewBox="0 0 24 24" class="svg-badge" fill="none">
      <defs>
        <linearGradient id="boosterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e" />
          <stop offset="100%" stop-color="#d946ef" />
        </linearGradient>
      </defs>
      <path d="M12 2l9 4v6c0 5.5-4 10.5-9 12-5-1.5-9-6.5-9-12V6l9-4z" fill="url(#boosterGrad)" />
      <path d="M12 6l5 5-2 2-3-3-3 3-2-2 5-5z" fill="#fff" />
    </svg>

    <svg v-else-if="props.badge === 'developer'" viewBox="0 0 24 24" class="svg-badge" fill="none">
      <defs>
        <linearGradient id="devGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe" />
          <stop offset="100%" stop-color="#4facfe" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="20" height="16" rx="3" fill="url(#devGrad)" />
      <path
        d="M8 10l-3 2 3 2m8-4l3 2-3 2m-5 1l2-6"
        stroke="#fff"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <svg v-else-if="props.badge === 'staff'" viewBox="0 0 24 24" class="svg-badge" fill="none">
      <defs>
        <linearGradient id="staffGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe259" />
          <stop offset="100%" stop-color="#ffa751" />
        </linearGradient>
      </defs>
      <path d="M12 2l3 6 7 1-5 5 1.5 7-6.5-4-6.5 4 1.5-7-5-5 7-1 3-6z" fill="url(#staffGrad)" />
      <circle cx="12" cy="12" r="3" fill="#fff" opacity="0.8" />
    </svg>

    <svg v-else-if="props.badge === 'bug_hunter'" viewBox="0 0 24 24" class="svg-badge" fill="none">
      <defs>
        <linearGradient id="bugGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#11998e" />
          <stop offset="100%" stop-color="#38ef7d" />
        </linearGradient>
      </defs>
      <path
        d="M12 2a4 4 0 014 4v2h2a2 2 0 012 2v6a4 4 0 01-4 4H8a4 4 0 01-4-4v-6a2 2 0 012-2h2V6a4 4 0 014-4zm4 8H8v6a2 2 0 002 2h4a2 2 0 002-2v-6z"
        fill="url(#bugGrad)"
      />
      <path
        d="M6 11l-3-1M6 14l-3 1m15-4l3-1m-3 5l3 1M9 7h6"
        stroke="#fff"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>

    <svg
      v-else-if="props.badge === 'early_supporter'"
      viewBox="0 0 24 24"
      class="svg-badge"
      fill="none"
    >
      <defs>
        <linearGradient id="earlyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b06ab3" />
          <stop offset="100%" stop-color="#4568dc" />
        </linearGradient>
      </defs>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#earlyGrad)"
      />
      <path d="M12 7.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="#fff" />
    </svg>

    <svg
      v-else-if="props.badge === 'hypesquad_balance'"
      viewBox="0 0 24 24"
      class="svg-badge"
      fill="none"
    >
      <defs>
        <linearGradient id="balanceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4e54c8" />
          <stop offset="100%" stop-color="#8f94fb" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#balanceGrad)" />
      <path
        d="M12 6v12M8 9h8M6 14c0-2 2-3 6-3s6 1 6 3"
        stroke="#fff"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>

    <svg
      v-else-if="props.badge === 'hypesquad_bravery'"
      viewBox="0 0 24 24"
      class="svg-badge"
      fill="none"
    >
      <defs>
        <linearGradient id="braveryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff416c" />
          <stop offset="100%" stop-color="#ff4b2b" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#braveryGrad)" />
      <path d="M12 7l4 4h-3v6h-2v-6H8l4-4z" fill="#fff" />
    </svg>

    <svg
      v-else-if="props.badge === 'hypesquad_brilliance'"
      viewBox="0 0 24 24"
      class="svg-badge"
      fill="none"
    >
      <defs>
        <linearGradient id="brillianceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f9d423" />
          <stop offset="100%" stop-color="#ff4e50" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#brillianceGrad)" />
      <path d="M12 6l2 4 5 1-4 4 1 5-4-3-4 3 1-5-4-4 5-1 2-4z" fill="#fff" />
    </svg>
  </div>
</template>

<style scoped>
.profile-badge-wrapper {
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.profile-badge-wrapper:hover {
  transform: scale(1.2) rotate(3deg);
}

.svg-badge {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* Custom micro-animations for key badges */
.badge-nitro:hover .svg-badge {
  animation: nitro-pulse 1s infinite alternate;
}
@keyframes nitro-pulse {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 2px 4px rgba(217, 70, 239, 0.4));
  }
  100% {
    transform: scale(1.1);
    filter: drop-shadow(0 2px 8px rgba(217, 70, 239, 0.8));
  }
}

.badge-booster:hover .svg-badge {
  animation: booster-spin 1.2s infinite ease-in-out;
}
@keyframes booster-spin {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}

/* Lightweight custom CSS tooltip */
.profile-badge-wrapper::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 130%;
  left: 50%;
  transform: translateX(-50%) scale(0.9);
  background: rgba(10, 10, 16, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.profile-badge-wrapper:hover::after {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}
</style>
