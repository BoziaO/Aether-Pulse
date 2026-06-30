const TRACKING_KEYS = [
  '_ga',
  '_gid',
  '_gat',
  '__utm',
  '_fbp',
  '_fbc',
  'fr',
  'sb',
  'wd',
  '_gcl',
  '_hj',
  'hubspot',
  'intercom',
  'amplitude',
  'mixpanel',
  'segment',
  'hotjar',
  'fullstory',
  'heap',
  'pendo',
  'sentry',
  'datadog',
]

const TRACKING_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'doubleclick.net',
  'hotjar.com',
  'fullstory.com',
  'amplitude.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'hubspot.com',
  'intercom.io',
  'sentry.io',
  'datadoghq.com',
  'pendo.io',
  'heap.io',
]

function cleanupCookies() {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const name = cookie.split('=')[0].trim()
    if (TRACKING_KEYS.some((key) => name.startsWith(key))) {
      const domain = window.location.hostname
      const parts = domain.split('.')
      for (let i = 0; i < parts.length; i++) {
        const d = '.' + parts.slice(i).join('.')
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${d}`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    }
  }
}

function blockTrackingScripts() {
  const scripts = document.querySelectorAll('script[src]')
  scripts.forEach((script) => {
    const src = script.getAttribute('src') || ''
    if (TRACKING_DOMAINS.some((d) => src.includes(d))) {
      script.remove()
    }
  })
}

function blockTrackingRequests() {
  const originalFetch = window.fetch
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (TRACKING_DOMAINS.some((d) => url.includes(d))) {
      return Promise.resolve(new Response('Blocked', { status: 200 }))
    }
    return originalFetch.call(this, input, init)
  }

  const originalXHR = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async: boolean = true) {
    const urlStr = typeof url === 'string' ? url : url.href
    if (TRACKING_DOMAINS.some((d) => urlStr.includes(d))) {
      return
    }
    return originalXHR.call(this, method, url, async)
  }
}

function setPrivacyHeaders() {
  const meta = document.createElement('meta')
  meta.name = 'referrer'
  meta.content = 'no-referrer'
  document.head.appendChild(meta)
}

function preventFingerprinting() {
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: string,
    attrs?: CanvasRenderingContext2DSettings
  ) {
    if (type === '2d') {
      const ctx = originalGetContext.call(this, type, attrs) as CanvasRenderingContext2D | null
      if (ctx) {
        const originalGetImageData = ctx.getImageData.bind(ctx)
        ctx.getImageData = function (...args: [number, number, number, number]) {
          const imageData = originalGetImageData(...args)
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] ^= 1
          }
          return imageData
        }
      }
      return ctx
    }
    return originalGetContext.call(this, type, attrs)
  } as typeof HTMLCanvasElement.prototype.getContext
}

export const privacy = {
  init() {
    cleanupCookies()
    blockTrackingScripts()
    blockTrackingRequests()
    setPrivacyHeaders()
    preventFingerprinting()
  },

  cleanupCookies,

  getPrivacyHeaders(): Record<string, string> {
    return {
      'Referrer-Policy': 'no-referrer',
      'X-Tracking-Blocked': 'true',
    }
  },

  reportViolation(type: string, details: string) {
    if (import.meta.env.DEV) {
      console.warn(`[Privacy] Tracking attempt blocked: ${type} - ${details}`)
    }
  },
}
