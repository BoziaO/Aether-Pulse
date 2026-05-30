<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Camera, Save } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import UserAvatar from '@/components/profile/UserAvatar.vue'
import GradientPicker from '@/components/profile/GradientPicker.vue'

const auth = useAuthStore()
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const form = reactive({
  displayName: auth.user?.displayName || '',
  bio: auth.user?.bio || '',
  customStatus: auth.user?.customStatus || '',
  avatarUrl: auth.user?.avatarUrl || '',
  bannerUrl: auth.user?.bannerUrl || '',
  accentColor: auth.user?.accentColor || '#8b5cf6',
  profileGradient: auth.user?.profileGradient || null as string | null,
  status: auth.user?.status || 'online',
})

const previewUser = computed(() => ({ ...auth.user!, ...form }))

const cardStyle = computed(() => {
  if (form.profileGradient) return { background: form.profileGradient }
  return { background: `linear-gradient(135deg, ${form.accentColor}33, var(--bg-surface-2))` }
})

const STATUSES = [
  { value: 'online', label: '🟢 Online' },
  { value: 'away',   label: '🟡 Away' },
  { value: 'busy',   label: '🔴 Do Not Disturb' },
  { value: 'offline', label: '⚫ Invisible' },
]

async function save() {
  saving.value = true
  error.value = ''
  try {
    await auth.updateProfile({
      displayName: form.displayName,
      bio: form.bio || null,
      customStatus: form.customStatus || null,
      avatarUrl: form.avatarUrl || null,
      bannerUrl: form.bannerUrl || null,
      accentColor: form.accentColor,
      profileGradient: form.profileGradient,
      status: form.status as any,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="profile-view">
    <div class="profile-editor">
      <div class="page-header">
        <h1>Edit Profile</h1>
        <button class="btn-primary save-btn" :disabled="saving" @click="save">
          <Save :size="14" />
          {{ saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
      <p v-if="error" class="error-msg">{{ error }}</p>

      <section class="form-section">
        <h3>Status</h3>
        <div class="status-grid">
          <button
            v-for="s in STATUSES"
            :key="s.value"
            class="status-option"
            :class="{ active: form.status === s.value }"
            @click="form.status = s.value as any"
          >
            {{ s.label }}
          </button>
        </div>
        <div style="margin-top:12px">
          <label class="label">Custom Status</label>
          <input v-model="form.customStatus" class="input" placeholder="Set a custom status..." maxlength="128" />
        </div>
      </section>

      <section class="form-section">
        <h3>Identity</h3>
        <div class="form-row">
          <div>
            <label class="label">Display Name</label>
            <input v-model="form.displayName" class="input" placeholder="Your display name" maxlength="32" />
          </div>
          <div>
            <label class="label">Avatar URL</label>
            <input v-model="form.avatarUrl" class="input" placeholder="https://..." />
          </div>
        </div>
        <div>
          <label class="label">Bio</label>
          <textarea v-model="form.bio" class="input" style="resize:vertical;min-height:80px" placeholder="Tell something about yourself..." maxlength="190" />
        </div>
      </section>

      <section class="form-section">
        <h3>Profile Style</h3>
        <div>
          <label class="label">Banner URL</label>
          <input v-model="form.bannerUrl" class="input" placeholder="https://..." />
        </div>
        <div>
          <label class="label">Accent Color</label>
          <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
            <input type="color" v-model="form.accentColor" class="color-input" />
            <span style="font-size:13px;color:var(--text-muted);font-family:monospace">{{ form.accentColor }}</span>
          </div>
        </div>
        <div>
          <label class="label" style="margin-top:16px;display:block">Profile Gradient</label>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Applied to your profile card background</p>
          <GradientPicker v-model="form.profileGradient" />
        </div>
      </section>
    </div>

    <div class="profile-preview">
      <h3 class="preview-title">Preview</h3>
      <div class="profile-card">
        <div class="card-banner" :style="form.bannerUrl ? { backgroundImage: `url(${form.bannerUrl})` } : cardStyle" />
        <div class="card-body">
          <div class="card-avatar-wrap">
            <UserAvatar :user="previewUser" :size="72" />
          </div>
          <div class="card-info">
            <div class="card-name">{{ form.displayName || 'Display Name' }}</div>
            <div class="card-username">@{{ auth.user?.username }}</div>
            <div v-if="form.customStatus" class="card-status">{{ form.customStatus }}</div>
            <div v-if="form.bio" class="card-bio">{{ form.bio }}</div>
            <div v-if="auth.user?.badges?.length" class="card-badges">
              <span v-for="b in auth.user.badges" :key="b" class="badge badge-violet">{{ b }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  flex: 1;
  display: flex;
  gap: 32px;
  padding: 32px;
  overflow-y: auto;
  background: var(--bg-primary);
}
.profile-editor { flex: 1; max-width: 600px; display: flex; flex-direction: column; gap: 24px; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-header h1 { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.save-btn { gap: 6px; }
.error-msg { font-size: 13px; color: var(--danger); background: rgba(239,68,68,0.1); border-radius: 8px; padding: 10px 14px; }
.form-section {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-section h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.status-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.status-option {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.status-option:hover { background: var(--bg-hover); }
.status-option.active { background: rgba(139, 92, 246, 0.15); border-color: var(--border-accent); color: var(--accent-violet); }
.color-input {
  width: 44px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px;
  background: var(--bg-surface);
  cursor: pointer;
}
.profile-preview { width: 280px; flex-shrink: 0; }
.preview-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 14px; }
.profile-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
.card-banner {
  height: 80px;
  background-size: cover;
  background-position: center;
  background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
}
.card-body { padding: 0 16px 16px; }
.card-avatar-wrap {
  margin-top: -36px;
  margin-bottom: 10px;
  position: relative;
}
.card-avatar-wrap :deep(.avatar-wrap) {
  border: 4px solid var(--bg-surface);
}
.card-name { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.card-username { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.card-status {
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 8px;
}
.card-bio { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px; }
.card-badges { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
