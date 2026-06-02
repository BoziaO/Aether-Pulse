<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  AtSign,
  Check,
  Circle,
  EyeOff,
  Globe,
  Image,
  Link,
  Lock,
  MapPin,
  MessageSquare,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  UserRound,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import UserAvatar from '@/components/profile/UserAvatar.vue'
import GradientPicker from '@/components/profile/GradientPicker.vue'
import type { User, SocialLink } from '@/types/user.types'
import { userApi } from '@/services/api/user.api'

type ProfileStatus = User['status']
type EditorTab = 'identity' | 'appearance' | 'presence' | 'privacy'

const ANIMATED_BANNER_PRESETS = [
  { id: 'animated:aurora', name: 'Aurora', preview: 'linear-gradient(135deg, #0f2027, #203a43, #667db6, #7f00ff)' },
  { id: 'animated:neon', name: 'Neon Pulse', preview: 'linear-gradient(135deg, #ff0099, #7928ca, #200122)' },
  { id: 'animated:sunset', name: 'Sunset', preview: 'linear-gradient(135deg, #f093fb, #f5576c, #fda085)' },
  { id: 'animated:ocean', name: 'Ocean', preview: 'linear-gradient(135deg, #0099f7, #00d2ff, #1a1a2e)' },
  { id: 'animated:forest', name: 'Forest', preview: 'linear-gradient(135deg, #11998e, #38ef7d, #134e5e)' },
  { id: 'animated:cosmic', name: 'Cosmic', preview: 'linear-gradient(135deg, #09203f, #7b2ff7, #f107a3)' },
]

const ANIM_CLASSES: Record<string, string> = {
  'animated:aurora': 'banner-aurora',
  'animated:neon': 'banner-neon',
  'animated:sunset': 'banner-sunset',
  'animated:ocean': 'banner-ocean',
  'animated:forest': 'banner-forest',
  'animated:cosmic': 'banner-cosmic',
}

const auth = useAuthStore()
const settingsStore = useSettingsStore()
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const activeTab = ref<EditorTab>('identity')
const uploadingAvatar = ref(false)
const uploadingBanner = ref(false)

const SOCIAL_PLATFORMS = [
  { id: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/yourname' },
  { id: 'github', label: 'GitHub', placeholder: 'https://github.com/yourname' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourname' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourname' },
  { id: 'twitch', label: 'Twitch', placeholder: 'https://twitch.tv/yourname' },
  { id: 'discord', label: 'Discord', placeholder: 'https://discord.gg/invite' },
  { id: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
  { id: 'other', label: 'Other', placeholder: 'https://...' },
]

const TIMEZONES = [
  'UTC',
  'Europe/Warsaw', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
  'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Helsinki',
  'Europe/Moscow', 'Europe/Istanbul',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Mexico_City',
  'America/Buenos_Aires',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Singapore', 'Asia/Dubai',
  'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Jakarta',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos',
]

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
  socialLinks: [],
  timezone: null,
  profilePrivacy: 'public',
  showTimezone: true,
  showLastSeen: true,
  showProfileViews: true,
  preferredTheme: null,
  lastSeenAt: null,
  profileViews: null,
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
  socialLinks: [] as SocialLink[],
  timezone: '',
  profilePrivacy: 'public' as 'public' | 'friends' | 'private',
  showTimezone: true,
  showLastSeen: true,
  showProfileViews: true,
  preferredTheme: '' as string,
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
  form.socialLinks = user.socialLinks ? [...user.socialLinks] : []
  form.timezone = user.timezone ?? ''
  form.profilePrivacy = user.profilePrivacy ?? 'public'
  form.showTimezone = user.showTimezone ?? true
  form.showLastSeen = user.showLastSeen ?? true
  form.showProfileViews = user.showProfileViews ?? true
  form.preferredTheme = user.preferredTheme ?? ''
}

watch(initialUser, syncFormFromUser, { immediate: true })

const TABS: Array<{ value: EditorTab; label: string; icon: typeof UserRound }> = [
  { value: 'identity', label: 'Profile', icon: UserRound },
  { value: 'appearance', label: 'Style', icon: Palette },
  { value: 'presence', label: 'Presence', icon: MessageSquare },
  { value: 'privacy', label: 'Privacy', icon: Shield },
]

const STATUSES: Array<{ value: ProfileStatus; label: string; detail: string; icon: typeof Circle }> = [
  { value: 'online', label: 'Online', detail: 'Visible and ready', icon: Circle },
  { value: 'away', label: 'Idle', detail: 'Shown as away', icon: Circle },
  { value: 'busy', label: 'Do Not Disturb', detail: 'Red status badge', icon: Circle },
  { value: 'offline', label: 'Invisible', detail: 'Appear offline', icon: EyeOff },
]

const PRIVACY_OPTIONS: Array<{ value: 'public' | 'friends' | 'private'; label: string; detail: string; icon: typeof Globe }> = [
  { value: 'public', label: 'Public', detail: 'Anyone can see your profile', icon: Globe },
  { value: 'friends', label: 'Friends Only', detail: 'Only friends see full profile', icon: UserRound },
  { value: 'private', label: 'Private', detail: 'Profile hidden from others', icon: Lock },
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
  socialLinks: form.socialLinks,
  timezone: form.timezone || null,
}))

