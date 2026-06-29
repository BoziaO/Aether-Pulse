<script setup lang="ts">
  import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue'
  import {
    AtSign,
    Check,
    Circle,
    EyeOff,
    Globe,
    Link,
    MapPin,
    MessageSquare,
    Palette,
    UserRound,
    X,
    Sparkles,
    Shield,
    Clock,
    Users,
    BarChart3,
    Heart,
    Zap,
    Hash,
    Coffee,
    Plus,
    Trash2,
    Terminal,
    Loader2,
    AlertCircle,
  } from 'lucide-vue-next'

  import { useAuthStore } from '@/stores/auth.store'
  import UserAvatar from '@/components/profile/UserAvatar.vue'
  import GradientPicker from '@/components/profile/GradientPicker.vue'
  import ProfileBadge from '@/components/profile/ProfileBadge.vue'
  import GlassDropdown from '@/components/ui/GlassDropdown.vue'
  import type { User, SocialLink } from '@/types/user.types'
  import { userApi } from '@/services/api/user.api'

  type ProfileStatus = User['status']
  type EditorTab = 'identity' | 'appearance' | 'social' | 'presence' | 'privacy'
  type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

  const auth = useAuthStore()
  const saveStatus = ref<SaveStatus>('idle')
  const lastError = ref('')
  const activeTab = ref<EditorTab>('identity')
  const uploadingAvatar = ref(false)
  const uploadingBanner = ref(false)
  const mouse = ref({ x: 0, y: 0 })

  let mouseFn: ((e: MouseEvent) => void) | null = null

  onMounted(() => {
    mouseFn = (e: MouseEvent) => {
      mouse.value = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', mouseFn, { passive: true })
  })

  onUnmounted(() => {
    if (mouseFn) window.removeEventListener('mousemove', mouseFn)
  })

  const emptyUser: User = {
    id: '',
    username: 'username',
    email: null,
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
    primaryColor: null,
    displayNameStyle: null,
    profileGradient: null,
    avatarFrame: null,
    profileTheme: null,
    customTheme: null,
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
    richPresence: null,
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
    primaryColor: null as string | null,
    displayNameStyle: null as string | null,
    badges: [] as string[],
    profileGradient: null as string | null,
    status: 'offline' as ProfileStatus,
    avatarFrame: null as string | null,
    profileTheme: 'default' as string | null,
    socialLinks: [] as SocialLink[],
    profilePrivacy: 'public' as 'public' | 'friends' | 'private',
    showTimezone: true,
    showLastSeen: true,
    showProfileViews: true,
    timezone: '',
    richPresence: null as User['richPresence'],
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
    form.primaryColor = user.primaryColor ?? null
    form.displayNameStyle = user.displayNameStyle ?? null
    form.badges = [...(user.badges ?? [])]
    form.profileGradient = user.profileGradient
    form.status = user.status
    form.avatarFrame = user.avatarFrame ?? null
    form.profileTheme = user.profileTheme ?? 'default'
    form.socialLinks = JSON.parse(JSON.stringify(user.socialLinks ?? []))
    form.profilePrivacy = user.profilePrivacy ?? 'public'
    form.showTimezone = user.showTimezone ?? true
    form.showLastSeen = user.showLastSeen ?? true
    form.showProfileViews = user.showProfileViews ?? true
    form.timezone = user.timezone ?? ''
    form.richPresence = user.richPresence ? { ...user.richPresence } : null
  }

  watch(initialUser, syncFormFromUser, { immediate: true })

  const TABS: Array<{ value: EditorTab; label: string; icon: typeof UserRound; count?: number }> = [
    { value: 'identity', label: 'Profile', icon: UserRound },
    { value: 'appearance', label: 'Style', icon: Palette },
    { value: 'social', label: 'Social', icon: Globe },
    { value: 'presence', label: 'Status', icon: MessageSquare },
    { value: 'privacy', label: 'Privacy', icon: Shield },
  ]

  const STATUSES: Array<{
    value: ProfileStatus
    label: string
    detail: string
    color: string
  }> = [
    { value: 'online', label: 'Online', detail: 'Visible and ready', color: '#23a55a' },
    { value: 'away', label: 'Idle', detail: 'Shown as away', color: '#f0b232' },
    { value: 'busy', label: 'Do Not Disturb', detail: 'Red status badge', color: '#f23f42' },
    { value: 'offline', label: 'Invisible', detail: 'Appear offline', color: '#80848e' },
  ]

  const creatorUserId = import.meta.env.VITE_CREATOR_USER_ID || ''
  const isCreator = computed(() => auth.user?.id === creatorUserId)

  const DISPLAY_NAME_STYLES = [
    { value: null, label: 'Default', icon: UserRound },
    { value: 'glow', label: 'Neon Glow', icon: Zap },
    { value: 'rainbow', label: 'Rainbow', icon: Sparkles },
    { value: 'hacker', label: 'Retro Hacker', icon: Terminal },
    { value: 'glitch', label: 'Glitch', icon: Hash },
    { value: 'sparkle', label: 'Luxury', icon: Heart },
  ]

  const SOCIAL_PLATFORMS = [
    { id: 'github', label: 'GitHub', icon: '🐙', placeholder: 'username', prefix: 'https://github.com/' },
    { id: 'twitter', label: 'X / Twitter', icon: '𝕏', placeholder: '@username', prefix: 'https://x.com/' },
    { id: 'youtube', label: 'YouTube', icon: '📺', placeholder: 'channel', prefix: 'https://youtube.com/@' },
    { id: 'twitch', label: 'Twitch', icon: '🎮', placeholder: 'channel', prefix: 'https://twitch.tv/' },
    { id: 'spotify', label: 'Spotify', icon: '🎵', placeholder: 'artist/user', prefix: 'https://open.spotify.com/user/' },
    { id: 'steam', label: 'Steam', icon: '🎯', placeholder: 'steamid', prefix: 'https://steamcommunity.com/id/' },
    { id: 'discord', label: 'Discord', icon: '💬', placeholder: 'username#0000', prefix: '' },
    { id: 'custom', label: 'Custom Link', icon: '🔗', placeholder: 'https://...', prefix: '' },
  ]

  const TIMEZONES = [
    'UTC',
    'Europe/Warsaw',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]

  const ACCENT_COLORS = [
    '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4',
    '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b',
    '#f97316', '#ef4444', '#ec4899', '#d946ef', '#a855f7',
  ]

  const profileCompletion = computed(() => {
    let score = 0
    const checks = [
      form.displayName.trim() !== '' && form.displayName !== 'Display Name',
      form.bio.trim().length > 0,
      form.avatarUrl.trim().length > 0,
      form.bannerUrl.trim().length > 0,
      form.pronouns.trim().length > 0,
      form.website.trim().length > 0,
      form.location.trim().length > 0,
      form.customStatus.trim().length > 0,
      form.socialLinks.length > 0,
      form.accentColor !== '#8b5cf6',
      form.timezone.length > 0,
    ]
    score = checks.filter(Boolean).length
    return Math.round((score / checks.length) * 100)
  })

  const completionLevel = computed(() => {
    const p = profileCompletion.value
    if (p >= 90) return { label: 'Elite', color: '#eab308', emoji: '👑' }
    if (p >= 70) return { label: 'Advanced', color: '#8b5cf6', emoji: '⭐' }
    if (p >= 40) return { label: 'Growing', color: '#3b82f6', emoji: '🌱' }
    return { label: 'Starter', color: '#64748b', emoji: '📝' }
  })

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
    primaryColor: form.primaryColor,
    displayNameStyle: form.displayNameStyle,
    badges: form.badges,
    profileGradient: form.profileGradient,
    status: form.status,
    avatarFrame: form.avatarFrame,
    profileTheme: form.profileTheme,
    socialLinks: form.socialLinks,
  }))

  const normalizedWebsite = computed(() => {
    const website = form.website.trim()
    if (!website) return ''
    return /^https?:\/\//i.test(website) ? website : `https://${website}`
  })

  const bannerStyle = computed(() => {
    if (form.bannerUrl.trim()) {
      return { backgroundImage: `url(${form.bannerUrl.trim()})` }
    }
    if (form.profileGradient) return { background: form.profileGradient }
    return { background: `linear-gradient(135deg, ${form.accentColor}, ${shiftHue(form.accentColor, 40)})` }
  })

  function shiftHue(hex: string, degrees: number): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      else if (max === g) h = ((b - r) / d + 2) / 6
      else h = ((r - g) / d + 4) / 6
    }
    h = ((h * 360 + degrees) % 360) / 360
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p2 = 2 * l - q2
    const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0')
    return `#${toHex(hue2rgb(p2, q2, h + 1 / 3))}${toHex(hue2rgb(p2, q2, h))}${toHex(hue2rgb(p2, q2, h - 1 / 3))}`
  }

  const dirty = computed(() => {
    const u = initialUser.value
    return (
      form.displayName !== u.displayName ||
      form.bio !== (u.bio ?? '') ||
      form.pronouns !== (u.pronouns ?? '') ||
      form.website !== (u.website ?? '') ||
      form.location !== (u.location ?? '') ||
      form.customStatus !== (u.customStatus ?? '') ||
      form.avatarUrl !== (u.avatarUrl ?? '') ||
      form.bannerUrl !== (u.bannerUrl ?? '') ||
      form.accentColor !== (u.accentColor ?? '#8b5cf6') ||
      form.primaryColor !== u.primaryColor ||
      form.displayNameStyle !== u.displayNameStyle ||
      JSON.stringify(form.badges) !== JSON.stringify(u.badges ?? []) ||
      form.profileGradient !== u.profileGradient ||
      form.status !== u.status ||
      form.avatarFrame !== u.avatarFrame ||
      form.profileTheme !== (u.profileTheme ?? 'default') ||
      JSON.stringify(form.socialLinks) !== JSON.stringify(u.socialLinks ?? []) ||
      form.profilePrivacy !== (u.profilePrivacy ?? 'public') ||
      form.showTimezone !== (u.showTimezone ?? true) ||
      form.showLastSeen !== (u.showLastSeen ?? true) ||
      form.showProfileViews !== (u.showProfileViews ?? true) ||
      form.timezone !== (u.timezone ?? '') ||
      JSON.stringify(form.richPresence) !== JSON.stringify(u.richPresence ?? null)
    )
  })

  function cleanNullable(value: string) {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }

  function toggleBadge(badgeId: string) {
    const idx = form.badges.indexOf(badgeId)
    if (idx >= 0) form.badges.splice(idx, 1)
    else form.badges.push(badgeId)
  }

  function toggleRichPresence() {
    if (form.richPresence) {
      form.richPresence = null
    } else {
      form.richPresence = { label: '', details: null, icon: null, startedAt: Date.now() }
    }
  }

  function formatElapsedTime(startedAt: number) {
    const diff = Math.floor((Date.now() - startedAt) / 1000)
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  function addSocialLink() {
    const usedPlatforms = form.socialLinks.map((l) => l.platform)
    const available = SOCIAL_PLATFORMS.find((p) => !usedPlatforms.includes(p.id))
    if (available) {
      form.socialLinks.push({ platform: available.id, url: '', label: '' })
    }
  }

  function removeSocialLink(index: number) {
    form.socialLinks.splice(index, 1)
  }

  function resetForm() {
    syncFormFromUser()
    lastError.value = ''
    saveStatus.value = 'idle'
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
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
      if (link.url.trim()) {
        try {
          if (/^https?:\/\//i.test(link.url)) new URL(link.url)
        } catch {
          return `Invalid URL for ${link.platform}.`
        }
      }
    }
    return ''
  }

  async function performSave() {
    const validationError = validateForm()
    if (validationError) {
      lastError.value = validationError
      saveStatus.value = 'error'
      return
    }

    saveStatus.value = 'saving'
    lastError.value = ''

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
        primaryColor: form.primaryColor,
        displayNameStyle: form.displayNameStyle,
        badges: form.badges,
        profileGradient: form.profileGradient,
        status: form.status,
        avatarFrame: form.avatarFrame,
        profileTheme: form.profileTheme,
        socialLinks: form.socialLinks
          .filter((l) => l.url.trim().length > 0)
          .map((l) => ({ ...l, url: l.url.trim() })),
        profilePrivacy: form.profilePrivacy,
        showTimezone: form.showTimezone,
        showLastSeen: form.showLastSeen,
        showProfileViews: form.showProfileViews,
        timezone: cleanNullable(form.timezone),
        richPresence: form.richPresence,
      })
      saveStatus.value = 'saved'
      setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'idle'
      }, 2200)
    } catch (e: unknown) {
      console.error('[ProfileView] save failed:', e)
      lastError.value = e instanceof Error ? e.message : 'Failed to save profile.'
      saveStatus.value = 'error'
    }
  }

  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
  let isSaving = false

  async function autoSave() {
    if (!dirty.value || isSaving) return
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    autoSaveTimer = setTimeout(async () => {
      if (!dirty.value || isSaving) return
      isSaving = true
      try {
        await performSave()
      } finally {
        isSaving = false
      }
    }, 2000)
  }

  watch(dirty, (isDirty) => {
    if (isDirty) autoSave()
  })

  onUnmounted(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    if (dirty.value && !isSaving) {
      performSave()
    }
  })

  async function handleAvatarFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !auth.user) return
    uploadingAvatar.value = true
    lastError.value = ''
    try {
      const dataUrl = await compressImageIfNeeded(file)
      const res = await userApi.uploadAvatar(auth.user.id, dataUrl)
      form.avatarUrl = res.avatarUrl
      auth.user.avatarUrl = res.avatarUrl
    } catch (e: unknown) {
      lastError.value = e instanceof Error ? e.message : 'Failed to upload avatar.'
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
    lastError.value = ''
    try {
      const dataUrl = await compressImageIfNeeded(file)
      const res = await userApi.uploadBanner(auth.user.id, dataUrl)
      form.bannerUrl = res.bannerUrl
      auth.user.bannerUrl = res.bannerUrl
    } catch (e: unknown) {
      lastError.value = e instanceof Error ? e.message : 'Failed to upload banner.'
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

  function compressImageIfNeeded(file: File): Promise<string> {
    if (file.type === 'image/gif') return fileToDataUrl(file)
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        const MAX = 1000
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
          else { w = Math.round((w * MAX) / h); h = MAX }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas error')); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85))
      }
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Image load error')) }
    })
  }

  const AVATAR_FRAMES = [
    { value: null, label: 'None', detail: 'Classic round border' },
    { value: 'neon-glow', label: 'Neon Glow', detail: 'Electric pink/teal blur' },
    { value: 'rainbow-pulse', label: 'Rainbow Pulse', detail: 'Rotating gradient cycle' },
    { value: 'pixel-retro', label: 'Retro Pixel', detail: 'Chunky terminal borders' },
    { value: 'gold-crown', label: 'Gold Crown', detail: 'Imperial floating crown' },
  ]

  const PROFILE_THEMES = [
    { value: 'default', label: 'Classic Dark', detail: 'Clean dark slate' },
    { value: 'glowing-glass', label: 'Glassmorphism', detail: 'Blur & soft shadows' },
    { value: 'pixel-classic', label: 'Pixel Console', detail: 'Terminal style' },
    { value: 'cyberpunk-grid', label: 'Cyberpunk', detail: 'Neon grid theme' },
  ]

  const memberSince = computed(() => {
    const d = new Date(initialUser.value.createdAt)
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' })
  })

  function getSocialPlatform(id: string) {
    return SOCIAL_PLATFORMS.find((p) => p.id === id) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1]
  }

  function getSocialIcon(platform: string) {
    const icons: Record<string, string> = {
      github: '🐙', twitter: '𝕏', youtube: '📺', twitch: '🎮',
      spotify: '🎵', steam: '🎯', discord: '💬', custom: '🔗',
    }
    return icons[platform] || '🔗'
  }
