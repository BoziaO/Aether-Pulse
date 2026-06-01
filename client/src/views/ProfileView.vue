<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  AtSign,
  Check,
  Circle,
  EyeOff,
  Image,
  Link,
  MapPin,
  MessageSquare,
  Palette,
  RotateCcw,
  Save,
  UserRound,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import UserAvatar from '@/components/profile/UserAvatar.vue'
import GradientPicker from '@/components/profile/GradientPicker.vue'
import type { User } from '@/types/user.types'
import { userApi } from '@/services/api/user.api'

type ProfileStatus = User['status']
type EditorTab = 'identity' | 'appearance' | 'presence'

const auth = useAuthStore()
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const activeTab = ref<EditorTab>('identity')
const uploadingAvatar = ref(false)
const uploadingBanner = ref(false)

const emptyUser: User = {
  id: 0,
  username: 'username',
  displayName: 'Display Name',
  avatarUrl: null,
  bannerUrl: null,
  bio: null,
  pronouns: null,
  website: null,
  location: null,
  status: 'offline',
  customStatus: null,
  accentColor: '#8b5cf6',
  profileGradient: null,
  badges: [],
  createdAt: new Date().toISOString(),
}

const initialUser = computed(() => auth.user ?? emptyUser)

const form = reactive({
  displayName: '',
  bio: '',
  pronouns: '',
  website: '',
  location: '',
  customStatus: '',
  avatarUrl: '',
  bannerUrl: '',
  accentColor: '#8b5cf6',
  profileGradient: null as string | null,
  status: 'offline' as ProfileStatus,
})

function syncFormFromUser() {
  const user = initialUser.value
  if (!user.id) return
  form.displayName = user.displayName
  form.bio = user.bio ?? ''
  form.pronouns = user.pronouns ?? ''
  form.website = user.website ?? ''
  form.location = user.location ?? ''
  form.customStatus = user.customStatus ?? ''
  form.avatarUrl = user.avatarUrl ?? ''
  form.bannerUrl = user.bannerUrl ?? ''
  form.accentColor = user.accentColor ?? '#8b5cf6'
  form.profileGradient = user.profileGradient
  form.status = user.status
}

watch(initialUser, syncFormFromUser, { immediate: true })

const TABS: Array<{ value: EditorTab; label: string; icon: typeof UserRound }> = [
  { value: 'identity', label: 'Profile', icon: UserRound },
  { value: 'appearance', label: 'Style', icon: Palette },
  { value: 'presence', label: 'Presence', icon: MessageSquare },
]

const STATUSES: Array<{ value: ProfileStatus; label: string; detail: string; icon: typeof Circle }> = [
  { value: 'online', label: 'Online', detail: 'Visible and ready', icon: Circle },
  { value: 'away', label: 'Idle', detail: 'Shown as away', icon: Circle },
  { value: 'busy', label: 'Do Not Disturb', detail: 'Red status badge', icon: Circle },
  { value: 'offline', label: 'Invisible', detail: 'Appear offline', icon: EyeOff },
]

const previewUser = computed<User>(() => ({
  ...emptyUser,
  ...initialUser.value,
  displayName: form.displayName.trim() || 'Display Name',
  avatarUrl: cleanNullable(form.avatarUrl),
  bannerUrl: cleanNullable(form.bannerUrl),
  bio: cleanNullable(form.bio),
  pronouns: cleanNullable(form.pronouns),
  website: cleanNullable(form.website),
  location: cleanNullable(form.location),
  customStatus: cleanNullable(form.customStatus),
  accentColor: form.accentColor,
  profileGradient: form.profileGradient,
  status: form.status,
}))

const normalizedWebsite = computed(() => {
  const website = form.website.trim()
  if (!website) return ''
  return /^https?:\/\//i.test(website) ? website : `https://${website}`
})

const cardStyle = computed(() => {
  if (form.profileGradient) return { background: form.profileGradient }
  return { background: `linear-gradient(135deg, ${form.accentColor}, #3b82f6)` }
})

const bannerStyle = computed(() => {
  if (form.bannerUrl.trim()) {
    return { backgroundImage: `url(${form.bannerUrl.trim()})` }
  }
  // Banner: gradient or solid color (Discord-like)
  if (form.profileGradient) return { background: form.profileGradient }
  return { background: form.accentColor }
})

