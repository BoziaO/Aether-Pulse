const { app, BrowserWindow, shell, ipcMain, desktopCapturer, session } = require('electron')
const path = require('path')
const { exec } = require('child_process')

let mainWindow
let activityInterval = null
let lastPresenceState = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// ============================================================================
// Session Timer
// ============================================================================

const sessionStart = Date.now()

function getSessionDuration() {
  return Date.now() - sessionStart
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// ============================================================================
// Room State (from renderer)
// ============================================================================

let currentRoomInfo = null

// ============================================================================
// Game Detection
// ============================================================================

const GAME_SIGNATURES = [
  {
    id: 'steam',
    name: 'Steam',
    icon: 'steam',
    category: 'gaming',
    processes: ['steam', 'steam.exe', 'steamwebhelper.exe'],
  },
  {
    id: 'epic-games',
    name: 'Epic Games Launcher',
    icon: 'epic-games',
    category: 'gaming',
    processes: ['epicgameslauncher', 'epicgameslauncher.exe'],
  },
  {
    id: 'gog-galaxy',
    name: 'GOG Galaxy',
    icon: 'gog',
    category: 'gaming',
    processes: ['galaxyclient', 'galaxyclient.exe', 'goggalaxy.exe'],
  },
  {
    id: 'discord-game',
    name: 'Discord Game',
    icon: 'discord',
    category: 'gaming',
    processes: ['discord', 'discord.exe'],
  },
  {
    id: 'ubisoft-connect',
    name: 'Ubisoft Connect',
    icon: 'ubisoft',
    category: 'gaming',
    processes: ['ubisoftconnect', 'ubisoftconnect.exe'],
  },
  {
    id: 'battle.net',
    name: 'Battle.net',
    icon: 'battlenet',
    category: 'gaming',
    processes: ['battle.net.exe', 'agent.exe'],
  },
  {
    id: 'roblox',
    name: 'Roblox',
    icon: 'roblox',
    category: 'gaming',
    processes: ['roblox', 'roblox.exe', 'robloxplayerbeta.exe'],
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    icon: 'minecraft',
    category: 'gaming',
    processes: ['javaw.exe', 'minecraft', 'minecraft.exe'],
  },
]

// ============================================================================
// App Detection
// ============================================================================

const APP_SIGNATURES = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'spotify',
    category: 'music',
    processes: ['spotify'],
  },
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    icon: 'youtube-music',
    category: 'music',
    processes: ['youtube-music', 'youtube music'],
  },
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    icon: 'vscode',
    category: 'coding',
    processes: ['code', 'code.exe'],
  },
  {
    id: 'vscodium',
    name: 'VSCodium',
    icon: 'vscodium',
    category: 'coding',
    processes: ['codium', 'codium.exe', 'vscodium', 'vscodium.exe'],
  },
  {
    id: 'webstorm',
    name: 'WebStorm',
    icon: 'webstorm',
    category: 'coding',
    processes: ['webstorm', 'webstorm.exe', 'webstorm64.exe'],
  },
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    icon: 'intellij',
    category: 'coding',
    processes: ['idea', 'idea.exe', 'idea64.exe'],
  },
  {
    id: 'android-studio',
    name: 'Android Studio',
    icon: 'android-studio',
    category: 'coding',
    processes: ['studio', 'studio.exe', 'studio64.exe'],
  },
  {
    id: 'figma',
    name: 'Figma',
    icon: 'figma',
    category: 'design',
    processes: ['figma', 'figma.exe'],
  },
  {
    id: 'blender',
    name: 'Blender',
    icon: 'blender',
    category: 'design',
    processes: ['blender', 'blender.exe'],
  },
  {
    id: 'photoshop',
    name: 'Adobe Photoshop',
    icon: 'photoshop',
    category: 'design',
    processes: ['photoshop', 'photoshop.exe'],
  },
  {
    id: 'premiere',
    name: 'Adobe Premiere Pro',
    icon: 'premiere',
    category: 'media',
    processes: ['premiere', 'premiere.exe'],
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    icon: 'obsidian',
    category: 'productivity',
    processes: ['obsidian', 'obsidian.exe'],
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: 'notion',
    category: 'productivity',
    processes: ['notion', 'notion.exe'],
  },
]