const normalizedWebsite = computed(() => {
  const website = form.website.trim()
  if (!website) return ''
  return /^https?:\/\//i.test(website) ? website : `https://${website}`
})

const bannerAnimClass = computed(() => {
  if (form.bannerUrl.trim()) return ''
  if (form.profileGradient && ANIM_CLASSES[form.profileGradient]) return ANIM_CLASSES[form.profileGradient]
  return ''
})

const bannerStyle = computed(() => {
  if (form.bannerUrl.trim()) return { backgroundImage: `url(${form.bannerUrl.trim()})` }
  if (form.profileGradient) {
    if (ANIM_CLASSES[form.profileGradient]) return {}
    return { background: form.profileGradient }
  }
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
    form.status !== user.status ||
    JSON.stringify(form.socialLinks) !== JSON.stringify(user.socialLinks ?? []) ||
    form.timezone !== (user.timezone ?? '') ||
    form.profilePrivacy !== (user.profilePrivacy ?? 'public') ||
    form.showTimezone !== (user.showTimezone ?? true) ||
    form.showLastSeen !== (user.showLastSeen ?? true) ||
    form.showProfileViews !== (user.showProfileViews ?? true) ||
    form.preferredTheme !== (user.preferredTheme ?? '')
  )
})

function cleanNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function resetForm() {
  syncFormFromUser()
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
  for (const link of form.socialLinks) {
    if (!link.url.trim()) return 'Social link URL cannot be empty.'
    try {
      new URL(link.url.trim())
    } catch {
      return `Invalid URL for ${link.platform}: ${link.url}`
    }
  }
  return ''
}