const dirty = computed(() => {
  const user = initialUser.value
  return (
    form.displayName !== user.displayName ||
    form.bio !== (user.bio ?? '') ||
    form.pronouns !== (user.pronouns ?? '') ||
    form.website !== (user.website ?? '') ||
    form.location !== (user.location ?? '') ||
    form.customStatus !== (user.customStatus ?? '') ||
    form.avatarUrl !== (user.avatarUrl ?? '') ||
    form.bannerUrl !== (user.bannerUrl ?? '') ||
    form.accentColor !== (user.accentColor ?? '#8b5cf6') ||
    form.profileGradient !== user.profileGradient ||
    form.status !== user.status
  )
})

function cleanNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function resetForm() {
  const user = initialUser.value
  form.displayName = user.displayName
  form.bio = user.bio ?? ''
  form.pronouns = user.pronouns ?? ''
  form.website = user.website ?? ''
  form.location = user.location ?? ''
  form.customStatus = user.customStatus ?? ''
  form.avatarUrl = user.avatarUrl ?? ''
  form.bannerUrl = user.bannerUrl ?? ''
  form.accentColor = user.accentColor ?? '#8b5cf6'
  form.profileGradient = user.profileGradient
  form.status = user.status
  error.value = ''
}

function validateForm() {
  if (!form.displayName.trim()) return 'Display name is required.'
  if (form.website.trim()) {
    try {
      new URL(normalizedWebsite.value)
    } catch {
      return 'Website must be a valid URL.'
    }
  }
  return ''
}

async function save() {
  const validationError = validateForm()
  if (validationError) {
    error.value = validationError
    return
  }

  saving.value = true
  error.value = ''

  try {
    await auth.updateProfile({
      displayName: form.displayName.trim(),
      bio: cleanNullable(form.bio),
      pronouns: cleanNullable(form.pronouns),
      website: cleanNullable(normalizedWebsite.value),
      location: cleanNullable(form.location),
      customStatus: cleanNullable(form.customStatus),
      avatarUrl: cleanNullable(form.avatarUrl),
      bannerUrl: cleanNullable(form.bannerUrl),
      accentColor: form.accentColor,
      profileGradient: form.profileGradient,
      status: form.status,
    })
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 2200)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save profile.'
  } finally {
    saving.value = false
  }
}

async function handleAvatarFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !auth.user) return
  uploadingAvatar.value = true
  error.value = ''
  try {
    const dataUrl = await fileToDataUrl(file)
    const res = await userApi.uploadAvatar(auth.user.id, dataUrl)
    form.avatarUrl = res.avatarUrl
    // keep auth store in sync so other UI updates immediately
    auth.user.avatarUrl = res.avatarUrl
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to upload avatar.'
  } finally {
    uploadingAvatar.value = false
    input.value = ''
  }
}

async function handleBannerFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !auth.user) return
  uploadingBanner.value = true
  error.value = ''
  try {
    const dataUrl = await fileToDataUrl(file)
    const res = await userApi.uploadBanner(auth.user.id, dataUrl)
    form.bannerUrl = res.bannerUrl
    auth.user.bannerUrl = res.bannerUrl
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to upload banner.'
  } finally {
    uploadingBanner.value = false
    input.value = ''
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}
</script>