</script>

<template>
  <div class="profile-view">
    <div class="profile-bg-orbs" aria-hidden="true">
      <div class="profile-orb profile-orb--violet" :style="{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)` }"></div>
      <div class="profile-orb profile-orb--pink" :style="{ transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)` }"></div>
      <div class="profile-orb profile-orb--blue" :style="{ transform: `translate(${mouse.x * 8}px, ${mouse.y * -12}px)` }"></div>
      <div class="profile-orb profile-orb--teal"></div>
    </div>

    <div class="profile-editor">
      <div class="page-header">
        <div>
          <div class="badge badge-violet profile-badge">
            <Sparkles :size="12" />
            Profil
          </div>
          <h1 class="profile-title">Edytuj profil</h1>
          <p class="profile-desc">Dostosuj wygląd swojego profilu we wszystkich pokojach</p>
        </div>
        <div class="header-actions">
          <Transition name="fade" mode="out-in">
            <div v-if="saveStatus === 'saving'" class="save-status saving">
              <Loader2 :size="14" class="spin" />
              Saving...
            </div>
            <div v-else-if="saveStatus === 'saved'" class="save-status saved">
              <Check :size="14" />
              Saved
            </div>
            <div v-else-if="saveStatus === 'error'" class="save-status error" @click="lastError = ''; saveStatus = 'idle'">
              <AlertCircle :size="14" />
              Error — click to dismiss
            </div>
            <div v-else-if="dirty" class="save-status pending">
              Unsaved changes
            </div>
          </Transition>
          <button v-if="dirty" class="btn btn-ghost" @click="resetForm">
            Discard
          </button>
        </div>
      </div>

      <Transition name="fade">
        <p v-if="lastError" class="error-msg">{{ lastError }}</p>
      </Transition>

      <div class="completion-bar-wrap">
        <div class="completion-info">
          <span class="completion-emoji">{{ completionLevel.emoji }}</span>
          <span class="completion-label">Profil: <strong>{{ completionLevel.label }}</strong></span>
          <span class="completion-pct">{{ profileCompletion }}%</span>
        </div>
        <div class="completion-track">
          <div
            class="completion-fill"
            :style="{ width: profileCompletion + '%', background: completionLevel.color }"
          />
        </div>
      </div>

      <div class="editor-tabs" role="tablist">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          class="tab-button"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- ========== IDENTITY ========== -->
      <section v-if="activeTab === 'identity'" class="form-section card glass">
        <div class="section-header">
          <div class="section-icon"><UserRound :size="18" /></div>
          <div>
            <h2>Profile Details</h2>
            <p class="section-desc">Basic information about you</p>
          </div>
        </div>

        <div class="form-row">
          <div>
            <label class="label" for="display-name">Display Name</label>
            <input id="display-name" v-model="form.displayName" class="input" maxlength="32" />
            <span class="field-hint">{{ form.displayName.length }}/32</span>
          </div>
          <div>
            <label class="label" for="pronouns">Pronouns</label>
            <input id="pronouns" v-model="form.pronouns" class="input" placeholder="they/them" maxlength="40" />
          </div>
        </div>

        <div>
          <div class="label-row">
            <label class="label" for="bio">About Me</label>
            <span class="char-count">{{ form.bio.length }}/190</span>
          </div>
          <textarea
            id="bio"
            v-model="form.bio"
            class="input textarea"
            placeholder="Opowiedz o sobie — co lubisz, czym się zajmujesz..."
            maxlength="190"
          />
        </div>

        <div class="form-row">
          <div>
            <label class="label" for="website">Website</label>
            <div class="input-with-icon">
              <Link :size="15" />
              <input id="website" v-model="form.website" placeholder="twoja-strona.pl" maxlength="120" />
            </div>
          </div>
          <div>
            <label class="label" for="location">Location</label>
            <div class="input-with-icon">
              <MapPin :size="15" />
              <input id="location" v-model="form.location" placeholder="Warszawa" maxlength="40" />
            </div>
          </div>
        </div>

        <div>
          <label class="label" for="timezone">Timezone</label>
          <GlassDropdown
            :model-value="form.timezone"
            :options="[{ value: '', label: 'Not set' }, ...TIMEZONES.map(tz => ({ value: tz, label: tz }))]"
            placeholder="Not set"
            @update:model-value="form.timezone = $event"
          />
        </div>

        <div v-if="isCreator" class="setting-item">
          <div class="setting-info">
            <div class="setting-title">👑 Site Creator</div>
            <div class="setting-desc">Wyświetl odznakę twórcy na profilu</div>
          </div>
          <label class="toggle">
            <input type="checkbox" :checked="form.badges.includes('creator')" @change="toggleBadge('creator')" />
            <span class="toggle-slider" />
          </label>
        </div>

        <div class="member-info">
          <Clock :size="14" />
          <span>Członek od <strong>{{ memberSince }}</strong></span>
          <span v-if="initialUser.profileViews" class="profile-views">
            <BarChart3 :size="14" />
            {{ initialUser.profileViews }} wyświetleń profilu
          </span>
        </div>
      </section>

      <!-- ========== APPEARANCE ========== -->
      <section v-if="activeTab === 'appearance'" class="form-section card glass">
        <div class="section-header">
          <div class="section-icon"><Palette :size="18" /></div>
          <div>
            <h2>Profile Style</h2>
            <p class="section-desc">Wygląd twojej karty profilowej</p>
          </div>
        </div>

        <div class="media-uploads">
          <div class="upload-block">
            <label class="label">Avatar</label>
            <div class="upload-row">
              <div class="upload-preview avatar-preview-wrap">
                <UserAvatar :user="previewUser" :size="64" />
              </div>
              <div class="upload-actions">
                <label class="btn btn-ghost btn-sm">
                  <input type="file" accept="image/*" class="file-input" @change="handleAvatarFile" />
                  {{ uploadingAvatar ? 'Przesyłanie...' : 'Prześlij avatar' }}
                </label>
                <button v-if="form.avatarUrl" class="btn btn-ghost btn-sm danger" @click="form.avatarUrl = ''">
                  <X :size="14" /> Usuń
                </button>
              </div>
            </div>
            <span class="field-hint">PNG/JPG/WebP/GIF, max 6MB. GIF animacje sa zachowane w oryginale.</span>
          </div>

          <div class="upload-block">
            <label class="label">Banner</label>
            <div class="upload-row">
              <div class="banner-preview" :style="bannerStyle" />
              <div class="upload-actions">
                <label class="btn btn-ghost btn-sm">
                  <input type="file" accept="image/*" class="file-input" @change="handleBannerFile" />
                  {{ uploadingBanner ? 'Przesyłanie...' : 'Prześlij banner' }}
                </label>
                <button v-if="form.bannerUrl" class="btn btn-ghost btn-sm danger" @click="form.bannerUrl = ''">
                  <X :size="14" /> Usuń
                </button>
              </div>
            </div>
            <span class="field-hint">Bez obrazka — kolor akcentu lub gradient.</span>
          </div>
        </div>

        <div>
          <label class="label">Accent Color</label>
          <div class="color-picker-grid">
            <button
              v-for="color in ACCENT_COLORS"
              :key="color"
              class="color-dot"
              :class="{ active: form.accentColor === color }"
              :style="{ background: color }"
              @click="form.accentColor = color"
            />
            <input v-model="form.accentColor" type="color" class="color-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="color-field">
            <label class="label" for="primary-color">Card Background</label>
            <div class="color-row">
              <input id="primary-color" :value="form.primaryColor || '#111318'" type="color" class="color-input" @input="form.primaryColor = ($event.target as HTMLInputElement).value" />
              <span class="color-hex">{{ form.primaryColor || '#111318' }}</span>
              <button v-if="form.primaryColor" class="btn btn-ghost btn-xs" @click="form.primaryColor = null">Reset</button>
            </div>
          </div>
        </div>

        <div>
          <label class="label">Username Effect</label>
          <div class="style-grid">
            <button
              v-for="style in DISPLAY_NAME_STYLES"
              :key="String(style.value)"
              class="style-option"
              :class="{ active: form.displayNameStyle === style.value }"
              @click="form.displayNameStyle = style.value"
            >
              <component :is="style.icon" :size="16" />
              <span>{{ style.label }}</span>
            </button>
          </div>
          <div class="style-preview-box">
            <span :class="form.displayNameStyle ? `name-style-${form.displayNameStyle}` : ''">
              {{ form.displayName.trim() || 'Nicori User' }}
            </span>
          </div>
        </div>

        <div>
          <label class="label">Profile Gradient</label>
          <GradientPicker v-model="form.profileGradient" />
        </div>

        <div>
          <label class="label">Avatar Frame</label>
          <div class="option-grid">
            <button
              v-for="frame in AVATAR_FRAMES"
              :key="String(frame.value)"
              class="option-card"
              :class="{ active: form.avatarFrame === frame.value }"
              @click="form.avatarFrame = frame.value"
            >
              <div class="option-dot" />
              <div>
                <strong>{{ frame.label }}</strong>
                <small>{{ frame.detail }}</small>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label class="label">Card Theme</label>
          <div class="option-grid">
            <button
              v-for="theme in PROFILE_THEMES"
              :key="theme.value"
              class="option-card"
              :class="{ active: form.profileTheme === theme.value }"
              @click="form.profileTheme = theme.value"
            >
              <div class="option-dot" />
              <div>
                <strong>{{ theme.label }}</strong>
                <small>{{ theme.detail }}</small>
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- ========== SOCIAL ========== -->
      <section v-if="activeTab === 'social'" class="form-section card glass">
        <div class="section-header">
          <div class="section-icon"><Globe :size="18" /></div>
          <div>
            <h2>Social Links</h2>
            <p class="section-desc">Pokaż swoje linki na profilu</p>
          </div>
        </div>

        <TransitionGroup name="list" tag="div" class="social-links-list">
          <div v-for="(link, index) in form.socialLinks" :key="link.platform + index" class="social-link-card">
            <div class="social-link-header">
              <span class="social-icon">{{ getSocialIcon(link.platform) }}</span>
              <GlassDropdown
                :model-value="link.platform"
                :options="SOCIAL_PLATFORMS.map(p => ({ value: p.id, label: p.label, icon: p.icon }))"
                class="social-select"
                @update:model-value="link.platform = $event"
              />
              <button class="btn btn-ghost btn-xs danger" @click="removeSocialLink(index)">
                <Trash2 :size="14" />
              </button>
            </div>
            <div class="social-link-url">
              <input
                v-model="link.url"
                class="input"
                :placeholder="getSocialPlatform(link.platform).placeholder"
                maxlength="200"
              />
            </div>
          </div>
        </TransitionGroup>

        <button
          v-if="form.socialLinks.length < SOCIAL_PLATFORMS.length"
          class="btn btn-ghost add-social-btn"
          @click="addSocialLink"
        >
          <Plus :size="16" />
          Dodaj link społecznościowy
        </button>

        <div v-if="form.socialLinks.length === 0" class="empty-social">
          <Globe :size="32" />
          <p>Nie masz jeszcze żadnych linków. Dodaj swoje profile!</p>
        </div>
      </section>

      <!-- ========== PRESENCE ========== -->
      <section v-if="activeTab === 'presence'" class="form-section card glass">
        <div class="section-header">
          <div class="section-icon"><MessageSquare :size="18" /></div>
          <div>
            <h2>Status & Activity</h2>
            <p class="section-desc">Zarządzaj swoim statusem widocznym dla innych</p>
          </div>
        </div>

        <div>
          <label class="label">Online Status</label>
          <div class="status-grid">
            <button
              v-for="status in STATUSES"
              :key="status.value"
              class="status-option"
              :class="{ active: form.status === status.value }"
              @click="form.status = status.value"
            >
              <div class="status-dot-icon" :style="{ background: status.color }" />
              <div>
                <strong>{{ status.label }}</strong>
                <small>{{ status.detail }}</small>
              </div>
            </button>
          </div>
        </div>

        <div>
          <div class="label-row">
            <label class="label" for="custom-status">Custom Status</label>
            <span class="char-count">{{ form.customStatus.length }}/128</span>
          </div>
          <input
            id="custom-status"
            v-model="form.customStatus"
            class="input"
            placeholder="Co robisz? 🎮 Listening to music..."
            maxlength="128"
          />
        </div>

        <div class="rich-presence-section">
          <div class="label-row">
            <label class="label">Nikari Rich Presence</label>
            <label class="toggle">
              <input type="checkbox" :checked="!!form.richPresence" @change="toggleRichPresence" />
              <span class="toggle-slider" />
            </label>
          </div>
          <p class="section-desc">Pokazuj innym co właśnie robisz</p>

          <div v-if="form.richPresence" class="rich-presence-editor">
            <div class="rp-preview card glass">
              <div class="rp-preview-icon">{{ form.richPresence.icon || '🎮' }}</div>
              <div class="rp-preview-info">
                <span class="rp-preview-label">{{ form.richPresence.label || 'Playing something...' }}</span>
                <span v-if="form.richPresence.details" class="rp-preview-details">{{ form.richPresence.details }}</span>
                <span v-if="form.richPresence.startedAt" class="rp-preview-time">
                  {{ formatElapsedTime(form.richPresence.startedAt) }}
                </span>
              </div>
            </div>

            <div>
              <div class="label-row">
                <label class="label" for="rp-label">Activity</label>
                <span class="char-count">{{ (form.richPresence.label || '').length }}/128</span>
              </div>
              <input
                id="rp-label"
                v-model="form.richPresence.label"
                class="input"
                placeholder="Playing Minecraft, Listening to Spotify..."
                maxlength="128"
              />
            </div>

            <div>
              <div class="label-row">
                <label class="label" for="rp-details">Details</label>
                <span class="char-count">{{ (form.richPresence.details || '').length }}/128</span>
              </div>
              <input
                id="rp-details"
                v-model="form.richPresence.details"
                class="input"
                placeholder="W budowie, Survival mode..."
                maxlength="128"
              />
            </div>

            <div>
              <label class="label" for="rp-icon">Icon (emoji or URL)</label>
              <input
                id="rp-icon"
                v-model="form.richPresence.icon"
                class="input"
                placeholder="🎮"
                maxlength="256"
              />
            </div>

            <button class="btn btn-ghost btn-sm danger" @click="form.richPresence = null">
              Wylacz Rich Presence
            </button>
          </div>
        </div>
      </section>

      <!-- ========== PRIVACY ========== -->
      <section v-if="activeTab === 'privacy'" class="form-section card glass">
        <div class="section-header">
          <div class="section-icon"><Shield :size="18" /></div>
          <div>
            <h2>Privacy Settings</h2>
            <p class="section-desc">Kto może widzieć twój profil</p>
          </div>
        </div>

        <div>
          <label class="label">Profile Visibility</label>
          <div class="privacy-grid">
            <button
              class="privacy-option"
              :class="{ active: form.profilePrivacy === 'public' }"
              @click="form.profilePrivacy = 'public'"
            >
              <Globe :size="20" />
              <strong>Public</strong>
              <small>Everyone can see your profile</small>
            </button>
            <button
              class="privacy-option"
              :class="{ active: form.profilePrivacy === 'friends' }"
              @click="form.profilePrivacy = 'friends'"
            >
              <Users :size="20" />
              <strong>Friends Only</strong>
              <small>Only friends can see your profile</small>
            </button>
            <button
              class="privacy-option"
              :class="{ active: form.profilePrivacy === 'private' }"
              @click="form.profilePrivacy = 'private'"
            >
              <EyeOff :size="20" />
              <strong>Private</strong>
              <small>Only you can see your profile</small>
            </button>
          </div>
        </div>

        <div class="privacy-toggles">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title"><Clock :size="15" /> Show Timezone</div>
              <div class="setting-desc">Pokaż swoją strefę czasową na profilu</div>
            </div>
            <label class="toggle">
              <input v-model="form.showTimezone" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title"><Circle :size="15" /> Show Last Seen</div>
              <div class="setting-desc">Pokaż kiedy byłeś ostatnio widziany</div>
            </div>
            <label class="toggle">
              <input v-model="form.showLastSeen" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title"><BarChart3 :size="15" /> Show Profile Views</div>
              <div class="setting-desc">Pokaż liczbę wyświetleń profilu</div>
            </div>
            <label class="toggle">
              <input v-model="form.showProfileViews" type="checkbox" />
              <span class="toggle-slider" />
            </label>
          </div>
        </div>
      </section>
    </div>

    <!-- ========== LIVE PREVIEW ========== -->
    <aside class="profile-preview">
      <h2 class="preview-title">Podgląd na żywo</h2>
      <div
        class="discord-card card glass"
        :class="previewUser.profileTheme ? `profile-theme-${previewUser.profileTheme}` : 'profile-theme-default'"
        :style="previewUser.primaryColor ? { backgroundColor: previewUser.primaryColor } : {}"
      >
        <div class="card-banner" :style="bannerStyle">
          <div v-if="form.status !== 'offline'" class="banner-status-dot" :style="{ background: STATUSES.find(s => s.value === form.status)?.color }" />
        </div>
        <div class="card-shell">
          <div class="avatar-row">
            <UserAvatar :user="previewUser" :size="86" />
            <div v-if="previewUser.badges?.length" class="badge-row">
              <ProfileBadge v-for="badge in previewUser.badges" :key="badge" :badge="badge" />
            </div>
          </div>

          <div class="name-block">
            <h3 :class="previewUser.displayNameStyle ? `name-style-${previewUser.displayNameStyle}` : ''">
              {{ previewUser.displayName }}
            </h3>
            <p class="username-line"><AtSign :size="13" />{{ previewUser.username }}</p>
            <span v-if="previewUser.pronouns" class="pronouns">{{ previewUser.pronouns }}</span>
          </div>

          <div v-if="previewUser.customStatus" class="custom-status">
            <Coffee :size="14" />
            {{ previewUser.customStatus }}
          </div>

          <div v-if="previewUser.bio" class="preview-section">
            <h4>O mnie</h4>
            <p>{{ previewUser.bio }}</p>
          </div>

          <div v-if="previewUser.website || previewUser.location || previewUser.timezone" class="profile-links">
            <a v-if="previewUser.website" :href="normalizedWebsite" target="_blank" rel="noreferrer">
              <Link :size="14" />
              {{ previewUser.website.replace(/^https?:\/\//, '') }}
            </a>
            <span v-if="previewUser.location">
              <MapPin :size="14" />
              {{ previewUser.location }}
            </span>
            <span v-if="form.showTimezone && previewUser.timezone">
              <Clock :size="14" />
              {{ previewUser.timezone }}
            </span>
          </div>

          <div v-if="previewUser.socialLinks?.length" class="preview-section social-preview">
            <h4>Links</h4>
            <div class="social-links-preview">
              <a
                v-for="(link, i) in previewUser.socialLinks"
                :key="i"
                :href="link.url"
                target="_blank"
                rel="noreferrer"
                class="social-link-chip"
              >
                <span>{{ getSocialIcon(link.platform) }}</span>
                {{ link.url.replace(/^https?:\/\//, '').slice(0, 30) }}
              </a>
            </div>
          </div>

          <div class="card-footer">
            <span v-if="form.showProfileViews && initialUser.profileViews">
              <BarChart3 :size="12" /> {{ initialUser.profileViews }} views
            </span>
            <span><Users :size="12" /> Member since {{ memberSince }}</span>
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
  position: relative;
}

.profile-bg-orbs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.profile-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  will-change: transform;
  transition: transform 0.5s ease-out;
}

.profile-orb--violet { width: 500px; height: 500px; top: -15%; right: 5%; background: rgba(139, 92, 246, 0.06); }
.profile-orb--pink { width: 400px; height: 400px; top: 40%; left: -10%; background: rgba(217, 70, 239, 0.04); }
.profile-orb--blue { width: 350px; height: 350px; top: 60%; right: -5%; background: rgba(59, 130, 246, 0.04); }
.profile-orb--teal { width: 300px; height: 300px; top: 10%; left: 30%; background: rgba(6, 182, 212, 0.03); animation: profileOrbDrift 20s ease-in-out infinite; }

@keyframes profileOrbDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(40px, -30px); } }

.profile-editor {
  position: relative;
  z-index: 1;
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

.profile-badge { display: inline-flex; align-items: center; gap: 6px; width: fit-content; }
.profile-title { color: var(--text-primary); font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 8px 0 0; }
.profile-desc { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.save-btn { min-width: 120px; }

.save-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.save-status.saving {
  color: var(--text-secondary);
  background: var(--bg-surface);
}

.save-status.saved {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.save-status.error {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  cursor: pointer;
}

.save-status.pending {
  color: var(--text-muted);
  background: var(--bg-surface);
}

.error-msg {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-size: 13px;
  padding: 10px 12px;
}

/* Completion Bar */
.completion-bar-wrap {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
}

.completion-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.completion-emoji { font-size: 16px; }
.completion-pct { margin-left: auto; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.completion-label strong { color: var(--text-primary); }

.completion-track {
  height: 6px;
  border-radius: 3px;
  background: var(--bg-primary);
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

/* Tabs */
.editor-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}

.tab-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
  transition: all 0.2s;
  position: relative;
}

.tab-button:hover, .tab-button.active {
  border-color: var(--border-accent);
  color: var(--text-primary);
  background: var(--bg-hover);
}

.tab-button.active { color: var(--accent-violet); }

.tab-count {
  font-size: 10px;
  background: var(--accent-violet);
  color: #fff;
  padding: 1px 5px;
  border-radius: 8px;
  font-weight: 700;
}

/* Form Sections */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-violet);
  flex-shrink: 0;
}

.section-header h2 { font-size: 16px; font-weight: 750; color: var(--text-primary); margin: 0; }
.section-desc { font-size: 13px; color: var(--text-muted); margin: 2px 0 0; }

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.label-row .label { margin-bottom: 0; }
.char-count { font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.field-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block; }

.textarea { min-height: 96px; resize: vertical; line-height: 1.45; }

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

.input-with-icon:focus-within { border-color: var(--accent-violet); box-shadow: 0 0 0 2px rgba(124, 90, 240, 0.15); }

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

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.profile-views { margin-left: auto; display: flex; align-items: center; gap: 4px; }

/* Media Uploads */
.media-uploads { display: flex; flex-direction: column; gap: 16px; }
.upload-block { display: flex; flex-direction: column; gap: 8px; }

.upload-row { display: flex; align-items: center; gap: 12px; }
.upload-actions { display: flex; gap: 8px; }

.avatar-preview-wrap {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-preview {
  width: 120px;
  height: 56px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.btn-sm { height: 34px; padding: 0 12px; font-size: 12px; }
.btn-xs { height: 26px; padding: 0 8px; font-size: 11px; }
.danger { color: var(--danger); }
.danger:hover { background: rgba(239, 68, 68, 0.1); }
.file-input { display: none; }

/* Color Picker */
.color-picker-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.color-dot:hover { transform: scale(1.15); }
.color-dot.active { border-color: #fff; box-shadow: 0 0 0 2px var(--accent-violet); }

.color-input { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 50%; padding: 2px; background: var(--bg-surface-2); cursor: pointer; }

.color-field { }
.color-row { display: flex; align-items: center; gap: 10px; }
.color-hex { font-family: ui-monospace, monospace; font-size: 13px; color: var(--text-muted); }

/* Style Grid */
.style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.style-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.style-option:hover { border-color: var(--text-muted); }
.style-option.active { border-color: var(--border-accent); background: rgba(139, 92, 246, 0.1); color: var(--accent-violet); }

.style-preview-box {
  margin-top: 8px;
  padding: 12px 16px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  color: var(--text-primary);
}

/* Option Grid */
.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.option-card:hover { border-color: var(--text-muted); }
.option-card.active { border-color: var(--border-accent); background: rgba(139, 92, 246, 0.1); }
.option-card strong { display: block; font-size: 13px; color: var(--text-primary); }
.option-card small { display: block; font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.option-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); flex-shrink: 0; }
.option-card.active .option-dot { background: var(--accent-violet); box-shadow: 0 0 8px var(--accent-violet); }

/* Status */
.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 10px 12px;
  text-align: left;
  transition: all 0.2s;
}

.status-option:hover { border-color: var(--text-muted); }
.status-option.active { border-color: var(--border-accent); background: rgba(139, 92, 246, 0.1); }
.status-option strong { display: block; font-size: 13px; color: var(--text-primary); }
.status-option small { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.status-dot-icon { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }

/* Social Links */
.social-links-list { display: flex; flex-direction: column; gap: 10px; }

.social-link-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  background: var(--bg-surface-2);
}

.social-link-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.social-icon { font-size: 18px; }
.social-select { max-width: 160px; height: 34px; font-size: 13px; }
.social-link-url { }
.social-link-url .input { width: 100%; }

.add-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  border-style: dashed;
}

.empty-social {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: var(--text-muted);
  text-align: center;
  font-size: 13px;
}

/* Privacy */
.privacy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.privacy-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.privacy-option:hover { border-color: var(--text-muted); }
.privacy-option.active { border-color: var(--border-accent); background: rgba(139, 92, 246, 0.1); color: var(--accent-violet); }
.privacy-option strong { font-size: 13px; color: var(--text-primary); }
.privacy-option small { font-size: 11px; color: var(--text-muted); }

.privacy-toggles { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.setting-info { flex: 1; }
.setting-title { font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }
.setting-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

/* Live Preview */
.profile-preview {
  position: sticky;
  top: 24px;
  align-self: start;
  z-index: 1;
}

.preview-title {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.discord-card {
  overflow: hidden;
  border-radius: 14px;
  background: #111318;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
}

.card-banner {
  height: 100px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.banner-status-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.3);
}

.card-shell { padding: 0 18px 18px; }

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

.badge-row { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; padding-bottom: 8px; }

.name-block { margin-top: 10px; }
.name-block h3 { color: var(--text-primary); font-size: 20px; font-weight: 800; overflow-wrap: anywhere; margin: 0; }

.username-line {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 2px;
}

.pronouns {
  display: inline-block;
  margin-top: 6px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.14);
  color: #c4b5fd;
  font-size: 11px;
  padding: 3px 8px;
}

.custom-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
  padding: 8px 10px;
  overflow-wrap: anywhere;
}

.preview-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.preview-section h4 {
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  margin: 0 0 6px;
}

.preview-section p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  overflow-wrap: anywhere;
}

.profile-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.profile-links a, .profile-links span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: none;
}