function detectTimezone() {
  try {
    form.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {}
}

function addSocialLink() {
  form.socialLinks.push({ platform: 'website', url: '', label: '' })
}

function removeSocialLink(idx: number) {
  form.socialLinks.splice(idx, 1)
}

function getPlatformPlaceholder(platform: string) {
  return SOCIAL_PLATFORMS.find(p => p.id === platform)?.placeholder ?? 'https://...'
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
    const cleanedLinks = form.socialLinks
      .filter(l => l.url.trim())
      .map(l => ({ platform: l.platform, url: l.url.trim(), label: l.label?.trim() || undefined }))

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
      socialLinks: JSON.stringify(cleanedLinks),
      timezone: cleanNullable(form.timezone),
      profilePrivacy: form.profilePrivacy,
      showTimezone: form.showTimezone,
      showLastSeen: form.showLastSeen,
      showProfileViews: form.showProfileViews,
      preferredTheme: form.preferredTheme || null,
    })

    if (form.preferredTheme) {
      settingsStore.applyUserTheme(form.preferredTheme)
    }

    saved.value = true
    setTimeout(() => { saved.value = false }, 2200)
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

      <div class="editor-tabs" role="tablist">
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

        <div class="social-section">
          <div class="section-title-row">
            <label class="label">Social Links</label>
            <button class="btn-ghost btn-sm" type="button" :disabled="form.socialLinks.length >= 6" @click="addSocialLink">
              <Plus :size="13" />
              Add link
            </button>
          </div>

          <div v-if="form.socialLinks.length === 0" class="empty-hint">
            No social links yet. Add one above.
          </div>

          <div v-for="(link, idx) in form.socialLinks" :key="idx" class="social-link-row">
            <select v-model="link.platform" class="select platform-select">
              <option v-for="p in SOCIAL_PLATFORMS" :key="p.id" :value="p.id">{{ p.label }}</option>
            </select>
            <input
              v-model="link.url"
              class="input"
              :placeholder="getPlatformPlaceholder(link.platform)"
            />
            <input
              v-model="link.label"
              class="input label-input"
              placeholder="Label (optional)"
            />
            <button class="icon-button danger" type="button" @click="removeSocialLink(idx)">
              <Trash2 :size="14" />
            </button>
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
          <div class="hint">PNG/JPG/WebP/GIF, max 6MB.</div>
        </div>

        <div>
          <label class="label">Banner</label>
          <div class="upload-row">
            <div class="banner-preview" :class="bannerAnimClass" :style="bannerStyle" />
            <label class="btn-ghost upload-btn">
              <input type="file" accept="image/*" class="file-input" @change="handleBannerFile" />
              {{ uploadingBanner ? 'Uploading...' : 'Upload banner' }}
            </label>
            <button class="icon-button" type="button" title="Remove banner" @click="form.bannerUrl = ''">
              <X :size="15" />
            </button>
          </div>
          <div class="hint">If no image is set, accent color or gradient is used.</div>
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

        <div class="anim-section">
          <label class="label">Animated Banners</label>
          <div class="anim-presets">
            <button
              v-for="preset in ANIMATED_BANNER_PRESETS"
              :key="preset.id"
              type="button"
              class="anim-preset"
              :class="{ active: form.profileGradient === preset.id }"
              :style="{ background: preset.preview }"
              :title="preset.name"
              @click="form.profileGradient = form.profileGradient === preset.id ? null : preset.id"
            >
              <span class="anim-label">{{ preset.name }}</span>
            </button>
          </div>
          <div v-if="form.profileGradient?.startsWith('animated:')" class="hint">
            Click preset again to clear. Animated banners are live in the preview →
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'presence'" class="form-section">
        <div class="section-title">
          <MessageSquare :size="17" />
          <h2>Status & Presence</h2>
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

        <div class="section-divider" />

        <div class="section-title">
          <Palette :size="17" />
          <h2>Interface Theme</h2>
        </div>

        <div class="hint" style="margin-top: -8px;">Choose your preferred theme. It will be applied automatically on login.</div>

        <div class="theme-grid">
          <button
            v-for="theme in settingsStore.AVAILABLE_THEMES"
            :key="theme.id"
            class="theme-option"
            :class="{ active: form.preferredTheme === theme.id }"
            type="button"
            @click="form.preferredTheme = form.preferredTheme === theme.id ? '' : theme.id"
          >
            <div class="theme-swatches">
              <span v-for="color in theme.colors" :key="color" :style="{ background: color }" />
            </div>
            <span>{{ theme.name }}</span>
          </button>
        </div>

        <div class="section-divider" />

        <div class="section-title">
          <Globe :size="17" />
          <h2>Timezone</h2>
        </div>

        <div>
          <label class="label" for="timezone">Your Timezone</label>
          <div class="timezone-row">
            <select id="timezone" v-model="form.timezone" class="select">
              <option value="">— Not set —</option>
              <option v-for="tz in TIMEZONES" :key="tz" :value="tz">{{ tz }}</option>
            </select>
            <button class="btn-ghost btn-sm" type="button" @click="detectTimezone">
              Auto-detect
            </button>
          </div>
          <div class="hint">Shown on your profile if the "Show Timezone" option is enabled.</div>
        </div>
      </section>

      <section v-if="activeTab === 'privacy'" class="form-section">
        <div class="section-title">
          <Shield :size="17" />
          <h2>Profile Visibility</h2>
        </div>

        <div class="privacy-grid">
          <button
            v-for="opt in PRIVACY_OPTIONS"
            :key="opt.value"
            class="privacy-option"
            :class="{ active: form.profilePrivacy === opt.value }"
            type="button"
            @click="form.profilePrivacy = opt.value"
          >
            <component :is="opt.icon" :size="18" />
            <span>
              <strong>{{ opt.label }}</strong>
              <small>{{ opt.detail }}</small>
            </span>
          </button>
        </div>

        <div class="section-divider" />

        <div class="section-title">
          <EyeOff :size="17" />
          <h2>Data Visibility</h2>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">Show Timezone</div>
            <div class="setting-desc">Display your timezone on your profile card</div>
          </div>
          <label class="toggle">
            <input v-model="form.showTimezone" type="checkbox" />
            <span class="toggle-slider" />
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">Show Last Seen</div>
            <div class="setting-desc">Let others see when you were last online</div>
          </div>
          <label class="toggle">
            <input v-model="form.showLastSeen" type="checkbox" />
            <span class="toggle-slider" />
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">Show Profile Views</div>
            <div class="setting-desc">Display how many times your profile has been viewed</div>
          </div>
          <label class="toggle">
            <input v-model="form.showProfileViews" type="checkbox" />
            <span class="toggle-slider" />
          </label>
        </div>
      </section>
    </div>

    <aside class="profile-preview">
      <h2 class="preview-title">Live Preview</h2>
      <div class="discord-card">
        <div class="card-banner" :class="bannerAnimClass" :style="bannerStyle" />
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

          <div v-if="previewUser.socialLinks?.length" class="social-preview">
            <a
              v-for="sl in previewUser.socialLinks"
              :key="sl.platform + sl.url"
              :href="sl.url"
              target="_blank"
              rel="noreferrer"
              class="social-chip"
            >
              <Globe :size="12" />
              {{ sl.label || sl.platform }}
            </a>
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

