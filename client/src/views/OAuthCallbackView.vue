<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { Loader2, AlertCircle } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const error = ref('')
  const loading = ref(true)

  onMounted(async () => {
    const code = route.query.code as string
    const provider = route.query.provider as string

    if (!code || !provider) {
      error.value = 'Brakujący parametr OAuth'
      loading.value = false
      return
    }

    try {
      await auth.handleOAuthCallback(provider, code)
      router.push('/app')
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Weryfikacja OAuth nie powiodła się'
      loading.value = false
    }
  })
</script>

<template>
  <div class="oauth-page">
    <div class="oauth-card card glass">
      <template v-if="loading">
        <Loader2 class="spin" :size="32" />
        <p>Weryfikacja tożsamości...</p>
      </template>
      <template v-else-if="error">
        <AlertCircle :size="32" class="oauth-error-icon" />
        <h2>Błąd OAuth</h2>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="router.push('/auth')">Powrót do logowania</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.oauth-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.oauth-card {
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  min-width: 320px;
}

.oauth-error-icon {
  color: var(--danger);
}

.oauth-card h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.oauth-card p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.spin {
  color: var(--accent-violet);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