<template>
  <div class="profile-view">
    <div class="profile-editor">
      <div class="page-header">
        <div>
          <h1>Edit Profile</h1>
          <p>Customize how your profile appears across rooms.</p>
        </div>
        <div class="header-actions">
          <button class="btn-ghost" :disabled="!dirty || saving" @click="resetForm">
            <RotateCcw :size="15" />
            Reset
          </button>
          <button class="btn-primary save-btn" :disabled="saving || !dirty" @click="save">
            <Check v-if="saved" :size="15" />
            <Save v-else :size="15" />
            {{ saved ? 'Saved' : saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="editor-tabs" role="tablist" aria-label="Profile editor sections">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          class="tab-button"
          :class="{ active: activeTab === tab.value }"
          type="button"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </button>
      </div>

      <section v-if="activeTab === 'identity'" class="form-section">
        <div class="section-title">
          <UserRound :size="17" />
          <h2>Profile Details</h2>
        </div>

        <div class="form-row">
          <div>
            <label class="label" for="display-name">Display Name</label>
            <input id="display-name" v-model="form.displayName" class="input" maxlength="32" />
          </div>
          <div>
            <label class="label" for="pronouns">Pronouns</label>
            <input id="pronouns" v-model="form.pronouns" class="input" placeholder="they/them" maxlength="40" />
          </div>
        </div>

        <div>
          <div class="label-row">
            <label class="label" for="bio">About Me</label>
            <span>{{ form.bio.length }}/190</span>
          </div>
          <textarea
            id="bio"
            v-model="form.bio"
            class="input textarea"
            placeholder="Tell people what you are into..."
            maxlength="190"
          />
        </div>

        <div class="form-row">
          <div>
            <label class="label" for="website">Website</label>
            <div class="input-with-icon">
              <Link :size="15" />
              <input id="website" v-model="form.website" placeholder="example.com" maxlength="120" />
            </div>
          </div>
          <div>
            <label class="label" for="location">Location</label>
            <div class="input-with-icon">
              <MapPin :size="15" />
              <input id="location" v-model="form.location" placeholder="Warsaw" maxlength="40" />
            </div>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'appearance'" class="form-section">
        <div class="section-title">
          <Palette :size="17" />
          <h2>Profile Style</h2>
        </div>

        <div>
          <label class="label">Avatar</label>
          <div class="upload-row">
            <UserAvatar :user="previewUser" :size="44" />
            <label class="btn-ghost upload-btn">
              <input type="file" accept="image/*" class="file-input" @change="handleAvatarFile" />
              {{ uploadingAvatar ? 'Uploading...' : 'Upload avatar' }}
            </label>
            <button class="icon-button" type="button" title="Remove avatar" @click="form.avatarUrl = ''">
              <X :size="15" />
            </button>
          </div>
          <div class="hint">PNG/JPG/WebP/GIF, max 6MB. Saved on the server.</div>
        </div>

        <div>
          <label class="label">Banner</label>
          <div class="upload-row">
            <div class="banner-preview" :style="bannerStyle" />
            <label class="btn-ghost upload-btn">
              <input type="file" accept="image/*" class="file-input" @change="handleBannerFile" />
              {{ uploadingBanner ? 'Uploading...' : 'Upload banner' }}
            </label>
            <button class="icon-button" type="button" title="Remove banner image" @click="form.bannerUrl = ''">
              <X :size="15" />
            </button>
          </div>
          <div class="hint">If no banner image is set, your accent color or profile gradient is used.</div>
        </div>

        <div class="color-field">
          <label class="label" for="accent-color">Accent Color</label>
          <div class="color-row">
            <input id="accent-color" v-model="form.accentColor" type="color" class="color-input" />
            <span>{{ form.accentColor }}</span>
          </div>
        </div>

        <div>
          <label class="label">Profile Gradient</label>
          <GradientPicker v-model="form.profileGradient" />
        </div>
      </section>

      <section v-if="activeTab === 'presence'" class="form-section">
        <div class="section-title">
          <MessageSquare :size="17" />
          <h2>Status</h2>
        </div>

        <div class="status-grid">
          <button
            v-for="status in STATUSES"
            :key="status.value"
            class="status-option"
            :class="[status.value, { active: form.status === status.value }]"
            type="button"
            @click="form.status = status.value"
          >
            <component :is="status.icon" :size="15" />
            <span>
              <strong>{{ status.label }}</strong>
              <small>{{ status.detail }}</small>
            </span>
          </button>
        </div>

        <div>
          <div class="label-row">
            <label class="label" for="custom-status">Custom Status</label>
            <span>{{ form.customStatus.length }}/128</span>
          </div>
          <input
            id="custom-status"
            v-model="form.customStatus"
            class="input"
            placeholder="What are you up to?"
            maxlength="128"
          />
        </div>
      </section>
    </div>

    <aside class="profile-preview">
      <h2 class="preview-title">Live Preview</h2>
      <div class="discord-card">
        <div class="card-banner" :style="bannerStyle" />
        <div class="card-shell">
          <div class="avatar-row">
            <UserAvatar :user="previewUser" :size="86" />
            <div v-if="auth.user?.badges?.length" class="badge-row">
              <span v-for="badge in auth.user.badges" :key="badge" class="badge badge-violet">{{ badge }}</span>
            </div>
          </div>

          <div class="name-block">
            <h3>{{ previewUser.displayName }}</h3>
            <p><AtSign :size="13" />{{ previewUser.username }}</p>
          </div>

          <div v-if="previewUser.customStatus" class="custom-status">
            {{ previewUser.customStatus }}
          </div>

          <div v-if="previewUser.bio || previewUser.pronouns" class="preview-section">
            <h4>About Me</h4>
            <p v-if="previewUser.bio">{{ previewUser.bio }}</p>
            <span v-if="previewUser.pronouns" class="pronouns">{{ previewUser.pronouns }}</span>
          </div>

          <div v-if="previewUser.website || previewUser.location" class="profile-links">
            <a v-if="previewUser.website" :href="normalizedWebsite" target="_blank" rel="noreferrer">
              <Link :size="14" />
              Website
            </a>
            <span v-if="previewUser.location">
              <MapPin :size="14" />
              {{ previewUser.location }}
            </span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.profile-view {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 680px) 340px;
  gap: 28px;
  padding: 32px;
  overflow-y: auto;
  background: var(--bg-primary);
}

.profile-editor {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.page-header h1 {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 750;
}

.page-header p {
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-btn {
  min-width: 98px;
}

.error-msg {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-size: 13px;
  padding: 10px 12px;
}

.editor-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tab-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
}

.tab-button:hover,
.tab-button.active {
  border-color: var(--border-accent);
  color: var(--text-primary);
  background: var(--bg-hover);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface);
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.section-title h2 {
  font-size: 14px;
  font-weight: 750;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.label-row .label {
  margin-bottom: 0;
}

.label-row span {
  color: var(--text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.45;
}

.input-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  gap: 8px;
}

.input-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-muted);
  padding: 0 12px;
}

.input-with-icon:focus-within {
  border-color: var(--accent-violet);
  box-shadow: 0 0 0 2px rgba(124, 90, 240, 0.15);
}

.input-with-icon input {
  min-width: 0;
  width: 100%;
  height: 40px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
}

.input-with-icon input::placeholder {
  color: var(--text-muted);
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
}

.icon-button:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-btn {
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
}

.upload-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.file-input { display: none; }

.banner-preview {
  width: 88px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.color-field {
  max-width: 230px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
}

.color-input {
  width: 48px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px;
  background: var(--bg-surface-2);
  cursor: pointer;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 10px 12px;
  text-align: left;
}

.status-option strong,
.status-option small {
  display: block;
}

.status-option strong {
  color: var(--text-primary);
  font-size: 13px;
}

.status-option small {
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 2px;
}

.status-option.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.11);
}