.save-btn { min-width: 98px; }

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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.section-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
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

.label-row .label { margin-bottom: 0; }

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

.input-with-icon input::placeholder { color: var(--text-muted); }

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
  flex-shrink: 0;
}

.icon-button:hover { color: var(--text-primary); background: var(--bg-hover); }
.icon-button.danger:hover { color: var(--danger); border-color: var(--danger); }

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

.upload-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
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

/* ── Animated banner presets ── */
.anim-section { display: flex; flex-direction: column; gap: 6px; }

.anim-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.anim-preset {
  height: 50px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.15s, transform 0.15s;
  display: flex;
  align-items: flex-end;
  padding: 4px 6px;
}
.anim-preset:hover { transform: scale(1.04); border-color: rgba(255,255,255,0.3); }
.anim-preset.active { border-color: #8b5cf6; }

.anim-label {
  font-size: 10px;
  font-weight: 750;
  color: rgba(255,255,255,0.9);
  text-shadow: 0 1px 3px rgba(0,0,0,0.6);
  line-height: 1;
}

.color-field { max-width: 230px; }

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
.status-option small { display: block; }

.status-option strong { color: var(--text-primary); font-size: 13px; }
.status-option small { color: var(--text-muted); font-size: 12px; margin-top: 2px; }

.status-option.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.11);
}