.profile-links a:hover { color: var(--accent-blue); }

.social-links-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.social-link-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
  text-decoration: none;
  transition: all 0.15s;
}

.social-link-chip:hover { border-color: var(--accent-violet); color: var(--text-primary); }

.card-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
}

.card-footer span { display: flex; align-items: center; gap: 4px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: all 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

.list-enter-active, .list-leave-active { transition: all 0.25s ease; }
.list-enter-from { opacity: 0; transform: translateX(-10px); }
.list-leave-to { opacity: 0; transform: translateX(10px); }

/* Rich Presence */
.rich-presence-section { display: flex; flex-direction: column; gap: 12px; }

.rich-presence-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-surface-2);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.rp-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.rp-preview-icon {
  font-size: 28px;
  line-height: 1;
}

.rp-preview-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rp-preview-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.rp-preview-details {
  font-size: 12px;
  color: var(--text-secondary);
}

.rp-preview-time {
  font-size: 11px;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 980px) {
  .profile-view { grid-template-columns: 1fr; }
  .profile-preview { position: static; max-width: 420px; }
}

@media (max-width: 640px) {
  .profile-view { padding: 20px; }
  .page-header, .header-actions { flex-direction: column; }
  .form-row, .status-grid, .editor-tabs, .privacy-grid, .style-grid, .option-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .profile-orb { animation: none !important; }
}
</style>