.status-option.online svg {
  fill: #23a55a;
  color: #23a55a;
}

.status-option.away svg {
  fill: #f0b232;
  color: #f0b232;
}

.status-option.busy svg {
  fill: #f23f42;
  color: #f23f42;
}

.status-option.offline svg {
  color: #80848e;
}

.profile-preview {
  position: sticky;
  top: 24px;
  align-self: start;
}

.preview-title {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.discord-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #111318;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
}

.card-banner {
  height: 112px;
  background-size: cover;
  background-position: center;
}

.card-shell {
  padding: 0 18px 18px;
}

.avatar-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 52px;
}

.avatar-row :deep(.avatar-wrap) {
  margin-top: -43px;
  border: 6px solid #111318;
  border-radius: 50%;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
  padding-bottom: 8px;
}

.name-block {
  margin-top: 10px;
}

.name-block h3 {
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.name-block p {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 2px;
}

.custom-status {
  margin-top: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
  padding: 8px 10px;
  overflow-wrap: anywhere;
}

.preview-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.preview-section h4 {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.preview-section p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  margin-top: 7px;
  overflow-wrap: anywhere;
}

.pronouns {
  display: inline-block;
  margin-top: 8px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.14);
  color: #c4b5fd;
  font-size: 12px;
  padding: 4px 9px;
}

.profile-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 15px;
}

.profile-links a,
.profile-links span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: none;
}

.profile-links a:hover {
  color: var(--accent-blue);
}

@media (max-width: 980px) {
  .profile-view {
    grid-template-columns: 1fr;
  }

  .profile-preview {
    position: static;
    max-width: 420px;
  }
}

@media (max-width: 640px) {
  .profile-view {
    padding: 20px;
  }

  .page-header,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-row,
  .status-grid,
  .editor-tabs {
    grid-template-columns: 1fr;
  }
}
</style>