.status-option.online svg { fill: #23a55a; color: #23a55a; }
.status-option.away svg { fill: #f0b232; color: #f0b232; }
.status-option.busy svg { fill: #f23f42; color: #f23f42; }
.status-option.offline svg { color: #80848e; }

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 550;
  text-align: left;
}

.theme-option.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.11);
  color: var(--text-primary);
}

.theme-swatches {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.theme-swatches span {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
}

.timezone-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.select {
  flex: 1;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-primary);
  font-size: 14px;
  padding: 0 12px;
  outline: none;
  cursor: pointer;
}

.select:focus {
  border-color: var(--accent-violet);
  box-shadow: 0 0 0 2px rgba(124, 90, 240, 0.15);
}

.btn-sm {
  height: 36px;
  padding: 0 12px;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.privacy-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.privacy-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  text-align: center;
}

.privacy-option svg { color: var(--text-muted); }

.privacy-option.active {
  border-color: var(--border-accent);
  background: rgba(139, 92, 246, 0.11);
  color: var(--text-primary);
}

.privacy-option.active svg { color: var(--accent-violet); }

.privacy-option strong { display: block; font-size: 13px; color: var(--text-primary); }
.privacy-option small { display: block; font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
}

.setting-info { flex: 1; }

.setting-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle input { opacity: 0; width: 0; height: 0; }

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--bg-surface-3, #2a2d3a);
  border-radius: 999px;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}

.toggle input:checked + .toggle-slider { background: var(--accent-violet, #8b5cf6); }
.toggle input:checked + .toggle-slider::before { transform: translateX(18px); }

.social-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title-row .label { margin-bottom: 0; }

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  padding: 10px 0;
}

.social-link-row {
  display: grid;
  grid-template-columns: 130px 1fr 120px 38px;
  gap: 8px;
  align-items: center;
}

.platform-select { flex-shrink: 0; }

.label-input { }

.profile-preview {
  position: sticky;
  top: 24px;
  align-self: start;
}

.preview-title {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.discord-card {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-surface);
}

.card-banner {
  height: 110px;
  background-size: cover;
  background-position: center;
}

/* ── Animated banner keyframes ── */
@keyframes banner-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.banner-aurora {
  background: linear-gradient(270deg, #0f2027, #203a43, #667db6, #7f00ff, #2c5364) !important;
  background-size: 300% 300% !important;
  animation: banner-shift 8s ease infinite;
}
.banner-neon {
  background: linear-gradient(270deg, #ff0099, #493240, #7928ca, #ff0080, #200122) !important;
  background-size: 300% 300% !important;
  animation: banner-shift 6s ease infinite;
}
.banner-sunset {
  background: linear-gradient(270deg, #f093fb, #f5576c, #fda085, #ff6a00, #f093fb) !important;
  background-size: 300% 300% !important;
  animation: banner-shift 7s ease infinite;
}
.banner-ocean {
  background: linear-gradient(270deg, #0099f7, #00d2ff, #1a1a2e, #16213e, #0f3460) !important;
  background-size: 300% 300% !important;
  animation: banner-shift 9s ease infinite;
}
.banner-forest {
  background: linear-gradient(270deg, #11998e, #38ef7d, #1a4731, #134e5e, #11998e) !important;
  background-size: 300% 300% !important;
  animation: banner-shift 8s ease infinite;
}
.banner-cosmic {
  background: linear-gradient(270deg, #09203f, #537895, #7b2ff7, #f107a3, #09203f) !important;
  background-size: 300% 300% !important;
  animation: banner-shift 10s ease infinite;
}

.card-shell { padding: 0 16px 16px; }

.avatar-row {
  min-height: 52px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.avatar-row :deep(.avatar-wrap) {
  margin-top: -46px;
  border: 5px solid var(--bg-surface);
  border-radius: 50%;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-bottom: 4px;
}

.badge {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 700;
}

.badge-violet {
  background: rgba(139, 92, 246, 0.18);
  color: #c4b5fd;
}

.name-block { margin-top: 10px; }
.name-block h3 { color: var(--text-primary); font-size: 18px; font-weight: 800; }
.name-block p {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 2px;
}

.custom-status {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.preview-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.preview-section h4 {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.preview-section p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  margin-top: 6px;
}

.pronouns {
  display: inline-block;
  margin-top: 8px;
  background: rgba(139, 92, 246, 0.12);
  color: #c4b5fd;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 999px;
}

.profile-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.profile-links a,
.profile-links span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  text-decoration: none;
}

.profile-links a:hover { color: var(--accent-blue); }

.social-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.social-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 11px;
  text-decoration: none;
}

.social-chip:hover { color: var(--accent-blue); border-color: var(--accent-blue); }
</style>