const ALL_SIGNATURES = [...GAME_SIGNATURES, ...APP_SIGNATURES]

// ============================================================================
// Animated Status Themes
// ============================================================================

const PRESENCE_THEMES = {
  default: {
    id: 'default',
    name: 'Domyslny',
    formatActivity: (app) => app.name,
    formatRoom: (room) => `${room.name} (${room.memberCount || 0}/${room.maxMembers || 10})`,
    formatSession: (dur) => `Sesja: ${dur}`,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalistyczny',
    formatActivity: (app) => app.name,
    formatRoom: (room) => room.name,
    formatSession: (dur) => dur,
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming',
    formatActivity: (app) => `Granie w ${app.name}`,
    formatRoom: (room) => `${room.name} | ${room.memberCount || 0} graczy`,
    formatSession: (dur) => `Grasz od ${dur}`,
  },
  cozy: {
    id: 'cozy',
    name: 'Przytulny',
    formatActivity: (app) => `Usluchuje ${app.name}`,
    formatRoom: (room) => `${room.name} z ${room.memberCount || 0} osobami`,
    formatSession: (dur) => `Juz ${dur}`,
  },
  hacker: {
    id: 'hacker',
    name: 'Hacker',
    formatActivity: (app) => `>> ${app.name}`,
    formatRoom: (room) => `[${room.memberCount || 0}/${room.maxMembers || 10}] ${room.name}`,
    formatSession: (dur) => `UP: ${dur}`,
  },
}

let currentTheme = 'default'
let animatedFrame = 0
let animatedInterval = null

// ============================================================================
// Process Detection
// ============================================================================

function getProcessList() {
  return new Promise((resolve) => {
    const platform = process.platform
    let cmd

    if (platform === 'win32') {
      cmd = 'tasklist /FO CSV /NH'
    } else if (platform === 'darwin') {
      cmd = 'ps -axo comm'
    } else {
      cmd = 'ps -axo comm --no-headers'
    }

    exec(cmd, { timeout: 5000 }, (error, stdout) => {
      if (error) {
        resolve([])
        return
      }

      const lines = stdout.split('\n').filter(Boolean)
      const processes = []

      for (const line of lines) {
        if (platform === 'win32') {
          const match = line.match(/^"([^"]+)"/)
          if (match) {
            processes.push(path.basename(match[1]).toLowerCase())
          }
        } else {
          const name = path.basename(line.trim()).toLowerCase()
          if (name) processes.push(name)
        }
      }

      resolve([...new Set(processes)])
    })
  })
}

async function detectActiveApps() {
  const processes = await getProcessList()
  const detected = []

  for (const signature of ALL_SIGNATURES) {
    const found = signature.processes.some((p) =>
      processes.some((proc) => proc === p || proc.startsWith(p))
    )
    if (found) {
      detected.push({
        id: signature.id,
        name: signature.name,
        icon: signature.icon,
        category: signature.category,
      })
    }
  }

  return detected
}

// ============================================================================
// Presence Builder
// ============================================================================

function buildPresenceState(activities) {
  const theme = PRESENCE_THEMES[currentTheme] || PRESENCE_THEMES.default
  const duration = getSessionDuration()
  const formattedDuration = formatDuration(duration)

  const apps = activities.filter((a) => a.category !== 'gaming')
  const games = activities.filter((a) => a.category === 'gaming')

  const lines = []

  // Room line
  if (currentRoomInfo) {
    lines.push({
      text: theme.formatRoom(currentRoomInfo),
      icon: 'room',
      animated: false,
    })
  }

  // Activity lines
  for (const app of apps) {
    lines.push({
      text: theme.formatActivity(app),
      icon: app.icon,
      animated: false,
    })
  }

  // Game lines
  for (const game of games) {
    lines.push({
      text: theme.formatActivity(game),
      icon: game.icon,
      animated: currentTheme === 'gaming',
    })
  }

  // Session line
  lines.push({
    text: theme.formatSession(formattedDuration),
    icon: 'session',
    animated: false,
  })

  return {
    theme: currentTheme,
    sessionId: sessionStart,
    sessionDuration: duration,
    sessionFormatted: formattedDuration,
    room: currentRoomInfo,
    activities: apps,
    games: games,
    lines: lines,
    rawActivities: activities,
    timestamp: Date.now(),
  }
}

// ============================================================================
// Activity Polling & Animation
// ============================================================================

function stateKey(state) {
  if (!state) return ''
  return JSON.stringify({
    room: state.room,
    acts: state.rawActivities.map((a) => a.id),
    theme: state.theme,
  })
}

async function pollActivity() {
  const activities = await detectActiveApps()
  const state = buildPresenceState(activities)
  const key = stateKey(state)
  const prevKey = stateKey(lastPresenceState)

  if (key !== prevKey) {
    lastPresenceState = state
    notifyRenderer('presence-changed', state)
  } else if (lastPresenceState) {
    lastPresenceState.sessionDuration = getSessionDuration()
    lastPresenceState.sessionFormatted = formatDuration(getSessionDuration())
    if (lastPresenceState.lines.length > 0) {
      const sessionLine = lastPresenceState.lines.find((l) => l.icon === 'session')
      if (sessionLine) {
        sessionLine.text = PRESENCE_THEMES[currentTheme].formatSession(
          lastPresenceState.sessionFormatted
        )
      }
    }
    lastPresenceState.timestamp = Date.now()
    notifyRenderer('presence-tick', lastPresenceState)
  }
}

function notifyRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

function startActivityDetection() {
  stopActivityDetection()
  pollActivity()
  activityInterval = setInterval(pollActivity, 5000)
}

function stopActivityDetection() {
  if (activityInterval) {
    clearInterval(activityInterval)
    activityInterval = null
  }
}

// ============================================================================
// Window Creation
// ============================================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Nicori',
    icon: isDev
      ? path.join(__dirname, '..', 'public', 'icons', 'logo.png')
      : path.join(__dirname, '..', 'dist', 'icons', 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      sandbox: true,
    },
  })

  mainWindow.setMenuBarVisibility(false)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174/app')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      hash: '#/app',
    })
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ============================================================================
// IPC Handlers
// ============================================================================

ipcMain.handle('get-desktop-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 320, height: 180 },
  })
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL(),
  }))
})

ipcMain.handle('get-current-activity', () => {
  return lastPresenceState || buildPresenceState([])
})

ipcMain.handle('get-presence-state', () => {
  return lastPresenceState || buildPresenceState([])
})

ipcMain.handle('get-app-signatures', () => {
  return ALL_SIGNATURES.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    category: s.category,
  }))
})

ipcMain.handle('get-session-info', () => ({
  startedAt: sessionStart,
  duration: getSessionDuration(),
  formatted: formatDuration(getSessionDuration()),
}))

ipcMain.on('set-room-info', (_event, roomInfo) => {
  currentRoomInfo = roomInfo
    ? {
        id: roomInfo.id,
        name: roomInfo.name,
        memberCount: roomInfo.memberCount || 0,
        maxMembers: roomInfo.maxMembers || 10,
        isActive: roomInfo.isActive || false,
      }
    : null
  pollActivity()
})

ipcMain.on('set-presence-theme', (_event, themeId) => {
  if (PRESENCE_THEMES[themeId]) {
    currentTheme = themeId
    pollActivity()
  }
})

ipcMain.handle('get-presence-themes', () => {
  return Object.values(PRESENCE_THEMES).map((t) => ({
    id: t.id,
    name: t.name,
  }))
})

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowed = [
        'media',
        'fullscreen',
        'clipboard-read',
        'clipboard-sanitized-write',
        'window-management',
        'display-capture',
        'notifications',
      ]
      callback(allowed.includes(permission))
    }
  )

  createWindow()
  startActivityDetection()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopActivityDetection()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopActivityDetection()
})

// WebRTC optimizations
app.commandLine.appendSwitch(
  'enable-features',
  'WebRTCPipeWireCapturer,WebRTC-H264WithSVC'
)
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,WebRTC-legacy-DTS')
